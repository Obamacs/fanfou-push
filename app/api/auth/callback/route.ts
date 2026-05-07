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
    const { searchParams } = new URL(req.url);

    // 打印完整URL和query参数用于调试
    console.log("=== Auth Callback ===");
    console.log("Full URL:", req.url);
    console.log("Query params:", Object.fromEntries(searchParams));

    // Supabase magic link 可能使用 code、access_token 或其他参数
    const code = searchParams.get("code");
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const type = searchParams.get("type");

    console.log("Code:", code);
    console.log("Access Token:", accessToken ? "present" : "missing");
    console.log("Refresh Token:", refreshToken ? "present" : "missing");
    console.log("Type:", type);

    // 如果有 access_token 和 refresh_token（Supabase magic link 重定向）
    if (accessToken && refreshToken) {
      console.log("🔄 Setting session with tokens...");
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      console.log("Session result:", {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message,
        userEmail: data?.user?.email,
      });

      if (error) {
        console.error("❌ Session error:", error);
        return NextResponse.redirect(new URL("/login?error=1", req.url));
      }

      if (!data.user?.email) {
        console.error("❌ No email in user data");
        return NextResponse.redirect(new URL("/login?error=1", req.url));
      }

      const email = data.user.email;
      console.log("✅ User email:", email);

      // 确保用户存在于数据库
      let user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.log("📝 Creating new user:", email);
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

      console.log("✅ User verified and updated");
      console.log("🎉 Redirecting to dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 如果有 code（备用方案）
    if (code) {
      console.log("🔄 Exchanging code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log("Exchange result:", {
        hasData: !!data,
        hasError: !!error,
        errorMessage: error?.message,
        userEmail: data?.user?.email,
      });

      if (error) {
        console.error("❌ Code exchange error:", error);
        return NextResponse.redirect(new URL("/login?error=1", req.url));
      }

      if (!data.user?.email) {
        console.error("❌ No email in user data");
        return NextResponse.redirect(new URL("/login?error=1", req.url));
      }

      const email = data.user.email;
      console.log("✅ User email:", email);

      // 确保用户存在于数据库
      let user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.log("📝 Creating new user:", email);
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

      console.log("✅ User verified and updated");
      console.log("🎉 Redirecting to dashboard");
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    console.error("❌ No code or tokens provided");
    console.error("Full URL:", req.url);
    console.error("All params:", Object.fromEntries(searchParams));
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  } catch (error) {
    console.error("❌ Auth callback error:", error);
    console.error("Full error:", error instanceof Error ? error.message : String(error));
    console.error("Full URL:", req.url);
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  }
}
