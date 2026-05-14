import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";

interface EventsPageProps {
  searchParams: Promise<{ city?: string; type?: string }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const session = await auth();
  const { city, type } = await searchParams;

  const where: any = {
    status: { not: "CANCELLED" },
  };

  if (city) {
    where.city = { contains: city, mode: "insensitive" };
  }

  if (type) {
    where.type = type;
  }

  const events = await db.event.findMany({
    where,
    include: {
      creator: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { attendances: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { date: "asc" },
    take: 20,
  });

  return (
    <div className="min-h-screen bg-[#FFFAF8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-[#2D2420] tracking-tight">
                发现活动
              </h1>
              <p className="mt-2 text-[17px] text-[#B8A099]">
                选择你感兴趣的活动，直接出现就好
              </p>
            </div>
            {session?.user && (
              <Link href="/events/new">
                <Button className="rounded-full px-5 py-2.5 bg-[#FF2442] hover:bg-[#FF4D63] text-white text-[15px] font-medium shadow-sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  发起活动
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <EventFilters />
        </div>

        {/* Events grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{ ...event, date: event.date }}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gray-100 mb-6">
              <Sparkles className="w-8 h-8 text-[#B8A099]" />
            </div>
            <h2 className="text-[21px] font-semibold text-[#2D2420] mb-2">
              暂无活动
            </h2>
            <p className="text-[15px] text-[#B8A099] mb-8 max-w-sm mx-auto">
              成为第一个发起人，选择时间地点，我们帮你找到志同道合的伙伴
            </p>
            {session?.user && (
              <Link href="/events/new">
                <Button className="rounded-full px-6 py-2.5 bg-[#FF2442] hover:bg-[#FF4D63] text-white font-medium">
                  创建第一个活动
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
