import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface DistributionItem {
  city?: string;
  type?: string;
  _count: number;
}

async function getStatisticsData() {
  try {
    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      totalEvents,
      completedEvents,
      totalMatches,
      confirmedMatches,
      openReports,
      resolvedReports,
      cities,
      events,
      newUsersWeek,
      newEventsWeek,
    ] = await db.$transaction([
      db.user.count(),
      db.user.count({ where: { isActive: true, isBanned: false } }),
      db.user.count({ where: { isBanned: true } }),
      db.event.count(),
      db.event.count({ where: { status: "COMPLETED" } }),
      db.match.count(),
      db.match.count({ where: { status: "CONFIRMED" } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.report.count({ where: { status: "RESOLVED" } }),
      db.user.findMany({
        where: { city: { not: null } },
        select: { city: true },
        take: 100,
      }),
      db.event.findMany({
        select: { type: true },
      }),
      db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      db.event.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      totalEvents,
      completedEvents,
      totalMatches,
      confirmedMatches,
      openReports,
      resolvedReports,
      cities,
      events,
      newUsersWeek,
      newEventsWeek,
      unavailable: false,
    };
  } catch (error) {
    console.error("Statistics data unavailable:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      bannedUsers: 0,
      totalEvents: 0,
      completedEvents: 0,
      totalMatches: 0,
      confirmedMatches: 0,
      openReports: 0,
      resolvedReports: 0,
      cities: [],
      events: [],
      newUsersWeek: 0,
      newEventsWeek: 0,
      unavailable: true,
    };
  }
}

export default async function StatisticsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin-login");
  }

  const {
    totalUsers,
    activeUsers,
    bannedUsers,
    totalEvents,
    completedEvents,
    totalMatches,
    confirmedMatches,
    openReports,
    resolvedReports,
    cities,
    events,
    newUsersWeek,
    newEventsWeek,
    unavailable,
  } = await getStatisticsData();

  const cityDistribution = cities.reduce<DistributionItem[]>((acc, user) => {
    const city = user.city || "未设置";
    const existing = acc.find((item) => item.city === city);
    if (existing) {
      existing._count += 1;
    } else {
      acc.push({ city, _count: 1 });
    }
    return acc;
  }, [])
    .sort((a, b) => b._count - a._count)
    .slice(0, 10);

  const eventTypeDistribution = events.reduce<DistributionItem[]>((acc, event) => {
    const type = event.type || "未分类";
    const existing = acc.find((item) => item.type === type);
    if (existing) {
      existing._count += 1;
    } else {
      acc.push({ type, _count: 1 });
    }
    return acc;
  }, [])
    .sort((a, b) => b._count - a._count);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">统计分析</h1>

      {unavailable && (
        <Card className="mb-8 rounded-lg border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
            <p className="text-sm leading-6">
              统计数据暂时不可用，当前展示为空状态。稍后刷新即可恢复真实数据，页面不会整页崩溃。
            </p>
          </div>
        </Card>
      )}

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
          <div className="space-y-2">
            <p className="text-[#B8A099] text-sm">活跃用户率</p>
            <p className="text-3xl font-bold text-white">
              {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-[#6B5A55] text-xs">
              {activeUsers} / {totalUsers}
            </p>
          </div>
        </Card>

        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
          <div className="space-y-2">
            <p className="text-[#B8A099] text-sm">活动完成率</p>
            <p className="text-3xl font-bold text-white">
              {totalEvents > 0 ? ((completedEvents / totalEvents) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-[#6B5A55] text-xs">
              {completedEvents} / {totalEvents}
            </p>
          </div>
        </Card>

        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
          <div className="space-y-2">
            <p className="text-[#B8A099] text-sm">匹配确认率</p>
            <p className="text-3xl font-bold text-white">
              {totalMatches > 0 ? ((confirmedMatches / totalMatches) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-[#6B5A55] text-xs">
              {confirmedMatches} / {totalMatches}
            </p>
          </div>
        </Card>

        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
          <div className="space-y-2">
            <p className="text-[#B8A099] text-sm">举报处理率</p>
            <p className="text-3xl font-bold text-white">
              {resolvedReports + openReports > 0
                ? (
                    ((resolvedReports / (resolvedReports + openReports)) * 100)
                  ).toFixed(1)
                : 0}%
            </p>
            <p className="text-[#6B5A55] text-xs">
              {resolvedReports} 已处理
            </p>
          </div>
        </Card>
      </div>

      {/* 增长数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
          <h2 className="text-lg font-bold text-white mb-4">最近7天新增</h2>
          <div className="space-y-3">
            <div>
              <p className="text-[#B8A099] text-sm">新用户</p>
              <p className="text-2xl font-bold text-[#FF6B35]">{newUsersWeek}</p>
            </div>
            <div>
              <p className="text-[#B8A099] text-sm">新活动</p>
              <p className="text-2xl font-bold text-[#FF2442]">{newEventsWeek}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
          <h2 className="text-lg font-bold text-white mb-4">需要关注</h2>
          <div className="space-y-3">
            <div>
              <p className="text-[#B8A099] text-sm">被禁用用户</p>
              <p className="text-2xl font-bold text-[#FF2442]">{bannedUsers}</p>
            </div>
            <div>
              <p className="text-[#B8A099] text-sm">待处理举报</p>
              <p className="text-2xl font-bold text-[#FF6B35]">{openReports}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 城市分布 */}
      <Card className="bg-[#241918] border-[#2D1E1A] p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">用户城市分布（Top 10）</h2>
        <div className="space-y-2">
          {cityDistribution.map((item) => (
            <div key={item.city} className="flex items-center justify-between">
              <span className="text-[#B8A099]">{item.city || "未设置"}</span>
              <div className="flex items-center gap-3">
                <div className="h-2 bg-[#FF2442] rounded" style={{ width: `${totalUsers > 0 ? (item._count / totalUsers) * 200 : 0}px` }} />
                <span className="text-[#B8A099]">{item._count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 活动类型分布 */}
      <Card className="bg-[#241918] border-[#2D1E1A] p-6">
        <h2 className="text-lg font-bold text-white mb-4">活动类型分布</h2>
        <div className="space-y-2">
          {eventTypeDistribution.map((item) => (
            <div key={item.type} className="flex items-center justify-between">
              <span className="text-[#B8A099]">{item.type}</span>
              <div className="flex items-center gap-3">
                <div className="h-2 bg-[#FF4D94] rounded" style={{ width: `${totalEvents > 0 ? (item._count / totalEvents) * 200 : 0}px` }} />
                <span className="text-[#B8A099]">{item._count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
