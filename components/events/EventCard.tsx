"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EVENT_TYPE_COLORS } from "@/lib/constants";
import Link from "next/link";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: string;
    city: string;
    address?: string | null;
    date: Date | string;
    imageUrl?: string | null;
    maxAttendees: number;
    priceAmount: number;
    status: string;
    creator: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    };
    _count: {
      attendances: number;
    };
  };
  currentUserId?: string;
}

export function EventCard({ event }: EventCardProps) {
  const date = new Date(event.date);
  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const confirmed = event._count.attendances;
  const percentage = Math.round((confirmed / event.maxAttendees) * 100);
  const colors = EVENT_TYPE_COLORS[event.type] || EVENT_TYPE_COLORS["其他"];

  const creatorInitial = event.creator.name.charAt(0);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="overflow-hidden card-hover cursor-pointer border-0 shadow-md bg-white">
        {/* Image or gradient placeholder */}
        <div className="relative h-40 bg-gradient-to-br from-[#FF2D55] via-[#FF4D7E] to-[#FF6B35] overflow-hidden">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">✨</span>
            </div>
          )}
          {event.status === "CANCELLED" && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg">
                已取消
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <Badge className={`${colors.bg} ${colors.text} border-0 mb-2`}>
                {event.type}
              </Badge>
              <h3 className="font-semibold text-base line-clamp-2">
                {event.title}
              </h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Location and date */}
          <div className="space-y-1 text-sm text-gray-600">
            <div>📍 {event.city}</div>
            <div>🕐 {formattedDate}</div>
          </div>

          {/* Attendees progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>参加人数</span>
              <span>
                {confirmed} / {event.maxAttendees}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            {event.priceAmount === 0 ? (
              <Badge className="bg-green-100 text-green-700 border-0">免费</Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-[#FF2D55] to-[#FF6B35] text-white border-0">
                ￥{event.priceAmount}
              </Badge>
            )}
          </div>

          {/* Creator */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center text-xs font-semibold text-white">
              {creatorInitial}
            </div>
            <span className="text-xs text-gray-600">{event.creator.name}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
