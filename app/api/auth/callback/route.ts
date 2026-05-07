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
    const code = searchParams.get("code");

    // 打印完整URL和query参数用于调试
    console.log("=== Auth Callback ===");
    console.log("Full URL:", req.url);
    console.log("Query params:", Object.fromEntries(searchParams));
    console.log("Code:", code);

    if (!code) {
      console.error("❌ No code provided");
      console.error("Full URL:", req.url);
      console.error("All params:", Object.fromEntries(searchParams));
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 使用code交换session
    console.log("🔄 Exchanging code for session...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("Exchange result:", {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      userEmail: data?.user?.email
    });

    if (error) {
      console.error("❌ Code exchange error:", error);
      console.error("Full URL:", req.url);
      console.error("All params:", Object.fromEntries(searchParams));
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!data.user?.email) {
      console.error("❌ No email in user data");
      console.error("Full URL:", req.url);
      console.error("All params:", Object.fromEntries(searchParams));
      return NextResponse.redirect(new URL("/dashboard", req.url));
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

    // 成功后跳转到首页（dashboard）
    console.log("🎉 Redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("❌ Auth callback error:", error);
    console.error("Full error:", error instanceof Error ? error.message : String(error));
    console.error("Full URL:", req.url);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
