import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

const supabaseUrl = process.env.SUPABASE_URL || "https://lwercdnrvxrsnjjvojfx.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    console.log("=== Auth Callback ===");
    console.log("Full URL:", req.url);
    console.log("Query params:", Object.fromEntries(searchParams));

    const code = searchParams.get("code");
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    console.log("Code:", code);
    console.log("Access Token:", accessToken ? "present" : "missing");
    console.log("Refresh Token:", refreshToken ? "present" : "missing");

    let userEmail: string | null = null;

    // Try access_token + refresh_token first (Supabase magic link redirect)
    if (accessToken && refreshToken) {
      console.log("🔄 Setting session with tokens...");
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("❌ Session error:", error);
        return NextResponse.redirect(new URL("/login?error=1", req.url));
      }

      userEmail = data.user?.email || null;
    }

    // Fallback to code (backup plan)
    if (!userEmail && code) {
      console.log("🔄 Exchanging code for session...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("❌ Code exchange error:", error);
        return NextResponse.redirect(new URL("/login?error=1", req.url));
      }

      userEmail = data.user?.email || null;
    }

    if (!userEmail) {
      console.error("❌ No email obtained from Supabase");
      return NextResponse.redirect(new URL("/login?error=1", req.url));
    }

    // Ensure user exists and update emailVerified
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
        },
      });
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    console.log("✅ User email verified:", userEmail);

    // Create a one-time verification token for NextAuth magiclink provider (5 minutes)
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await db.verificationToken.create({
      data: {
        identifier: userEmail,
        token,
        expires: expiresAt,
      },
    });

    console.log("✅ Created verification token for NextAuth signin");

    // Redirect to NextAuth signin endpoint with magiclink provider
    const signInUrl = new URL("/api/auth/signin/magiclink", req.url);
    signInUrl.searchParams.set("token", token);
    signInUrl.searchParams.set("email", userEmail);
    signInUrl.searchParams.set("callbackUrl", "/dashboard");

    console.log("🎉 Redirecting to NextAuth signin");
    return NextResponse.redirect(signInUrl);
  } catch (error) {
    console.error("❌ Auth callback error:", error);
    console.error("Full error:", error instanceof Error ? error.message : String(error));
    return NextResponse.redirect(new URL("/login?error=1", req.url));
  }
}
