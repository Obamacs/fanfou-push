import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 获取统计数据
  const [totalUsers, activeUsers, totalEvents, totalMatches, openReports] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true, isBanned: false } }),
      db.event.count(),
      db.match.count(),
      db.report.count({ where: { status: "OPEN" } }),
    ]);

  const stats = [
    { label: "总用户数", value: totalUsers, color: "bg-blue-500" },
    { label: "活跃用户", value: activeUsers, color: "bg-green-500" },
    { label: "活动总数", value: totalEvents, color: "bg-purple-500" },
    { label: "匹配记录", value: totalMatches, color: "bg-indigo-500" },
    { label: "待处理举报", value: openReports, color: "bg-red-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">仪表板</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg opacity-20`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">最近用户</h2>
          <RecentUsers />
        </Card>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <h2 className="text-xl font-bold text-white mb-4">最近活动</h2>
          <RecentEvents />
        </Card>
      </div>
    </div>
  );
}

async function RecentUsers() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      isBanned: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
        >
          <div>
            <p className="text-white font-medium">{user.name}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {user.isBanned && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                已禁用
              </span>
            )}
            {!user.isActive && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                非活跃
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

async function RecentEvents() {
  const events = await db.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      city: true,
      status: true,
      createdAt: true,
      _count: { select: { attendances: true } },
    },
  });

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
        >
          <div>
            <p className="text-white font-medium">{event.title}</p>
            <p className="text-gray-400 text-sm">
              {event.city} · {event._count.attendances} 人参加
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded ${
              event.status === "UPCOMING"
                ? "bg-blue-500/20 text-blue-400"
                : event.status === "ONGOING"
                ? "bg-green-500/20 text-green-400"
                : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {event.status}
          </span>
        </div>
      ))}
    </div>
  );
}
