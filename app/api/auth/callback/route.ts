import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { getSupabaseServerClient } from "@/lib/supabase";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as any;
  const errorParam = url.searchParams.get("error");
  const errorDescription =
    url.searchParams.get("error_description") ||
    url.searchParams.get("error_code");

  // Supabase sometimes puts errors in the query (PKCE flow rejections). The
  // hash-fragment form (#error=...) is client-side only — bridge page forwards
  // those here by re-reading location.hash. See app/auth/bridge/page.tsx.
  if (errorParam) {
    console.error("❌ Supabase auth error:", errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=auth_failed`, req.url)
    );
  }

  if (!code && !token_hash) {
    console.error("❌ No code or token_hash in callback URL");
    return NextResponse.redirect(
      new URL("/login?error=missing_code", req.url)
    );
  }

  try {
    const supabase = await getSupabaseServerClient();
    let authData, exchangeError;

    if (token_hash && type) {
      // Token Hash flow (Cross-device compatible)
      const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });
      authData = data;
      exchangeError = error;
    } else if (code) {
      // PKCE flow
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      authData = data;
      exchangeError = error;
    }

    if (exchangeError) {
      console.error("❌ Code exchange failed:", exchangeError);
      return NextResponse.redirect(
        new URL(`/login?error=exchange_failed`, req.url)
      );
    }

    const userEmail = authData?.user?.email;
    if (!userEmail) {
      console.error("❌ No email in session data");
      return NextResponse.redirect(
        new URL("/login?error=no_email", req.url)
      );
    }

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

    const bridgeToken = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await db.verificationToken.create({
      data: {
        identifier: userEmail,
        token: hashToken(bridgeToken),
        expires: expiresAt,
      },
    });

    const nextPath = user.isOnboarded ? "/dashboard" : "/onboarding";
    const bridgeUrl = new URL("/auth/bridge", req.url);
    bridgeUrl.searchParams.set("token", bridgeToken);
    bridgeUrl.searchParams.set("email", userEmail);
    bridgeUrl.searchParams.set("next", nextPath);

    return NextResponse.redirect(bridgeUrl);
  } catch (error) {
    console.error("❌ Auth callback error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=callback_exception`, req.url)
    );
  }
}
