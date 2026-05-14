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
      <Card className="overflow-hidden border-0 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-white rounded-3xl">
        {/* Image area */}
        <div className="relative aspect-[4/3] bg-[#FFF5F3] overflow-hidden">
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
          {/* Price chip */}
          <div className="absolute top-4 left-4">
            {event.priceAmount === 0 ? (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
                免费
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-[#2D2420]/80 backdrop-blur-sm text-white shadow-sm">
                ￥{event.priceAmount}
              </span>
            )}
          </div>
          {/* Type badge */}
          <div className="absolute top-4 right-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
              {event.type}
            </span>
          </div>
          {/* Cancelled overlay */}
          {event.status === "CANCELLED" && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#F0E4E0] text-[#B8A099]">
                已取消
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <h3 className="font-semibold text-[17px] leading-snug text-[#2D2420] line-clamp-2 group-hover:text-[#FF2442] transition-colors">
            {event.title}
          </h3>

          <div className="space-y-2 text-sm text-[#B8A099]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{event.city}</span>
            </div>
          </div>

          {/* Attendees bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#B8A099]" />
              <span className="text-xs text-[#B8A099]">
                {confirmed}/{event.maxAttendees}
              </span>
              {remaining > 0 && remaining <= 2 && (
                <span className="text-xs text-orange-500 font-medium ml-1">
                  仅剩 {remaining} 席
                </span>
              )}
            </div>
            {/* Mini progress bar */}
            <div className="w-16 h-1 bg-[#F0E4E0] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  confirmed >= event.maxAttendees
                    ? "bg-orange-400"
                    : confirmed / event.maxAttendees > 0.7
                    ? "bg-amber-400"
                    : "bg-[#FF2442]"
                }`}
                style={{ width: `${Math.min(100, (confirmed / event.maxAttendees) * 100)}%` }}
              />
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
            <div className="w-6 h-6 rounded-full bg-[#FF2442]/10 flex items-center justify-center text-xs font-medium text-[#FF2442]">
              {event.creator.name.charAt(0)}
            </div>
            <span className="text-xs text-[#B8A099]">{event.creator.name}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
