import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";

// 使用真实的Supabase URL用于验证，不通过Cloudflare代理
const supabaseUrl = process.env.SUPABASE_URL || "https://lwercdnrvxrsnjjvojfx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    console.log("Magic link callback - token_hash:", token_hash, "type:", type);

    if (!token_hash || type !== "magiclink") {
      console.error("Invalid token or type");
      return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));
    }

    // 使用token_hash和type验证OTP
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: "magiclink",
    });

    console.log("Verify OTP result:", { data, error });

    if (error) {
      console.error("Token verification error:", error);
      return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));
    }

    if (!data.user?.email) {
      console.error("No email in verified user");
      return NextResponse.redirect(new URL("/login?error=invalid_token", req.url));
    }

    const email = data.user.email;

    // 确保用户存在于数据库
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

    // 标记邮箱为已验证
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // 使用NextAuth登录用户
    await signIn("credentials", {
      email,
      password: "magic-link-verified",
      redirect: false,
    });

    // 重定向到onboarding或dashboard
    if (!user.isOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Magic link callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_error", req.url));
  }
}
