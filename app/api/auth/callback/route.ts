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

    console.log("Auth callback - code:", code);

    if (!code) {
      console.error("No code provided");
      return NextResponse.redirect(new URL("/login?error=no_code", req.url));
    }

    // 使用code交换session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("Exchange code result:", { data, error });

    if (error) {
      console.error("Code exchange error:", error);
      return NextResponse.redirect(new URL("/login?error=invalid_code", req.url));
    }

    if (!data.user?.email) {
      console.error("No email in user data");
      return NextResponse.redirect(new URL("/login?error=no_email", req.url));
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

    // 重定向到onboarding或dashboard
    const redirectUrl = user.isOnboarded ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_error", req.url));
  }
}
