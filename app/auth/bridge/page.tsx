"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function BridgeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const next = searchParams.get("next") || "/dashboard";

    if (!token || !email) {
      console.error("❌ Missing token or email");
      router.replace("/login?error=auth_failed");
      return;
    }

    const establishSession = async () => {
      try {
        console.log("🔄 Establishing NextAuth session...");
        const result = await signIn("magiclink", {
          token,
          email,
          redirect: false,
        });

        if (result?.error) {
          console.error("❌ NextAuth signIn error:", result.error);
          router.replace("/login?error=auth_failed");
          return;
        }

        if (result?.ok) {
          console.log("✅ NextAuth session established, redirecting to:", next);
          window.location.href = next;
        } else {
          router.replace("/login?error=auth_failed");
        }
      } catch (err) {
        console.error("❌ Bridge error:", err);
        router.replace("/login?error=auth_failed");
      }
    };

    establishSession();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">正在登录...</p>
      </div>
    </div>
  );
}

export default function BridgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-gray-600">加载中...</p>
        </div>
      }
    >
      <BridgeContent />
    </Suspense>
  );
}
