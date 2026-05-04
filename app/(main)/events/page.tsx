import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventCard } from "@/components/events/EventCard";
import { EventFilters } from "@/components/events/EventFilters";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EventsPageProps {
  searchParams: {
    city?: string;
    type?: string;
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const session = await auth();

  const where: any = {
    status: { not: "CANCELLED" },
  };

  if (searchParams.city) {
    where.city = { contains: searchParams.city, mode: "insensitive" };
  }

  if (searchParams.type) {
    where.type = searchParams.type;
  }

  const events = await db.event.findMany({
    where,
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      _count: {
        select: {
          attendances: {
            where: { status: "CONFIRMED" },
          },
        },
      },
    },
    orderBy: { date: "asc" },
    take: 20,
  });

  return (
    <div className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">发现活动</h1>
          {session?.user && (
            <Link href="/events/new">
              <Button>创建活动</Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <EventFilters />

        {/* Events grid */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  date: event.date,
                }}
                currentUserId={session?.user?.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              暂无活动
            </h2>
            <p className="text-gray-600 mb-6">
              成为第一个发起人，创建属于你的活动吧！
            </p>
            {session?.user && (
              <Link href="/events/new">
                <Button>创建活动</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
