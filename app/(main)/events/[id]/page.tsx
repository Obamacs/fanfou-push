import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttendButton } from "@/components/events/AttendButton";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";
import { AMap } from "@/components/events/AMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import { Calendar, MapPin, Users, Clock, Ticket, ChevronLeft, User, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
        include: { user: { select: { id: true, name: true, avatarUrl: true, gender: true, ageGroup: true } } },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { attendances: { where: { status: "CONFIRMED" } } } },
    },
  });

  if (!event) notFound();

  // Load dynamic settings from database
  const settingsRow = await db.appSettings.findUnique({
    where: { key: "runtime_settings" },
  });
  let serviceFeeRate = 20; // Default 20%
  if (settingsRow) {
    try {
      const parsed = JSON.parse(settingsRow.value);
      if (typeof parsed.serviceFeeRate === "number") {
        serviceFeeRate = parsed.serviceFeeRate;
      }
    } catch {}
  }

  const pendingOrder = session?.user?.id ? await db.reservationOrder.findFirst({
    where: {
      eventId: id,
      userId: session.user.id,
      status: "PENDING",
    },
    select: {
      orderCode: true,
      amount: true,
      platformFee: true,
      depositFee: true,
      couponCode: true,
    },
  }) : null;

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

  // Timeleft Reveal System Logic
  const now = new Date();
  
  // 1. Address Reveal: 12 hours before event
  const revealTime = new Date(eventDate.getTime() - 12 * 60 * 60 * 1000);
  const isAddressRevealed = now >= revealTime || isCreator;
  
  // 2. Attendee Reveal: At event start time
  const isAttendeeRevealed = now >= eventDate || isCreator;

  return (
    <div className="min-h-screen bg-[#FFFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link href="/events" className="inline-flex items-center gap-1 text-[15px] text-[#B8A099] hover:text-[#2D2420] mb-6 transition-colors">
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
        <div className="relative aspect-[2/1] bg-[#FFF5F3] rounded-3xl overflow-hidden mb-8">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
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
              event.status === "UPCOMING" ? "bg-[#FFF0F3] text-[#FF2442]" :
              event.status === "ONGOING" ? "bg-green-50 text-green-600" :
              event.status === "COMPLETED" ? "bg-[#FFF5F3] text-[#B8A099]" :
              "bg-red-50 text-red-600"
            }`}>
              {event.status === "UPCOMING" ? "即将开始" :
               event.status === "ONGOING" ? "进行中" :
               event.status === "COMPLETED" ? "已结束" : "已取消"}
            </span>
          </div>
          <h1 className="text-[34px] font-bold text-[#2D2420] tracking-tight leading-tight">
            {event.title}
          </h1>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFFAF8] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-[#2D2420]" />
              </div>
              <div>
                <div className="text-xs text-[#B8A099] mb-0.5">时间</div>
                <div className="text-[15px] font-semibold text-[#2D2420]">{formattedDate}</div>
                <div className="text-[13px] text-[#B8A099]">{formattedTime}</div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFFAF8] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-[#2D2420]" />
              </div>
              <div>
                <div className="text-xs text-[#B8A099] mb-0.5">地点</div>
                <div className="text-[15px] font-semibold text-[#2D2420]">{event.city}</div>
                {event.address && (
                  <div className="text-[13px] text-[#B8A099] flex items-center gap-1">
                    {isAddressRevealed ? event.address : (
                      <>
                        <Lock className="w-3 h-3" />
                        地点将在活动前12小时揭晓
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFFAF8] flex items-center justify-center flex-shrink-0">
                <Ticket className="w-4 h-4 text-[#2D2420]" />
              </div>
              <div>
                <div className="text-xs text-[#B8A099] mb-0.5">费用</div>
                <div className="text-[15px] font-semibold text-[#2D2420]">
                  {event.priceAmount === 0 ? "免费" : `￥${event.priceAmount}`}
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FFFAF8] flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-[#2D2420]" />
              </div>
              <div>
                <div className="text-xs text-[#B8A099] mb-0.5">名额</div>
                <div className="text-[15px] font-semibold text-[#2D2420]">
                  {event._count.attendances} / {event.maxAttendees} 人
                </div>
                {isFull && <div className="text-[13px] text-orange-500">已满员</div>}
                {!isFull && event._count.attendances < event.maxAttendees && (
                  <div className="text-[13px] text-[#B8A099]">
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
            <h2 className="text-[19px] font-semibold text-[#2D2420] mb-3">关于活动</h2>
            <p className="text-[15px] text-[#B8A099] leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Localized Dining Expectations (Changsha & Timeleft style) */}
        {(event.estimatedSpend || event.estimatedSpicy || event.estimatedCuisine || event.alcoholPolicy) && (
          <div className="bg-[#FFF5F3]/50 border border-[#F0E4E0]/60 rounded-3xl p-6 mb-8 space-y-4 shadow-[0_1px_3px_rgba(240,228,224,0.2)]">
            <h2 className="text-[17px] font-bold text-[#FF2442] flex items-center gap-1.5 mb-2">
              🍴 长沙聚餐特色与消费参考
            </h2>
            <div className="grid grid-cols-2 gap-5">
              {event.estimatedCuisine && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#F0E4E0]/45 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                    🍽️
                  </div>
                  <div>
                    <div className="text-[11px] text-[#B8A099]">推荐菜系</div>
                    <div className="text-[13.5px] font-bold text-[#2D2420]">{event.estimatedCuisine}</div>
                  </div>
                </div>
              )}

              {event.estimatedSpicy && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#F0E4E0]/45 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                    🌶️
                  </div>
                  <div>
                    <div className="text-[11px] text-[#B8A099]">长沙辣度参考</div>
                    <div className="text-[13.5px] font-bold text-[#2D2420]">{event.estimatedSpicy}</div>
                  </div>
                </div>
              )}

              {event.estimatedSpend && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#F0E4E0]/45 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                    💰
                  </div>
                  <div>
                    <div className="text-[11px] text-[#B8A099]">餐费人均估算</div>
                    <div className="text-[13.5px] font-bold text-[#2D2420]">{event.estimatedSpend}</div>
                  </div>
                </div>
              )}

              {event.alcoholPolicy && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-[#F0E4E0]/45 flex items-center justify-center flex-shrink-0 text-xl shadow-xs">
                    🍺
                  </div>
                  <div>
                    <div className="text-[11px] text-[#B8A099]">饮酒社交规则</div>
                    <div className="text-[13.5px] font-bold text-[#2D2420]">{event.alcoholPolicy}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        {event.type !== "POOL" ? (
          <div className="mb-8">
            <h2 className="text-[19px] font-semibold text-[#2D2420] mb-3">活动地点</h2>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              {isAddressRevealed ? (
                <AMap latitude={event.latitude} longitude={event.longitude} address={event.address} city={event.city} title={event.title} />
              ) : (
                <div className="h-[200px] bg-[#FFF5F3] flex flex-col items-center justify-center p-6 text-center">
                  <Lock className="w-8 h-8 text-[#B8A099] mb-3 opacity-50" />
                  <p className="text-[15px] font-medium text-[#2D2420]">保持神秘，遇见惊喜</p>
                  <p className="text-[13px] text-[#B8A099] mt-1 max-w-[250px]">
                    为了给你最纯粹的盲盒交友体验，具体地点将在活动开始前 12 小时准时揭晓
                  </p>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-[19px] font-semibold text-[#2D2420] mb-3">餐厅安排</h2>
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-white">
              <div className="h-[200px] bg-[#FFF5F3] flex flex-col items-center justify-center p-6 text-center">
                <Lock className="w-8 h-8 text-[#B8A099] mb-3 opacity-50" />
                <p className="text-[15px] font-medium text-[#2D2420]">算法分桌中</p>
                <p className="text-[13px] text-[#B8A099] mt-1 max-w-[280px]">
                  周三我们将为你精准匹配 5 位同桌伙伴，周四你将收到具体的餐厅地址和座位信息。
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Attendees */}
        <div className="mb-8">
          <h2 className="text-[19px] font-semibold text-[#2D2420] mb-3">
            参加者 ({confirmedAttendees.length})
          </h2>
          <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white">
            {confirmedAttendees.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {confirmedAttendees.map((att) => {
                  const isMe = session?.user?.id === att.userId;
                  const showReal = isAttendeeRevealed || isMe;
                  const genderLabel = att.user.gender === "MALE" ? "男生" : att.user.gender === "FEMALE" ? "女生" : "神秘人";
                  
                  return (
                    <div key={att.userId} className="flex flex-col items-center gap-1.5">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${showReal ? 'bg-[#FF2442]/10 text-[#FF2442]' : 'bg-[#FFF5F3] text-[#B8A099]'}`}>
                        {showReal ? att.user.name.charAt(0) : "?"}
                      </div>
                      <span className="text-xs text-[#B8A099] max-w-[64px] truncate text-center">
                        {showReal ? att.user.name : (att.user.ageGroup ? `${att.user.ageGroup} ${genderLabel}` : genderLabel)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[15px] text-[#B8A099]">还没有参加者，来做第一个吧</p>
            )}
            {waitlistedCount > 0 && (
              <div className="mt-4 pt-4 border-t border-[#F0E4E0]">
                <p className="text-sm text-[#B8A099]">{waitlistedCount} 人在候补中</p>
              </div>
            )}
            {!isAttendeeRevealed && confirmedAttendees.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#F0E4E0] flex items-center gap-2 text-sm text-[#B8A099]">
                <Lock className="w-3 h-3" />
                <span>小伙伴的真实身份将在活动开始时揭晓</span>
              </div>
            )}
          </Card>
        </div>

        {/* Creator */}
        <Card className="border-0 shadow-sm rounded-2xl p-5 bg-white mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF2442]/10 flex items-center justify-center font-semibold text-[#FF2442]">
              {event.creator.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs text-[#B8A099]">发起人</div>
              <div className="text-[15px] font-semibold text-[#2D2420]">{event.creator.name}</div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          {isCreator ? (
            <>
              <Link href={`/events/${event.id}/edit`}>
                <Button className="rounded-full px-6 bg-[#FF2442] hover:bg-[#FF4D63] text-white font-medium">
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
                estimatedSpend={event.estimatedSpend}
                serviceFeeRate={serviceFeeRate}
                initialOrderCode={pendingOrder?.orderCode}
                initialOrderAmount={pendingOrder?.amount}
                initialPlatformFee={pendingOrder?.platformFee}
                initialDepositFee={pendingOrder?.depositFee}
                initialCouponCode={pendingOrder?.couponCode}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

