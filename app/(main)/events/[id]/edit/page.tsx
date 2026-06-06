import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventForm } from "@/components/events/EventForm";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const event = await db.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  if (event.creatorId !== (session.user.id as string)) {
    redirect(`/events/${id}`);
  }

  return (
    <div className="min-h-screen bg-[#FFFAF8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[34px] font-bold text-[#2D2420] tracking-tight">
            编辑活动
          </h1>
          <p className="mt-1 text-[17px] text-[#B8A099]">
            修改活动信息，让更多人了解您的聚餐计划
          </p>
        </div>

        <div className="border-0 shadow-sm rounded-3xl p-6 sm:p-8 bg-white">
          <EventForm mode="edit" initialData={event} />
        </div>
      </div>
    </div>
  );
}
