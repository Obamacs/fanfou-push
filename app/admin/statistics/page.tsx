import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function StatisticsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 获取详细统计数据
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
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true, isBanned: false } }),
    db.user.count({ where: { isBanned: true } }),
    db.event.count(),
    db.event.count({ where: { status: "COMPLETED" } }),
    db.match.count(),
    db.match.count({ where: { status: "CONFIRMED" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.report.count({ where: { status: "RESOLVED" } }),
  ]);

  // 获取城市分布（简化版）
  const cities = await db.user.findMany({
    where: { city: { not: null } },
    select: { city: true },
    take: 100,
  });

  const cityDistribution = cities.reduce((acc: any, user) => {
    const city = user.city || "未设置";
    const existing = acc.find((item: any) => item.city === city);
    if (existing) {
      existing._count = (existing._count || 0) + 1;
    } else {
      acc.push({ city, _count: 1 });
    }
    return acc;
  }, [])
    .sort((a: any, b: any) => (b._count || 0) - (a._count || 0))
    .slice(0, 10);

  // 获取活动类型分布（简化版）
  const events = await db.event.findMany({
    select: { type: true },
  });

  const eventTypeDistribution = events.reduce((acc: any, event) => {
    const type = event.type || "未分类";
    const existing = acc.find((item: any) => item.type === type);
    if (existing) {
      existing._count = (existing._count || 0) + 1;
    } else {
      acc.push({ type, _count: 1 });
    }
    return acc;
  }, [])
    .sort((a: any, b: any) => (b._count || 0) - (a._count || 0));

  // 获取用户增长趋势（最近7天）
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersWeek = await db.user.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  const newEventsWeek = await db.event.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">统计分析</h1>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">活跃用户率</p>
            <p className="text-3xl font-bold text-white">
              {totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-gray-500 text-xs">
              {activeUsers} / {totalUsers}
            </p>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">活动完成率</p>
            <p className="text-3xl font-bold text-white">
              {totalEvents > 0 ? ((completedEvents / totalEvents) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-gray-500 text-xs">
              {completedEvents} / {totalEvents}
            </p>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">匹配确认率</p>
            <p className="text-3xl font-bold text-white">
              {totalMatches > 0 ? ((confirmedMatches / totalMatches) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-gray-500 text-xs">
              {confirmedMatches} / {totalMatches}
            </p>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">举报处理率</p>
            <p className="text-3xl font-bold text-white">
              {resolvedReports + openReports > 0
                ? (
                    ((resolvedReports / (resolvedReports + openReports)) * 100)
                  ).toFixed(1)
                : 0}%
            </p>
            <p className="text-gray-500 text-xs">
              {resolvedReports} 已处理
            </p>
          </div>
        </Card>
      </div>

      {/* 增长数据 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">最近7天新增</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">新用户</p>
              <p className="text-2xl font-bold text-green-400">{newUsersWeek}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">新活动</p>
              <p className="text-2xl font-bold text-blue-400">{newEventsWeek}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">需要关注</h2>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">被禁用用户</p>
              <p className="text-2xl font-bold text-red-400">{bannedUsers}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">待处理举报</p>
              <p className="text-2xl font-bold text-yellow-400">{openReports}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 城市分布 */}
      <Card className="bg-gray-900 border-gray-800 p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">用户城市分布（Top 10）</h2>
        <div className="space-y-2">
          {cityDistribution.map((item: any) => (
            <div key={item.city} className="flex items-center justify-between">
              <span className="text-gray-400">{item.city || "未设置"}</span>
              <div className="flex items-center gap-3">
                <div className="h-2 bg-blue-600 rounded" style={{ width: `${((item._count || 0) / totalUsers) * 200}px` }} />
                <span className="text-gray-300">{item._count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 活动类型分布 */}
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">活动类型分布</h2>
        <div className="space-y-2">
          {eventTypeDistribution.map((item: any) => (
            <div key={item.type} className="flex items-center justify-between">
              <span className="text-gray-400">{item.type}</span>
              <div className="flex items-center gap-3">
                <div className="h-2 bg-purple-600 rounded" style={{ width: `${((item._count || 0) / totalEvents) * 200}px` }} />
                <span className="text-gray-300">{item._count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
