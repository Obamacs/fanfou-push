"use client";

import { Card } from "@/components/ui/card";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: string;
    city: string;
    date: Date | string;
    imageUrl?: string | null;
    maxAttendees: number;
    priceAmount: number;
    status: string;
    creator: { id: string; name: string; avatarUrl?: string | null };
    _count: { attendances: number };
  };
  currentUserId?: string;
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.date);
  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const confirmed = event._count.attendances;
  const remaining = event.maxAttendees - confirmed;
  const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS["其他"];

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <Card className="surface-card overflow-hidden rounded-lg p-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(80,35,30,0.14)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#fff0ef]">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${colors.bg}`}>
              <span className="text-6xl">{colors.icon}</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute top-4 left-4">
            {event.priceAmount === 0 ? (
              <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#271f1d] shadow-sm backdrop-blur-sm">
                免费
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-[#271f1d]/82 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
                ￥{event.priceAmount}
              </span>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ${colors.bg} ${colors.text}`}>
              {event.type}
            </span>
          </div>
          {event.status === "CANCELLED" && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="rounded-full bg-[#f0dfda] px-4 py-1.5 text-sm font-semibold text-[#9d8580]">
                已取消
              </span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <h3 className="line-clamp-2 text-[18px] font-semibold leading-snug text-[#271f1d] transition-colors group-hover:text-[#ff2442]">
            {event.title}
          </h3>

          <div className="space-y-2 text-sm text-[#9d8580]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.city}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#9d8580]" />
              <span className="text-xs text-[#9d8580]">
                {confirmed}/{event.maxAttendees}
              </span>
              {remaining > 0 && remaining <= 2 && (
                <span className="text-xs text-orange-500 font-medium ml-1">
                  仅剩 {remaining} 席
                </span>
              )}
            </div>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-[#f0dfda]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  confirmed >= event.maxAttendees
                    ? "bg-orange-400"
                    : confirmed / event.maxAttendees > 0.7
                    ? "bg-amber-400"
                    : "bg-[#ff2442]"
                }`}
                style={{ width: `${Math.min(100, (confirmed / event.maxAttendees) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-[#f0dfda] pt-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff2442]/10 text-xs font-medium text-[#ff2442]">
              {event.creator.name.charAt(0)}
            </div>
            <span className="text-xs text-[#9d8580]">{event.creator.name}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
