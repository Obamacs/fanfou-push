import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSupabaseServerClient } from "@/lib/supabase";

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
        { error: `发送邮件失败: ${error.message}` },
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
      {
        error: `发生错误: ${
          error instanceof Error ? error.message : "未知错误"
        }`,
      },
      { status: 500 }
    );
  }
}
