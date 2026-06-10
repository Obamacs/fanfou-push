import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, refundRateLimit } from "@/lib/rate-limit";
import { sendMagicLinkEmail } from "@/lib/email";
import { createHash } from "crypto";
import { nanoid } from "nanoid";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ error: "邮箱为必填项" }, { status: 400 });
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "邮箱格式无效" }, { status: 400 });
    }
    if (email.length > 254) {
      return NextResponse.json({ error: "邮箱长度过长" }, { status: 400 });
    }

    // Rate limit: 3 requests per email per 5 minutes
    const emailLimit = await checkRateLimit(`magiclink:email:${email}`, {
      maxRequests: 3,
      windowMs: 5 * 60 * 1000,
    });
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } }
      );
    }

    // Rate limit: 10 requests per IP per 15 minutes
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ipLimit = await checkRateLimit(`magiclink:ip:${ip}`, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }

    // Ensure user exists
    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: { email, name: email.split("@")[0], role: "USER" },
      });
    }

    const requestHost = new URL(req.url).hostname;
    const isLocalDevRequest =
      requestHost === "localhost" ||
      requestHost === "127.0.0.1" ||
      requestHost === "[::1]";

    // Dev direct login bypass (local-only, never expose tokens on hosted domains)
    if (process.env.NODE_ENV === "development" && isLocalDevRequest) {
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

      const nextPath = user.isOnboarded ? "/dashboard" : "/onboarding";
      const localBase = new URL(req.url).origin;
      const devLoginUrl = `${localBase}/auth/bridge?token=${devToken}&email=${encodeURIComponent(email)}&next=${nextPath}`;

      console.log("\n🔑 [Dev Mode Magic Link Generated] ----------------");
      console.log(`📧 User: ${email}`);
      console.log(`🔗 Direct Login Link: \x1b[36m${devLoginUrl}\x1b[0m`);
      console.log("---------------------------------------------------\n");

      return NextResponse.json({
        message: "【开发环境】免密登录链接已生成，请在终端控制台或下方查看并复制",
        email,
        devLoginUrl,
      });
    }

    // If Resend is configured, generate a local token and send email directly via Resend.
    // This is 100% GFW-proof as it bypasses Supabase Auth entirely for magic link generation.
    if (process.env.RESEND_API_KEY) {
      try {
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

        const nextPath = user.isOnboarded ? "/dashboard" : "/onboarding";
        const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
        const magicLink = `${base.replace(/\/$/, "")}/auth/bridge?token=${token}&email=${encodeURIComponent(email)}&next=${nextPath}`;

        await sendMagicLinkEmail(email, magicLink);

        return NextResponse.json({
          message: "验证链接已发送到你的邮箱，请检查邮件",
          email,
        });
      } catch (err) {
        console.error("Custom magic link error:", err);
        // Refund rate limit since email sending failed, avoiding unfair lockouts
        await refundRateLimit(`magiclink:email:${email}`);
        await refundRateLimit(`magiclink:ip:${ip}`);
        return NextResponse.json(
          { error: "发送邮件失败，请稍后重试" },
          { status: 500 }
        );
      }
    }

    // If Resend is not configured, return an error. Do not fall back to Supabase.
    console.error("RESEND_API_KEY is not configured in production environment.");
    return NextResponse.json(
      { error: "系统未配置邮件发送服务，请联系管理员" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { error: "发生错误，请稍后重试" },
      { status: 500 }
    );
  }
}
