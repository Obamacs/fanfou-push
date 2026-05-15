import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [
    totalUsers, activeUsers, totalEvents, totalMatches, openReports,
    totalQuestions, totalInterests, onboardedUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isActive: true, isBanned: false } }),
    db.event.count(),
    db.match.count(),
    db.report.count({ where: { status: "OPEN" } }),
    db.questionnaireQuestion.count(),
    db.interest.count(),
    db.user.count({ where: { isOnboarded: true } }),
  ]);

  const onboardingRate = totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;

  const stats = [
    { label: "总用户数", value: totalUsers, color: "bg-[#FF2442]" },
    { label: "活跃用户", value: activeUsers, color: "bg-[#FF6B35]" },
    { label: "活动总数", value: totalEvents, color: "bg-[#FF8C00]" },
    { label: "问卷问题", value: totalQuestions, color: "bg-[#FF4D94]" },
    { label: "兴趣标签", value: totalInterests, color: "bg-[#FF6B35]" },
    { label: "待处理举报", value: openReports, color: "bg-red-500" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">仪表板</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-[#241918] border-[#2D1E1A] p-5">
            <p className="text-[#B8A099] text-sm">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
            <div className={`${stat.color} w-full h-1 rounded-full mt-3 opacity-30`} />
          </Card>
        ))}
      </div>

      {/* Onboarding completion */}
      <Card className="bg-[#241918] border-[#2D1E1A] p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">引导完成率</h2>
            <p className="text-[#B8A099] text-sm mt-1">
              {onboardedUsers} / {totalUsers} 位用户已完成引导
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-[#FF2442]">{onboardingRate}%</span>
          </div>
        </div>
        <div className="mt-4 h-2 bg-[#1A1311] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#FF2442] to-[#FF6B35] rounded-full transition-all"
            style={{ width: `${onboardingRate}%` }}
          />
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
          <h2 className="text-xl font-bold text-white mb-4">最近用户</h2>
          <RecentUsers />
        </Card>

        <Card className="bg-[#241918] border-[#2D1E1A] p-6">
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
          className="flex items-center justify-between p-3 bg-[#1A1311] rounded-lg"
        >
          <div>
            <p className="text-white font-medium">{user.name}</p>
            <p className="text-[#B8A099] text-sm">{user.email}</p>
          </div>
          <div className="flex gap-2">
            {user.isBanned && (
              <span className="px-2 py-1 bg-red-500/20 text-[#FF2442] text-xs rounded">已禁用</span>
            )}
            {!user.isActive && (
              <span className="px-2 py-1 bg-yellow-500/20 text-[#FF6B35] text-xs rounded">非活跃</span>
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
          className="flex items-center justify-between p-3 bg-[#1A1311] rounded-lg"
        >
          <div>
            <p className="text-white font-medium">{event.title}</p>
            <p className="text-[#B8A099] text-sm">
              {event.city} · {event._count.attendances} 人参加
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded ${
              event.status === "UPCOMING"
                ? "bg-[#FF2442]/20 text-[#FF2442]"
                : event.status === "ONGOING"
                ? "bg-[#FF6B35]/20 text-[#FF6B35]"
                : "bg-[#2D1E1A] text-[#6B5A55]"
            }`}
          >
            {event.status === "UPCOMING" ? "即将开始" : event.status === "ONGOING" ? "进行中" : event.status}
          </span>
        </div>
      ))}
    </div>
  );
}
