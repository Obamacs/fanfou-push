import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttendButton } from "@/components/events/AttendButton";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { AMap } from "@/components/events/AMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import Link from "next/link";
import { notFound } from "next/navigation";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function EventDetailPage({
  params,
  searchParams,
}: EventDetailPageProps) {
  const session = await auth();
  const { id } = await params;
  const { payment } = await searchParams;

  const event = await db.event.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      attendances: {
        where: {
          status: { in: ["CONFIRMED", "PENDING", "WAITLISTED"] },
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: {
        select: {
          attendances: {
            where: { status: "CONFIRMED" },
          },
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  const isCreator = session?.user?.id === event.creatorId;
  const isAttending = event.attendances.some(
    (a) => a.userId === session?.user?.id && a.status !== "CANCELLED"
  );
  const attendance = event.attendances.find(
    (a) => a.userId === session?.user?.id
  );
  const isFull =
    event._count.attendances >= event.maxAttendees &&
    !isAttending;

  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(event.date));

  const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS["其他"];

  const confirmedAttendees = event.attendances.filter(
    (a) => a.status === "CONFIRMED"
  );
  const waitlistedCount = event.attendances.filter(
    (a) => a.status === "WAITLISTED"
  ).length;

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link href="/events" className="text-indigo-600 hover:text-indigo-700 mb-6 inline-block">
          ← 返回活动列表
        </Link>

        {/* Payment banners */}
        {payment === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-semibold">
              🎉 报名成功！期待与你相见
            </p>
          </div>
        )}
        {payment === "cancelled" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700 font-semibold">
              已取消支付，如需报名请重试
            </p>
          </div>
        )}

        {/* Hero image */}
        <div className="relative h-64 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg overflow-hidden mb-6">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">📌</span>
            </div>
          )}
        </div>

        {/* Title and badges */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-3">
            <Badge className={`${colors.bg} ${colors.text} border-0`}>
              {event.type}
            </Badge>
            <Badge
              variant={
                event.status === "UPCOMING"
                  ? "secondary"
                  : event.status === "CANCELLED"
                  ? "destructive"
                  : "outline"
              }
            >
              {event.status === "UPCOMING"
                ? "即将开始"
                : event.status === "ONGOING"
                ? "进行中"
                : event.status === "COMPLETED"
                ? "已结束"
                : "已取消"}
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Date and location */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">时间</div>
                  <div className="font-semibold">{formattedDate}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">地点</div>
                  <div className="font-semibold">
                    {event.city}
                    {event.address && ` · ${event.address}`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price and capacity */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">费用</div>
                  <div className="font-semibold">
                    {event.priceAmount === 0 ? "免费" : `￥${event.priceAmount}`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">参加人数</div>
                  <div className="font-semibold">
                    {event._count.attendances} / {event.maxAttendees} 人
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">活动地点</h2>
          </CardHeader>
          <CardContent>
            <AMap
              latitude={event.latitude}
              longitude={event.longitude}
              address={event.address}
              city={event.city}
              title={event.title}
            />
          </CardContent>
        </Card>

        {/* Description */}
        {event.description && (
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">活动描述</h2>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {event.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Attendees */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              参加者 ({confirmedAttendees.length})
            </h2>
          </CardHeader>
          <CardContent>
            {confirmedAttendees.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {confirmedAttendees.map((attendance) => (
                  <div
                    key={attendance.userId}
                    className="flex flex-col items-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 mb-1">
                      {attendance.user.name.charAt(0)}
                    </div>
                    <div className="text-xs text-gray-600 text-center max-w-12 truncate">
                      {attendance.user.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">暂无参加者</p>
            )}
            {waitlistedCount > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  还有 {waitlistedCount} 人在候补中
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creator info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-semibold text-indigo-700">
                {event.creator.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm text-gray-600">发起人</div>
                <div className="font-semibold">{event.creator.name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          {isCreator ? (
            <>
              <Link href={`/events/${event.id}/edit`}>
                <Button>编辑活动</Button>
              </Link>
              <DeleteEventButton eventId={event.id} />
            </>
          ) : (
            session?.user && (
              <AttendButton
                eventId={event.id}
                initialIsAttending={isAttending}
                initialStatus={
                  (attendance?.status as
                    | "CONFIRMED"
                    | "PENDING"
                    | "WAITLISTED"
                    | null) || null
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
