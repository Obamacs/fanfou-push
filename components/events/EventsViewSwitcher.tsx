"use client";

import { useState } from "react";
import { EventCard } from "@/components/events/EventCard";
import { EventsMap } from "@/components/events/EventsMap";
import { Calendar, Map as MapIcon, List } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  type: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  date: Date | string;
  imageUrl?: string | null;
  maxAttendees: number;
  priceAmount: number;
  status: string;
  creator: { id: string; name: string; avatarUrl?: string | null };
  _count: { attendances: number };
}

interface EventsViewSwitcherProps {
  events: EventItem[];
  userCity: string;
  currentUserId?: string;
}

export function EventsViewSwitcher({ events, userCity, currentUserId }: EventsViewSwitcherProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  return (
    <div className="w-full">
      {/* View Toggle */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex items-center bg-[#FFF5F3] p-1 rounded-full border border-[#F0E4E0]">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === "list" 
                ? "bg-white text-[#FF2442] shadow-sm" 
                : "text-[#B8A099] hover:text-[#2D2420]"
            }`}
          >
            <List className="w-4 h-4" />
            列表
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === "map" 
                ? "bg-white text-[#FF2442] shadow-sm" 
                : "text-[#B8A099] hover:text-[#2D2420]"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            地图
          </button>
        </div>
      </div>

      {events.length > 0 ? (
        viewMode === "list" ? (
          <div className="grid grid-cols-1 justify-items-center gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <div key={event.id} className="w-full max-w-md">
                <EventCard
                  event={{ ...event, date: event.date }}
                  currentUserId={currentUserId}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full aspect-[4/3] md:aspect-[2/1] lg:h-[600px] bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F0E4E0]">
            <EventsMap events={events} defaultCity={userCity} />
          </div>
        )
      ) : (
        <div className="surface-card mx-auto max-w-2xl rounded-lg px-6 py-20 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#fff0ef]">
            <Calendar className="h-8 w-8 text-[#ff2442]" />
          </div>
          <h2 className="mb-2 text-[21px] font-semibold text-[#271f1d]">
            本周活动正在筹备中
          </h2>
          <p className="mx-auto mb-8 max-w-sm text-[15px] leading-6 text-[#9d8580]">
            你所在城市 ({userCity}) 的活动尚未开启，请稍后再来看看。
          </p>
        </div>
      )}
    </div>
  );
}
