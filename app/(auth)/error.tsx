"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth module error captured:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fff9f7] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[#F0E4E0] rounded-3xl p-8 shadow-xl text-center">
        <div className="text-5xl mb-4 select-none">🔐</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">身份验证服务遇到问题</h2>
        <p className="text-sm text-[#B8A099] mb-6 leading-relaxed">
          在登录或验证您的凭据时发生错误，请重新点击下方按钮尝试加载。
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-[#FF2442] hover:bg-[#E01F3B] text-white rounded-xl py-3 font-semibold transition-all active:scale-95 shadow-md shadow-[#FF2442]/10"
          >
            重新尝试
          </Button>
          <Button
            variant="ghost"
            onClick={() => { window.location.href = "/login"; }}
            className="w-full text-[#B8A099] hover:text-[#FF2442] hover:bg-gray-50 rounded-xl py-3 font-semibold transition-colors"
          >
            返回登录页面
          </Button>
        </div>
      </div>
    </div>
  );
}
