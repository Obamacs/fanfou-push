import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventsViewSwitcher } from "@/components/events/EventsViewSwitcher";
import { Sparkles } from "lucide-react";
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

  // 1. 获取用户已经报名参加的活动 (无论类型和城市，只要报名了)
  const myJoinedEvents = await db.event.findMany({
    where: {
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

  // 2. 获取当前城市本周开放的所有公开报名活动 (POOL 或公开的 DINNER 等)
  const publicCityEvents = await db.event.findMany({
    where: {
      status: "UPCOMING",
      city: { contains: userCity, mode: "insensitive" },
      id: { notIn: myJoinedEvents.map(e => e.id) }, // 避免重复显示用户已加入的活动
    },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { attendances: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { date: "asc" },
  });

  const eventsToShow = [...myJoinedEvents, ...publicCityEvents];

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

        <EventsViewSwitcher 
          events={eventsToShow} 
          userCity={userCity} 
          currentUserId={session?.user?.id} 
        />
      </div>
    </div>
  );
}
