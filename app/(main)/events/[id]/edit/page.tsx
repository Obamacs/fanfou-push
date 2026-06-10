import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventForm } from "@/components/events/EventForm";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { CalendarClock, MapPin, Ticket, Users } from "lucide-react";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const event = await db.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  if (event.creatorId !== (session.user.id as string)) {
    redirect(`/events/${id}`);
  }

  const eventDate = new Date(event.date);
  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Shanghai",
  }).format(eventDate);
  const formattedTime = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(eventDate);

  const metrics = [
    {
      label: "活动时间",
      value: formattedDate,
      detail: formattedTime,
      icon: CalendarClock,
      accent: "text-[#FF2442]",
      bg: "bg-[#FFF1F4]",
    },
    {
      label: "城市地点",
      value: event.city,
      detail: event.address || "待补充详细地址",
      icon: MapPin,
      accent: "text-[#1677FF]",
      bg: "bg-[#EEF6FF]",
    },
    {
      label: "最多人数",
      value: `${event.maxAttendees}`,
      detail: "人可报名",
      icon: Users,
      accent: "text-[#07A35A]",
      bg: "bg-[#ECFFF5]",
    },
    {
      label: "保证金",
      value: event.priceAmount === 0 ? "免费" : `￥${event.priceAmount}`,
      detail: "支付前清晰展示",
      icon: Ticket,
      accent: "text-[#D97706]",
      bg: "bg-[#FFF7E8]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F7]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 overflow-hidden rounded-[28px] border border-[#F4DDD8] bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF4F3_52%,#FFECEE_100%)] p-5 shadow-[0_18px_50px_rgba(255,36,66,0.08)] sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[12px] font-bold text-[#FF2442] shadow-sm">
                Event studio
              </div>
              <h1 className="text-[32px] font-black leading-tight text-[#2D2420] sm:text-[38px]">
                编辑活动
              </h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#8D746D] sm:text-[16px]">
                把时间、名额和保证金写清楚，活动页会更像一篇可以被放心报名的小红书笔记。
              </p>
            </div>
            <div className="rounded-2xl bg-[#2D2420] px-4 py-3 text-white shadow-[0_12px_28px_rgba(45,36,32,0.18)]">
              <div className="text-[11px] font-semibold text-white/60">正在编辑</div>
              <div className="mt-1 max-w-[260px] truncate text-[16px] font-bold">{event.title}</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[12px] font-semibold text-[#8D746D]">{item.label}</span>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.bg}`}>
                      <Icon className={`h-4 w-4 ${item.accent}`} />
                    </span>
                  </div>
                  <div className="truncate text-[24px] font-black leading-none text-[#2D2420]">{item.value}</div>
                  <div className="mt-2 truncate text-[12px] font-medium text-[#B8A099]">{item.detail}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-[#F0DFDA] bg-white p-5 shadow-[0_14px_42px_rgba(45,36,32,0.06)] sm:p-7">
          <EventForm mode="edit" initialData={event} />
        </div>
      </div>
    </div>
  );
}
