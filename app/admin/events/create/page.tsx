import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EventForm } from "@/components/events/EventForm";

export default async function AdminCreateEventPage() {
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

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">创建新活动</h1>
      <Card className="bg-[#241918] border-[#2D1E1A] p-8">
        <EventForm mode="create" />
      </Card>
    </div>
  );
}
