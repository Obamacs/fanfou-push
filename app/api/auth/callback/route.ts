import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const supabaseUrl = process.env.SUPABASE_URL || "https://lwercdnrvxrsnjjvojfx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent(error)}`, req.url));
    }

    if (!code) {
      console.error("❌ No code in callback URL");
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

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
    console.log("✅ Session established for:", userEmail);

    // 确保用户存在并标记邮箱已验证
    let user = await db.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log("📝 Creating new user:", userEmail);
      user = await db.user.create({
        data: {
          email: userEmail,
          name: userEmail.split("@")[0],
          role: "USER",
          emailVerified: new Date(),
        },
      });
    } else {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    console.log("✅ User verified:", userEmail);

    // 重定向到首页
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("❌ Auth callback error:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}
