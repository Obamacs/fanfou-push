"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export function GeneratePoolTrigger() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/events/generate", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "生成失败");
      }

      alert(`✅ ${data.message}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "生成失败";
      alert(`❌ 错误: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={loading}
      variant="outline"
      className="border-[#2D1E1A] text-[#B8A099] hover:text-white hover:bg-[#2D1E1A]"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CalendarPlus className="w-4 h-4 mr-2" />
      )}
      生成下周四等候池
    </Button>
  );
}
