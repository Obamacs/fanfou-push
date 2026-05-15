"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface Event {
  id: string;
  title: string;
  city: string;
  type: string;
  status: string;
  date: string;
  createdAt: string;
  creator: { name: string; email: string };
  _count: { attendances: number };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("确定要删除这个活动吗？")) return;

    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setEvents(events.filter((e) => e.id !== eventId));
        alert("活动已删除");
      } else {
        alert("删除失败");
      }
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("删除失败");
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || event.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="text-[#B8A099]">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">活动管理</h1>
        <Link href="/admin/events/create">
          <Button className="bg-[#FF2442] hover:bg-[#FF4D63] text-white">
            + 创建活动
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="搜索活动标题..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-[#241918] border-[#2D1E1A] text-white placeholder-gray-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-[#241918] border border-[#2D1E1A] text-white rounded-lg font-medium"
        >
          <option value="all">全部状态</option>
          <option value="UPCOMING">即将开始</option>
          <option value="ONGOING">进行中</option>
          <option value="COMPLETED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>
      </div>

      {/* Events Table */}
      <Card className="bg-[#241918] border-[#2D1E1A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1A1311] border-b border-[#2D1E1A]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">
                  活动
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">
                  创建者
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">
                  时间
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">
                  参加人数
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-white">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D1E1A]">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-[#1A1311]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-semibold text-base">{event.title}</p>
                      <p className="text-[#B8A099] text-sm mt-1">
                        {event.city} · {event.type}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium text-sm">{event.creator.name}</p>
                      <p className="text-[#B8A099] text-xs mt-1">
                        {event.creator.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#B8A099] text-sm font-medium">
                    {new Date(event.date).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-[#B8A099] font-medium">
                    {event._count.attendances} 人
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full inline-block ${
                        event.status === "UPCOMING"
                          ? "bg-[#FF2442]/20 text-[#FF4D63]"
                          : event.status === "ONGOING"
                          ? "bg-[#FF6B35]/20 text-[#FF8C69]"
                          : event.status === "COMPLETED"
                          ? "bg-[#2D1E1A] text-[#B8A099]"
                          : "bg-red-500/20 text-[#FF4D63]"
                      }`}
                    >
                      {event.status === "UPCOMING"
                        ? "即将开始"
                        : event.status === "ONGOING"
                        ? "进行中"
                        : event.status === "COMPLETED"
                        ? "已完成"
                        : "已取消"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link href={`/admin/events/${event.id}/edit`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#FF2442] hover:text-[#FF4D63] hover:bg-[#FF2442]/10 font-medium"
                        >
                          编辑
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-[#FF2442] hover:text-[#FF4D63] hover:bg-red-500/10 font-medium"
                      >
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty state */}
      {filteredEvents.length === 0 && (
        <Card className="bg-[#241918] border-[#2D1E1A] p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-[#B8A099] text-lg">暂无活动</p>
        </Card>
      )}
    </div>
  );
}
