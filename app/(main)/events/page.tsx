import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventCard } from "@/components/events/EventCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EventsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { city: true },
  });

  const userCity = user?.city || "Shanghai"; // Default fallback

  // 1. 获取用户即将参加的盲盒晚餐 (Matchmaking 已经跑完，分配到具体桌)
  const upcomingDinners = await db.event.findMany({
    where: {
      type: "DINNER",
      status: "UPCOMING",
      attendances: {
        some: { userId: session.user.id, status: { in: ["PENDING", "CONFIRMED"] } },
      },
    },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { attendances: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { date: "asc" },
  });

  // 2. 获取当前城市本周的等候池 (POOL)
  // 如果用户已经在这个池子里了，EventCard 会显示“已报名”
  const poolEvents = await db.event.findMany({
    where: {
      type: "POOL",
      status: "UPCOMING",
      city: { contains: userCity, mode: "insensitive" },
    },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { attendances: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { date: "asc" },
    take: 1, // 只显示最近的一个周四等候池
  });

  const eventsToShow = [...upcomingDinners, ...poolEvents];

  return (
    <div className="min-h-screen bg-[#FFFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-[#2D2420] tracking-tight">
            预订本周四的座位
          </h1>
          <p className="mt-3 text-[17px] text-[#B8A099] max-w-2xl mx-auto">
            每周四晚 20:00。不需要费心挑选餐厅，也不需要尬聊破冰。选择你的城市，报名入池。周三我们会通过算法为你分配最契合的 5 位陌生人，并在当天揭晓神秘餐厅。
          </p>
        </div>

        {/* Events grid */}
        {eventsToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
            {eventsToShow.map((event) => (
              <div key={event.id} className="w-full max-w-md">
                <EventCard
                  event={{ ...event, date: event.date }}
                  currentUserId={session?.user?.id}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-[#F0E4E0] max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FFF5F3] mb-6">
              <Calendar className="w-8 h-8 text-[#FF2442]" />
            </div>
            <h2 className="text-[21px] font-semibold text-[#2D2420] mb-2">
              本周活动正在筹备中
            </h2>
            <p className="text-[15px] text-[#B8A099] mb-8 max-w-sm mx-auto">
              你所在城市 ({userCity}) 的周四晚餐池尚未开启，请稍后再来看看。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
