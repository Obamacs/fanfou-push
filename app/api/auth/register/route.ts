import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureInviteCode } from "@/lib/coupon";
import { customAlphabet } from "nanoid";
import { getSupabaseServerClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCouponCode(): string {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);
  return `COUP-${nanoid()}-${nanoid()}`;
}

function getCallbackUrl(req: NextRequest): string {
  const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  return `${base.replace(/\/$/, "")}/api/auth/callback`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const inviteCode =
      typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";

    if (!name || !email) {
      return NextResponse.json(
        { error: "名字和邮箱为必填项" },
        { status: 400 }
      );
    }
    if (name.length < 2 || name.length > 50) {
      return NextResponse.json(
        { error: "名字长度应在 2-50 个字符之间" },
        { status: 400 }
      );
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "邮箱格式无效" }, { status: 400 });
    }
    if (email.length > 254) {
      return NextResponse.json({ error: "邮箱长度过长" }, { status: 400 });
    }

    // Rate limit: 3 registrations per IP per hour
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipLimit = checkRateLimit(`register:ip:${ip}`, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "注册请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      // 返回通用消息，避免邮箱枚举
      return NextResponse.json(
        { message: "如果该邮箱可用，验证链接将发送到你的邮箱" },
        { status: 200 }
      );
    }

    let inviteCodeRecord = null;
    let inviteCodeValid = false;
    if (inviteCode) {
      const trimmedCode = inviteCode.toUpperCase();
      inviteCodeRecord = await db.inviteCode.findUnique({
        where: { code: trimmedCode },
      });
      if (inviteCodeRecord && inviteCodeRecord.isActive) {
        inviteCodeValid = true;
      }
    }

    let newUserWelcomeText = "";
    let inviterWelcomeText = "";
    if (inviteCodeValid && inviteCodeRecord) {
      try {
        const { generateCouponWelcomeText } = await import("@/lib/claude");
        newUserWelcomeText = await generateCouponWelcomeText(name);
        const inviter = await db.user.findUnique({
          where: { id: inviteCodeRecord.ownerId },
        });
        if (inviter) {
          inviterWelcomeText = await generateCouponWelcomeText(inviter.name);
        }
      } catch (err) {
        console.error("Failed to generate welcome texts:", err);
      }
    }

    let couponIssued = false;
    let newUserId: string | null = null;

    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, name, role: "USER" },
      });
      newUserId = newUser.id;

      if (inviteCodeValid && inviteCodeRecord) {
        try {
          await tx.inviteCodeUsage.create({
            data: {
              inviteCodeId: inviteCodeRecord.id,
              newUserId: newUser.id,
            },
          });
          await tx.inviteCode.update({
            where: { id: inviteCodeRecord.id },
            data: { usageCount: { increment: 1 } },
          });

          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 90);

          await tx.freeCoupon.create({
            data: {
              code: generateCouponCode(),
              userId: newUser.id,
              welcomeText:
                newUserWelcomeText ||
                `${name}，欢迎加入！这张券是送给你的第一份礼物，用它免费参加一次心仪的活动吧。`,
              expiresAt,
              reason: "REGISTER",
            },
          });
          await tx.freeCoupon.create({
            data: {
              code: generateCouponCode(),
              userId: inviteCodeRecord.ownerId,
              welcomeText:
                inviterWelcomeText ||
                `你邀请的朋友${name}已注册成功！这张券是我们的感谢，期待你们在聚会中相遇。`,
              expiresAt,
              reason: "INVITED_SOMEONE",
            },
          });
          couponIssued = true;
        } catch (err) {
          console.error("Failed to process invite code:", err);
        }
      }
    });

    if (newUserId) {
      try {
        await ensureInviteCode(newUserId);
      } catch (err) {
        console.error("Failed to generate invite code for new user:", err);
      }
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getCallbackUrl(req) },
    });

    if (error) {
      console.error("Supabase magic link error:", error);
      return NextResponse.json(
        { error: "注册成功，但邮件发送失败。请前往登录页重新发送验证链接。" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "注册成功！验证链接已发送到你的邮箱",
      couponIssued,
      inviteCodeValid,
      email,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
