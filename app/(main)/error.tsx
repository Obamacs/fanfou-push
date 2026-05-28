"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Main app error boundary captured:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-12 bg-white border border-[#F0E4E0] rounded-3xl shadow-lg">
      <div className="text-5xl mb-4 select-none">✨</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">抱歉，发现了一些小状况</h2>
      <p className="text-sm text-[#B8A099] mb-6 leading-relaxed">
        我们未能成功加载本页面。请点击下方按钮重新尝试，或返回首页。
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => reset()}
          className="bg-[#FF2442] hover:bg-[#E01F3B] text-white rounded-full px-6 font-semibold shadow-md shadow-[#FF2442]/20 active:scale-95 transition-all"
        >
          重新尝试
        </Button>
        <Button
          variant="outline"
          onClick={() => { window.location.href = "/"; }}
          className="border-[#F0E4E0] text-[#B8A099] hover:text-[#FF2442] hover:bg-gray-50 rounded-full px-6 font-semibold transition-colors"
        >
          返回首页
        </Button>
      </div>
    </div>
  );
}
