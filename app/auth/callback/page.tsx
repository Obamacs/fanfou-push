"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const hash = window.location.hash;
        console.log("🔐 Auth callback hash:", hash);

        if (!hash) {
          console.error("❌ No hash found in URL");
          router.push("/login?error=auth_failed");
          return;
        }

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        console.log("📦 Extracted tokens:");
        console.log("  access_token:", accessToken ? "present" : "missing");
        console.log("  refresh_token:", refreshToken ? "present" : "missing");

        if (!accessToken || !refreshToken) {
          console.error("❌ Missing tokens in hash");
          router.push("/login?error=auth_failed");
          return;
        }

        console.log("🔄 Setting session with tokens...");
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("❌ Session error:", error);
          router.push("/login?error=auth_failed");
          return;
        }

        const userEmail = data.user?.email;
        console.log("✅ Session established for:", userEmail);

        // Redirect to home page
        router.push("/");
      } catch (error) {
        console.error("❌ Auth callback error:", error);
        router.push("/login?error=auth_failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">正在验证邮箱...</p>
      </div>
    </div>
  );
}
