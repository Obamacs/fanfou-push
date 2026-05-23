import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AlertCircle, CalendarDays, ClipboardList, Flag, Sparkles, Tags, Users } from "lucide-react";

async function getAdminDashboardData() {
  try {
    const [
      totalUsers,
      activeUsers,
      totalEvents,
      openReports,
      totalQuestions,
      totalInterests,
      onboardedUsers,
      users,
      events,
    ] = await db.$transaction([
      db.user.count(),
      db.user.count({ where: { isActive: true, isBanned: false } }),
      db.event.count(),
      db.report.count({ where: { status: "OPEN" } }),
      db.questionnaireQuestion.count(),
      db.interest.count(),
      db.user.count({ where: { isOnboarded: true } }),
      db.user.findMany({
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
      }),
      db.event.findMany({
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
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalEvents,
      openReports,
      totalQuestions,
      totalInterests,
      onboardedUsers,
      users,
      events,
      unavailable: false,
    };
  } catch (error) {
    console.error("Admin dashboard data unavailable:", error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalEvents: 0,
      openReports: 0,
      totalQuestions: 0,
      totalInterests: 0,
      onboardedUsers: 0,
      users: [],
      events: [],
      unavailable: true,
    };
  }
}

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin-login");
  }

  const {
    totalUsers,
    activeUsers,
    totalEvents,
    openReports,
    totalQuestions,
    totalInterests,
    onboardedUsers,
    users,
    events,
    unavailable,
  } = await getAdminDashboardData();

  const onboardingRate = totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;

  const stats = [
    { label: "总用户数", value: totalUsers, icon: Users, tone: "from-[#ff2442] to-[#ff6b5f]" },
    { label: "活跃用户", value: activeUsers, icon: Sparkles, tone: "from-[#ff6b35] to-[#ff9f5f]" },
    { label: "活动总数", value: totalEvents, icon: CalendarDays, tone: "from-[#ff8c00] to-[#ffc266]" },
    { label: "问卷问题", value: totalQuestions, icon: ClipboardList, tone: "from-[#ff4d94] to-[#ff8bbb]" },
    { label: "兴趣标签", value: totalInterests, icon: Tags, tone: "from-[#ff6b35] to-[#ff2442]" },
    { label: "待处理举报", value: openReports, icon: Flag, tone: "from-[#ef4444] to-[#fb7185]" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#ff7b73]">
            <Sparkles className="h-3.5 w-3.5" />
            Operations
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">仪表板</h1>
          <p className="mt-2 text-sm text-[#b8a099]">查看用户、活动和匹配运营状态。</p>
        </div>
      </div>

      {unavailable && (
        <Card className="rounded-lg border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
            <p className="text-sm leading-6">
              数据库连接暂时紧张，当前展示为空状态。稍后刷新即可恢复真实数据，页面不会再整页崩溃。
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-lg border-white/10 bg-white/[0.06] p-5 shadow-none">
            <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${stat.tone} text-white`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-[#b8a099]">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-lg border-white/10 bg-white/[0.06] p-6 shadow-none">
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="rounded-lg border-white/10 bg-white/[0.06] p-6 shadow-none">
          <h2 className="mb-4 text-xl font-semibold text-white">最近用户</h2>
          <RecentUsers users={users} />
        </Card>

        <Card className="rounded-lg border-white/10 bg-white/[0.06] p-6 shadow-none">
          <h2 className="mb-4 text-xl font-semibold text-white">最近活动</h2>
          <RecentEvents events={events} />
        </Card>
      </div>
    </div>
  );
}

function RecentUsers({
  users,
}: {
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    isActive: boolean;
    isBanned: boolean;
    createdAt: Date;
  }>;
}) {
  if (users.length === 0) {
    return <p className="rounded-lg bg-[#1a1311] p-4 text-sm text-[#b8a099]">暂无用户数据</p>;
  }
  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 bg-[#1A1311] rounded-lg"
        >
          <div>
            <p className="text-white font-medium">{user.name || "未命名用户"}</p>
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

function RecentEvents({
  events,
}: {
  events: Array<{
    id: string;
    title: string;
    city: string;
    status: string;
    createdAt: Date;
    _count: { attendances: number };
  }>;
}) {
  if (events.length === 0) {
    return <p className="rounded-lg bg-[#1a1311] p-4 text-sm text-[#b8a099]">暂无活动数据</p>;
  }
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
