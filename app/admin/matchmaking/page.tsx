import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { MatchmakingTrigger } from "@/components/admin/MatchmakingTrigger";
import { GeneratePoolTrigger } from "@/components/admin/GeneratePoolTrigger";

export default async function MatchmakingAdminPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin-login");
  }

  // Fetch all active POOL events
  const poolEvents = await db.event.findMany({
    where: {
      type: "POOL",
      status: "UPCOMING",
    },
    include: {
      _count: {
        select: {
          attendances: {
            where: { status: { in: ["CONFIRMED", "PENDING"] } },
          },
        },
      },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-white">算法分桌引擎 (Matchmaking)</h1>
        <GeneratePoolTrigger />
      </div>
      <p className="text-[#B8A099] mb-8">
        管理各城市的“周四等候池 (Pool Event)”。在每周三晚上点击“运行分桌算法”，系统将自动将等候池中的用户切分为 6 人一桌的真实盲盒晚餐 (Dinner Event)，并隐藏原等候池。
      </p>

      {poolEvents.length === 0 ? (
        <Card className="bg-[#241918] border-[#2D1E1A] p-10 text-center">
          <p className="text-[#B8A099]">当前没有活跃的等候池活动。</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {poolEvents.map((pool) => (
            <Card key={pool.id} className="bg-[#241918] border-[#2D1E1A] p-6">
              <div className="mb-4">
                <span className="px-2 py-1 bg-[#FF2442]/20 text-[#FF2442] text-xs rounded font-medium">
                  等候池 POOL
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{pool.title}</h2>
              <p className="text-[#B8A099] text-sm mb-1">
                📅 时间: {new Date(pool.date).toLocaleString("zh-CN")}
              </p>
              <p className="text-[#B8A099] text-sm mb-6">
                📍 城市: {pool.city}
              </p>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-[#B8A099] mb-1">当前池中人数</p>
                  <p className="text-3xl font-bold text-white">{pool._count.attendances}</p>
                </div>
                <MatchmakingTrigger poolEventId={pool.id} count={pool._count.attendances} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
