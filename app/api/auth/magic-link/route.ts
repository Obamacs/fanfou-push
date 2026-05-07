import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 使用真实的Supabase URL用于邮件发送，不通过Cloudflare代理
const supabaseUrl = process.env.SUPABASE_URL || "https://lwercdnrvxrsnjjvojfx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱为必填项" }, { status: 400 });
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

    // 使用Supabase官方magic link - token会在URL hash里
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://meal-meet.com/auth/callback",
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
