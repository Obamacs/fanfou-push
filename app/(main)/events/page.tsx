import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventCard } from "@/components/events/EventCard";
import { Calendar, Sparkles } from "lucide-react";
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
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#fff0ef] px-3 py-1.5 text-xs font-semibold text-[#ff2442]">
            <Sparkles className="h-3.5 w-3.5" />
            本周开放预订
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#271f1d] sm:text-5xl">
            预订本周四的座位
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-8 text-[#9d8580]">
            每周四晚 20:00。不需要费心挑选餐厅，也不需要尬聊破冰。选择你的城市，报名入池。周三我们会通过算法为你分配最契合的 5 位陌生人，并在当天揭晓神秘餐厅。
          </p>
        </div>

        {eventsToShow.length > 0 ? (
          <div className="grid grid-cols-1 justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="surface-card mx-auto max-w-2xl rounded-lg px-6 py-20 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0ef]">
              <Calendar className="h-8 w-8 text-[#ff2442]" />
            </div>
            <h2 className="mb-2 text-[21px] font-semibold text-[#271f1d]">
              本周活动正在筹备中
            </h2>
            <p className="mx-auto mb-8 max-w-sm text-[15px] leading-6 text-[#9d8580]">
              你所在城市 ({userCity}) 的周四晚餐池尚未开启，请稍后再来看看。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
