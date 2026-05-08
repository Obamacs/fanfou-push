import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables: SUPABASE_URL, SUPABASE_ANON_KEY");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    console.log("🔐 Auth callback - Full URL:", req.url);

    // 处理 Supabase 错误
    if (error) {
      console.error("❌ Supabase error:", error, errorDescription);
      return NextResponse.redirect(
        new URL(`/login?error=auth_failed&details=${encodeURIComponent(error)}`, req.url)
      );
    }

    if (!code) {
      console.error("❌ No code in callback URL");
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    const supabase = getSupabase();

    console.log("🔄 Exchanging code for session...");
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("❌ Code exchange failed:", exchangeError);
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    if (!data.user?.email) {
      console.error("❌ No email in session data");
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    const userEmail = data.user.email;
    console.log("✅ Supabase session established for:", userEmail);

    // 用 upsert 原子地确保用户存在并标记邮箱已验证（处理 magic-link 直接登录未注册用户的场景）
    const user = await db.user.upsert({
      where: { email: userEmail },
      update: { emailVerified: new Date() },
      create: {
        email: userEmail,
        name: userEmail.split("@")[0],
        role: "USER",
        emailVerified: new Date(),
      },
    });

    console.log("✅ User verified:", userEmail);

    // 创建 NextAuth 一次性 token 用于桥接建立 NextAuth session（15 分钟 TTL，缓冲邮件延迟）
    const bridgeToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await db.verificationToken.create({
      data: {
        identifier: userEmail,
        token: bridgeToken,
        expires: expiresAt,
      },
    });

    console.log("✅ Bridge token created for NextAuth session");

    // 根据用户 onboarding 状态决定跳转目标
    const nextPath = user.isOnboarded ? "/dashboard" : "/onboarding";

    // 重定向到客户端桥接页面来建立 NextAuth session
    const bridgeUrl = new URL("/auth/bridge", req.url);
    bridgeUrl.searchParams.set("token", bridgeToken);
    bridgeUrl.searchParams.set("email", userEmail);
    bridgeUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(bridgeUrl);
  } catch (error) {
    console.error("❌ Auth callback error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}
