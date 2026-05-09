"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function BridgeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Supabase sometimes returns errors in the URL hash fragment
    // (#error=access_denied&error_description=...). The server can't see hashes,
    // so intercept them here before falling through to NextAuth bridging.
    if (typeof window !== "undefined" && window.location.hash.startsWith("#error=")) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const err = params.get("error") || "auth_failed";
      const desc = params.get("error_description") || params.get("error_code") || "";
      const url = `/login?error=${encodeURIComponent(err)}${
        desc ? `&details=${encodeURIComponent(desc)}` : ""
      }`;
      
      // 清除 hash 并强制使用原生跳转，防止 Next.js 路由器保留 hash 或产生混合 URL
      window.location.hash = "";
      window.location.replace(url);
      return;
    }

    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const next = searchParams.get("next") || "/dashboard";

    if (!token || !email) {
      router.replace("/login?error=missing_bridge_params");
      return;
    }

    const establishSession = async () => {
      try {
        const result = await signIn("magiclink", {
          token,
          email,
          redirect: false,
        });

        if (result?.error) {
          console.error("❌ NextAuth signIn error:", result.error);
          router.replace(
            `/login?error=session_failed&details=${encodeURIComponent(
              result.error
            )}`
          );
          return;
        }

        if (result?.ok) {
          window.location.href = next;
        } else {
          router.replace("/login?error=session_failed");
        }
      } catch (err) {
        console.error("❌ Bridge error:", err);
        router.replace("/login?error=bridge_exception");
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
