import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || "https://lwercdnrvxrsnjjvojfx.supabase.co";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// 邮箱验证正则
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // 验证邮箱
    if (!email) {
      return NextResponse.json({ error: "邮箱为必填项" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "邮箱格式无效" }, { status: 400 });
    }

    // 限制邮箱长度
    if (email.length > 254) {
      return NextResponse.json({ error: "邮箱长度过长" }, { status: 400 });
    }

    // 检查用户是否存在，如果不存在则创建
    let user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email,
          name: email.split("@")[0],
          role: "USER",
        },
      });
    }

    // 使用Supabase官方magic link - PKCE flow，code在query里
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://meal-meet.com/api/auth/callback",
      },
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
      { error: `发生错误: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
