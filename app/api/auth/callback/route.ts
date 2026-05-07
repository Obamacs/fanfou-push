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

    console.log("🔐 Auth callback - Full URL:", req.url);
    console.log("📦 Code:", code ? "present" : "missing");

    if (!code) {
      console.error("❌ No code in callback URL");
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    console.log("🔄 Exchanging code for session...");
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
      console.error("❌ Code exchange failed:", error);
      return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
    }

    const userEmail = data.user.email;
    console.log("✅ Session established for:", userEmail);

    // Ensure user exists and mark email as verified
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

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("❌ Auth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}
