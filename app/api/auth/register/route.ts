import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { ensureInviteCode } from "@/lib/coupon";
import { customAlphabet } from "nanoid";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

function getCallbackUrl(req: NextRequest): string {
  const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  return `${base.replace(/\/$/, "")}/api/auth/callback`;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCouponCode(): string {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);
  return `COUP-${nanoid()}-${nanoid()}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";

    // 输入验证
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
      return NextResponse.json(
        { error: "邮箱格式无效" },
        { status: 400 }
      );
    }

    if (email.length > 254) {
      return NextResponse.json(
        { error: "邮箱长度过长" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册，请直接登录" },
        { status: 400 }
      );
    }

    // 验证邀请码
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

    // 在事务外生成欢迎文案（涉及网络 IO）
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

    // 事务：创建用户、邀请码使用记录、优惠券、邀请码
    let couponIssued = false;
    let newUserId: string | null = null;

    await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          role: "USER",
        },
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
              welcomeText: newUserWelcomeText || `${name}，欢迎加入饭否！这张券是送给你的第一份礼物，用它免费参加一次心仪的活动吧。`,
              expiresAt,
              reason: "REGISTER",
            },
          });

          await tx.freeCoupon.create({
            data: {
              code: generateCouponCode(),
              userId: inviteCodeRecord.ownerId,
              welcomeText: inviterWelcomeText || `你邀请的朋友${name}已加入饭否！这张券是我们的感谢，期待你们在饭否聚会中相遇。`,
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

    // 事务外生成邀请码（避免事务过长）
    if (newUserId) {
      try {
        const newUserCode = await ensureInviteCode(newUserId);
        console.log("Generated invite code for new user:", newUserCode);
      } catch (err) {
        console.error("Failed to generate invite code for new user:", err);
      }
    }

    // 发送 Magic Link
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getCallbackUrl(req),
      },
    });

    if (error) {
      console.error("Supabase magic link error:", error);
      // 注意：用户已经创建成功，但邮件发送失败。返回提示信息让用户去登录页重试
      return NextResponse.json(
        {
          error: `注册成功，但邮件发送失败。请前往登录页重新发送验证链接。错误详情: ${error.message}`,
          userCreated: true,
        },
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
      { error: `注册失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
