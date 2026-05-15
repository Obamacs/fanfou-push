import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/events/EventForm";

export default async function AdminEditEventPage({
  params,
}: {
  params: { eventId: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 检查是否为管理员
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    redirect("/events");
  }

  // 获取活动信息
  const event = await db.event.findUnique({
    where: { id: params.eventId },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!event) {
    redirect("/admin/events");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">编辑活动</h1>
      <Card className="bg-[#241918] border-[#2D1E1A] p-8">
        <EventForm mode="edit" initialData={event} />
      </Card>
    </div>
  );
}
