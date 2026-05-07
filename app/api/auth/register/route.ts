import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 使用真实的Supabase URL用于邮件发送，不通过Cloudflare代理
const supabaseUrl = process.env.SUPABASE_URL || "https://lwercdnrvxrsnjjvojfx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "名字和邮箱为必填项" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    const user = await db.user.create({
      data: {
        email,
        name,
        role: "USER",
      },
    });

    // 发送magic link - Supabase会在邮件中发送code参数
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
      message: "注册成功！验证链接已发送到你的邮箱",
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: `注册失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
