"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface MatchmakingTriggerProps {
  poolEventId: string;
  count: number;
}

export function MatchmakingTrigger({ poolEventId, count }: MatchmakingTriggerProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRun = async () => {
    if (count < 6) {
      if (!confirm("池中人数不足 6 人，强制运行可能会产生人数不足的餐桌。确定要继续吗？")) {
        return;
      }
    } else {
      if (!confirm("确定要对该等候池进行算法分桌吗？一旦执行，用户将被分配到具体餐厅，且无法撤销。")) {
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/matchmaking/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolEventId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "运行失败");
      }

      alert(`✅ 分桌成功！共生成了 ${data.tablesCreated} 张餐桌。`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "运行失败";
      alert(`❌ 错误: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleRun} 
      disabled={loading || count === 0}
      className="bg-[#FF2442] hover:bg-[#FF4D63] text-white"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          正在计算...
        </>
      ) : (
        "运行算法分桌"
      )}
    </Button>
  );
}
