import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Zap, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
    include: {
      ratingsReceived: true,
      interests: {
        include: { interest: true },
      },
      eventAttendances: {
        include: { event: true },
        where: { event: { status: "UPCOMING" } },
      },
      matchMemberships: {
        where: {
          match: {
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const upcomingEventsCount = user.eventAttendances.length;
  const avgRating = user.averageRating?.toFixed(1) || "暂无";
  const activeMatchCount = (user.matchMemberships as any)?.length || 0;

  return (
    <div>
      {/* Hero Banner - 背景图 */}
      <div className="mb-8 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'url(/dashboard-bg.jpg)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/10"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-4xl font-bold mb-2">早上好，{user.name} ✨</h1>
            <p className="text-lg opacity-95">今天又是美好的一天，准备好去遇见新朋友了吗？</p>
          </div>
          <div className="text-6xl">🌟</div>
        </div>
      </div>

      {/* 完善资料提示 */}
      {!user.isOnboarded && (
        <Card className="mb-8 border-0 bg-gradient-to-r from-purple-100 to-pink-100 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                📝 完善资料，解锁全部功能
              </h2>
              <p className="text-gray-700">
                完成个人资料后，就能开始匹配和参加活动了！
              </p>
            </div>
            <Link href="/onboarding">
              <Button className="btn-brand whitespace-nowrap">
                立即完善
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 快捷入口 - 3列卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/match">
          <Card className="p-6 cursor-pointer card-hover h-full bg-white hover:shadow-xl border-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center">
                <Heart className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">开始匹配</h3>
            </div>
            <p className="text-gray-600 text-sm">
              根据兴趣和城市，为你匹配志同道合的朋友
            </p>
            <div className="mt-4 inline-block text-[#FF2D55] font-semibold text-sm">
              {activeMatchCount > 0 ? `${activeMatchCount} 个活跃匹配 →` : "现在开始 →"}
            </div>
          </Card>
        </Link>

        <Link href="/events">
          <Card className="p-6 cursor-pointer card-hover h-full bg-white hover:shadow-xl border-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF6B35] to-[#FFB84D] flex items-center justify-center">
                <Calendar className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">浏览活动</h3>
            </div>
            <p className="text-gray-600 text-sm">
              参加各种有趣的线下活动，扩展你的社交圈
            </p>
            <div className="mt-4 inline-block text-[#FF2D55] font-semibold text-sm">
              {upcomingEventsCount > 0 ? `${upcomingEventsCount} 场待参加 →` : "发现活动 →"}
            </div>
          </Card>
        </Link>

        <Link href="/messages">
          <Card className="p-6 cursor-pointer card-hover h-full bg-white hover:shadow-xl border-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FF4D7E] to-[#FF2D55] flex items-center justify-center">
                <Zap className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">我的消息</h3>
            </div>
            <p className="text-gray-600 text-sm">
              查看与朋友的最新消息，保持联系
            </p>
            <div className="mt-4 inline-block text-[#FF2D55] font-semibold text-sm">
              进入消息 →
            </div>
          </Card>
        </Link>
      </div>

      {/* 统计卡片 - 4列 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-white border-0 shadow-md rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 text-sm font-medium">待参加活动</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-[#FF2D55] to-[#FF6B35] bg-clip-text text-transparent">
            {upcomingEventsCount}
          </p>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-md rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 text-sm font-medium">我的评分</span>
            <span className="text-2xl">⭐</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-[#FF4D7E] to-[#FFB84D] bg-clip-text text-transparent">
            {avgRating}
          </p>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-md rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 text-sm font-medium">活跃匹配</span>
            <span className="text-2xl">💕</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-[#FF2D55] to-[#FF4D7E] bg-clip-text text-transparent">
            {activeMatchCount}
          </p>
        </Card>

        <Card className="p-6 bg-white border-0 shadow-md rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 text-sm font-medium">我的兴趣</span>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FFB84D] bg-clip-text text-transparent">
            {user.interests.length}
          </p>
        </Card>
      </div>

      {/* 底部建议 */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-0 rounded-xl">
        <h3 className="font-bold text-gray-900 mb-3">💡 小贴士</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✨ 完善你的个人资料，这样更容易被别人发现</li>
          <li>🎯 选择你真正感兴趣的活动类型，匹配会更精准</li>
          <li>💬 主动和新朋友聊天，打破交友的冰山</li>
        </ul>
      </Card>
    </div>
  );
}
