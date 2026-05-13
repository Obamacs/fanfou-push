import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSupabaseServerClient } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCallbackUrl(req: NextRequest): string {
  const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  return `${base.replace(/\/$/, "")}/api/auth/callback`;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

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
    const emailLimit = checkRateLimit(`magiclink:email:${email.toLowerCase()}`, {
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
    const ipLimit = checkRateLimit(`magiclink:ip:${ip}`, {
      maxRequests: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }

    let user = await db.user.findUnique({ where: { email } });
    if (!user) {
      user = await db.user.create({
        data: { email, name: email.split("@")[0], role: "USER" },
      });
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getCallbackUrl(req) },
    });

    if (error) {
      console.error("Supabase magic link error:", error);
      return NextResponse.json(
        { error: "发送邮件失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "验证链接已发送到你的邮箱，请检查邮件",
      email,
    });
  } catch (error) {
    console.error("Magic link error:", error);
    return NextResponse.json(
      { error: "发生错误，请稍后重试" },
      { status: 500 }
    );
  }
}
