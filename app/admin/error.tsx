"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin dashboard error captured:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-12 bg-[#241918] border border-[#2D1E1A] rounded-3xl shadow-2xl">
      <div className="text-5xl mb-4 select-none">🛠️</div>
      <h2 className="text-xl font-bold text-white mb-2">管理端模块加载失败</h2>
      <p className="text-sm text-[#B8A099] mb-6 leading-relaxed">
        系统加载此板块时发生技术异常，请重试或检查后台日志服务。
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => reset()}
          className="bg-[#FF2442] hover:bg-[#FF4D63] text-white rounded-full px-6 font-semibold transition-all active:scale-95 shadow-md shadow-[#FF2442]/20"
        >
          重新加载
        </Button>
        <Button
          variant="outline"
          onClick={() => { window.location.href = "/admin"; }}
          className="border-[#2D1E1A] text-[#B8A099] hover:text-white hover:bg-[#1A1311] rounded-full px-6 font-semibold transition-all"
        >
          返回面板
        </Button>
      </div>
    </div>
  );
}
