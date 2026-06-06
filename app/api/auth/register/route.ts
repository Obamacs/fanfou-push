import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureInviteCode, validateInviteCode } from "@/lib/coupon";
import { customAlphabet } from "nanoid";
import { checkRateLimit, refundRateLimit } from "@/lib/rate-limit";
import { sendAlert } from "@/lib/alert";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateCouponCode(): string {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);
  return `COUP-${nanoid()}-${nanoid()}`;
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
    const ipLimit = await checkRateLimit(`register:ip:${ip}`, {
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

    const SYSTEM_PROMO_CODES = ["MEAL2026", "WELCOME", "TIMELEFT", "FANFOU"];
    let inviteCodeRecord = null;
    let inviteCodeValid = false;
    let isSystemPromoCode = false;
    if (inviteCode) {
      const trimmedCode = inviteCode.trim().toUpperCase();
      if (SYSTEM_PROMO_CODES.includes(trimmedCode)) {
        inviteCodeValid = true;
        isSystemPromoCode = true;
      } else {
        const validation = await validateInviteCode(trimmedCode);
        if (validation.valid && validation.invite) {
          inviteCodeValid = true;
          inviteCodeRecord = validation.invite;
        }
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

      if (inviteCodeValid) {
        try {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 90);

          if (isSystemPromoCode) {
            const trimmedCode = inviteCode.trim().toUpperCase();
            await tx.freeCoupon.create({
              data: {
                code: generateCouponCode(),
                userId: newUser.id,
                welcomeText: `${name}，欢迎加入饭否！您已成功激活官方营销特权礼包【${trimmedCode}】，在此为您送上一张全额免费活动组织餐券，开启您的同城盲盒社交聚餐吧。`,
                expiresAt,
                reason: "REGISTER",
              },
            });
            couponIssued = true;
          } else if (inviteCodeRecord) {
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
          }
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

    const requestHost = new URL(req.url).hostname;
    const isLocalDevRequest =
      requestHost === "localhost" ||
      requestHost === "127.0.0.1" ||
      requestHost === "[::1]";

    // Dev direct login bypass (local-only, never expose tokens on hosted domains)
    if (process.env.NODE_ENV === "development" && isLocalDevRequest) {
      const { createHash } = await import("crypto");
      const { nanoid } = await import("nanoid");
      const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

      const devToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      await db.verificationToken.create({
        data: {
          identifier: email,
          token: hashToken(devToken),
          expires: expiresAt,
        },
      });

      const nextPath = "/onboarding"; // New registration always starts at onboarding
      const localBase = new URL(req.url).origin;
      const devLoginUrl = `${localBase}/auth/bridge?token=${devToken}&email=${encodeURIComponent(email)}&next=${nextPath}`;

      console.log("\n🔑 [Dev Mode Register Direct Link Generated] -------");
      console.log(`📧 User: ${email}`);
      console.log(`🔗 Direct Login Link: \x1b[36m${devLoginUrl}\x1b[0m`);
      console.log("---------------------------------------------------\n");

      return NextResponse.json({
        message: "【开发环境】注册成功！免密登录链接已生成，请在终端控制台或下方查看并复制",
        couponIssued,
        inviteCodeValid,
        email,
        devLoginUrl,
      });
    }

    // Try custom email flow (works in China). Do not fall back to Supabase.
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendMagicLinkEmail } = await import("@/lib/email");
        const { createHash } = await import("crypto");
        const { nanoid } = await import("nanoid");
        const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

        const token = nanoid(32);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        await db.verificationToken.create({
          data: {
            identifier: email,
            token: hashToken(token),
            expires: expiresAt,
          },
        });

        const nextPath = "/onboarding"; // New registration always starts at onboarding
        const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
        const magicLink = `${base.replace(/\/$/, "")}/auth/bridge?token=${token}&email=${encodeURIComponent(email)}&next=${nextPath}`;

        await sendMagicLinkEmail(email, magicLink);

        return NextResponse.json({
          message: "注册成功！验证链接已发送到你的邮箱，请检查邮件",
          couponIssued,
          inviteCodeValid,
          email,
        });
      } catch (err: any) {
        console.error("Custom register magic link error:", err);
        await sendAlert("发送注册验证邮件失败", err.message || "Unknown Error", { email });
        // Refund rate limit since email sending failed
        await refundRateLimit(`register:ip:${ip}`);
        return NextResponse.json(
          { error: "注册成功，但发送验证邮件失败，请稍后前往登录页重试。" },
          { status: 500 }
        );
      }
    }

    // If Resend is not configured, return an error. Do not fall back to Supabase.
    console.error("RESEND_API_KEY is not configured in production environment during registration.");
    return NextResponse.json(
      { error: "注册成功，但系统未配置邮件发送服务，请联系管理员" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    await sendAlert("用户注册失败 (严重异常)", error.message || "Unknown Error");
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
