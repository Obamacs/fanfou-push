import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Heart, MessageCircle, Sparkles, ChevronRight } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
    include: {
      ratingsReceived: true,
      interests: { include: { interest: true } },
      eventAttendances: {
        include: { event: true },
        where: { event: { status: "UPCOMING" } },
      },
      matchMemberships: {
        where: { match: { status: { in: ["PENDING", "CONFIRMED"] } } },
      },
    },
  });

  if (!user) return null;

  const upcomingCount = user.eventAttendances.length;
  const avgRating = user.averageRating?.toFixed(1) || "暂无";
  const matchCount = (user.matchMemberships as any)?.length || 0;

  return (
    <div className="min-h-screen bg-[#FFFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Greeting */}
        <div className="mb-10">
          <h1 className="text-[34px] font-bold text-[#2D2420] tracking-tight">
            {user.name}，下午好
          </h1>
          <p className="mt-1 text-[17px] text-[#B8A099]">
            这周想遇见谁？
          </p>
        </div>

        {/* Onboarding prompt */}
        {!user.isOnboarded && (
          <Card className="mb-8 border-0 shadow-sm rounded-3xl p-6 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFFAF8] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#FF2442]" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-[#2D2420]">完善你的个人资料</h2>
                  <p className="text-[15px] text-[#B8A099]">完成后即可开始匹配和参加活动</p>
                </div>
              </div>
              <Link href="/onboarding">
                <Button className="rounded-full bg-[#FF2442] hover:bg-[#FF4D63] text-white font-medium">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  开始
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Quick actions — 2 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link href="/events" className="group">
            <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-[#FF2442]/10 flex items-center justify-center mb-5">
                <Calendar className="w-5 h-5 text-[#FF2442]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#2D2420] mb-1">预订这周四</h3>
              <p className="text-[15px] text-[#B8A099] mb-4">
                报名参与你所在城市的本周盲盒晚餐
              </p>
              <div className="flex items-center text-[13px] text-[#FF2442] font-medium">
                {upcomingCount > 0 ? `已报名 ${upcomingCount} 场` : "查看报名"}
                <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/messages" className="group">
            <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-[#ff9500]/10 flex items-center justify-center mb-5">
                <MessageCircle className="w-5 h-5 text-[#ff9500]" />
              </div>
              <h3 className="text-[17px] font-semibold text-[#2D2420] mb-1">消息</h3>
              <p className="text-[15px] text-[#B8A099] mb-4">
                和已见面的同桌朋友保持联系
              </p>
              <div className="flex items-center text-[13px] text-[#ff9500] font-medium">
                查看消息
                <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { value: upcomingCount, label: "待参加", color: "text-[#FF2442]" },
            { value: avgRating, label: "评分", color: "text-[#ff9500]" },
            { value: matchCount, label: "历史同桌", color: "text-[#34c759]" },
            { value: user.interests.length, label: "兴趣", color: "text-[#af52de]" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm rounded-2xl p-5 bg-white text-center">
              <div className={`text-[28px] font-bold ${stat.color} mb-0.5`}>
                {stat.value}
              </div>
              <div className="text-[13px] text-[#B8A099]">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* How it works — timeleft.com inspired */}
        <div className="mb-10">
          <h2 className="text-[21px] font-bold text-[#2D2420] mb-5">如何参与</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "预订周四座位", desc: "选择你所在城市，报名加入本周四晚的聚餐等候池" },
              { step: "2", title: "匹配与揭晓", desc: "周三算法将为你分配 5 位契合的陌生人，周四揭晓餐厅" },
              { step: "3", title: "出现就好", desc: "周四晚 20:00 准时赴约，享受纯粹的盲盒社交体验" },
            ].map((item) => (
              <Card key={item.step} className="border-0 shadow-sm rounded-3xl p-6 bg-white">
                <div className="w-8 h-8 rounded-full bg-[#FFFAF8] flex items-center justify-center text-sm font-semibold text-[#2D2420] mb-4">
                  {item.step}
                </div>
                <h3 className="text-[17px] font-semibold text-[#2D2420] mb-2">{item.title}</h3>
                <p className="text-[15px] text-[#B8A099]">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Tips */}
        <Card className="border-0 shadow-sm rounded-3xl p-6 bg-white">
          <h3 className="text-[15px] font-semibold text-[#2D2420] mb-4">小贴士</h3>
          <div className="space-y-3 text-[15px] text-[#B8A099]">
            <p>· 完善个性化问卷能让算法更精准地为你找到契合的同桌</p>
            <p>· 餐厅地址将在活动开始前 12 小时揭晓，保持神秘感</p>
            <p>· 别紧张 — 走进门就知道，每个人都和你一样期待今晚</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
