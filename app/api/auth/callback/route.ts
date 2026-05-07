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
    const redirect_to = searchParams.get("redirect_to") || "/dashboard";

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=no_code", req.url));
    }

    // 使用code交换session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
      console.error("Code exchange error:", error);
      return NextResponse.redirect(new URL("/login?error=invalid_code", req.url));
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

    // 重定向到指定的页面或dashboard
    const redirectUrl = new URL(redirect_to, req.url);
    const response = NextResponse.redirect(redirectUrl);

    // 设置Supabase session cookie
    if (data.session) {
      response.cookies.set("sb-session", JSON.stringify(data.session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=callback_error", req.url));
  }
}
