import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttendButton } from "@/components/events/AttendButton";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { AMap } from "@/components/events/AMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import { Calendar, MapPin, Users, Clock, Ticket, ChevronLeft, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const session = await auth();
  const { id } = await params;
  const { payment } = await searchParams;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      attendances: {
        where: { status: { in: ["CONFIRMED", "PENDING", "WAITLISTED"] } },
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { attendances: { where: { status: "CONFIRMED" } } } },
    },
  });

  if (!event) notFound();

  const isCreator = session?.user?.id === event.creatorId;
  const isAttending = event.attendances.some(
    (a) => a.userId === session?.user?.id && a.status !== "CANCELLED"
  );
  const attendance = event.attendances.find((a) => a.userId === session?.user?.id);
  const isFull = event._count.attendances >= event.maxAttendees && !isAttending;
  const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS["其他"];
  const confirmedAttendees = event.attendances.filter((a) => a.status === "CONFIRMED");
  const waitlistedCount = event.attendances.filter((a) => a.status === "WAITLISTED").length;

  const eventDate = new Date(event.date);
  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
  }).format(eventDate);
  const formattedTime = new Intl.DateTimeFormat("zh-CN", {
    weekday: "short", hour: "2-digit", minute: "2-digit",
  }).format(eventDate);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/events" className="inline-flex items-center gap-1 text-[15px] text-[#86868b] hover:text-[#1d1d1f] mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          返回活动列表
        </Link>

        {/* Banners */}
        {payment === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-sm font-medium">
            报名成功！期待与你相见
          </div>
        )}
        {payment === "cancelled" && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-sm font-medium">
            已取消支付，如需报名请重试
          </div>
        )}

        {/* Hero image */}
        <div className="relative aspect-[2/1] bg-gray-100 rounded-3xl overflow-hidden mb-8">
          {event.imageUrl ? (
            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${colors.bg}`}>
              <span className="text-8xl">{colors.icon}</span>
            </div>
          )}
        </div>

        {/* Title section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              {colors.icon} {event.type}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              event.status === "UPCOMING" ? "bg-blue-50 text-blue-600" :
              event.status === "ONGOING" ? "bg-green-50 text-green-600" :
              event.status === "COMPLETED" ? "bg-gray-100 text-gray-600" :
              "bg-red-50 text-red-600"
            }`}>
              {event.status === "UPCOMING" ? "即将开始" :
               event.status === "ONGOING" ? "进行中" :
               event.status === "COMPLETED" ? "已结束" : "已取消"}
            </span>
          </div>
          <h1 className="text-[34px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#1d1d1f]" />
              </div>
              <div>
                <div className="text-xs text-[#86868b] mb-0.5">时间</div>
                <div className="text-[15px] font-semibold text-[#1d1d1f]">{formattedDate}</div>
                <div className="text-[13px] text-[#86868b]">{formattedTime}</div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#1d1d1f]" />
              </div>
              <div>
                <div className="text-xs text-[#86868b] mb-0.5">地点</div>
                <div className="text-[15px] font-semibold text-[#1d1d1f]">{event.city}</div>
                {event.address && <div className="text-[13px] text-[#86868b]">{event.address}</div>}
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <Ticket className="w-4 h-4 text-[#1d1d1f]" />
              </div>
              <div>
                <div className="text-xs text-[#86868b] mb-0.5">费用</div>
                <div className="text-[15px] font-semibold text-[#1d1d1f]">
                  {event.priceAmount === 0 ? "免费" : `￥${event.priceAmount}`}
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-[#1d1d1f]" />
              </div>
              <div>
                <div className="text-xs text-[#86868b] mb-0.5">名额</div>
                <div className="text-[15px] font-semibold text-[#1d1d1f]">
                  {event._count.attendances} / {event.maxAttendees} 人
                </div>
                {isFull && <div className="text-[13px] text-orange-500">已满员</div>}
                {!isFull && event._count.attendances < event.maxAttendees && (
                  <div className="text-[13px] text-[#86868b]">
                    剩余 {event.maxAttendees - event._count.attendances} 个名额
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Description */}
        {event.description && (
          <div className="mb-8">
            <h2 className="text-[19px] font-semibold text-[#1d1d1f] mb-3">关于活动</h2>
            <p className="text-[15px] text-[#86868b] leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Map */}
        <div className="mb-8">
          <h2 className="text-[19px] font-semibold text-[#1d1d1f] mb-3">活动地点</h2>
          <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
            <AMap latitude={event.latitude} longitude={event.longitude} address={event.address} city={event.city} title={event.title} />
          </Card>
        </div>

        {/* Attendees */}
        <div className="mb-8">
          <h2 className="text-[19px] font-semibold text-[#1d1d1f] mb-3">
            参加者 ({confirmedAttendees.length})
          </h2>
          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            {confirmedAttendees.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {confirmedAttendees.map((att) => (
                  <div key={att.userId} className="flex flex-col items-center gap-1.5">
                    <div className="w-11 h-11 rounded-full bg-[#0071e3]/10 flex items-center justify-center text-sm font-semibold text-[#0071e3]">
                      {att.user.name.charAt(0)}
                    </div>
                    <span className="text-xs text-[#86868b] max-w-[64px] truncate">
                      {att.user.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[15px] text-[#86868b]">还没有参加者，来做第一个吧</p>
            )}
            {waitlistedCount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-[#86868b]">{waitlistedCount} 人在候补中</p>
              </div>
            )}
          </Card>
        </div>

        {/* Creator */}
        <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 flex items-center justify-center font-semibold text-[#0071e3]">
              {event.creator.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-[#86868b]">发起人</div>
              <div className="text-[15px] font-semibold text-[#1d1d1f]">{event.creator.name}</div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          {isCreator ? (
            <>
              <Link href={`/events/${event.id}/edit`}>
                <Button className="rounded-full px-6 bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium">
                  编辑活动
                </Button>
              </Link>
              <DeleteEventButton eventId={event.id} />
            </>
          ) : (
            session?.user && (
              <AttendButton
                eventId={event.id}
                initialIsAttending={isAttending}
                initialStatus={
                  (attendance?.status as "CONFIRMED" | "PENDING" | "WAITLISTED" | null) || null
                }
                isFull={isFull}
                priceAmount={event.priceAmount}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
