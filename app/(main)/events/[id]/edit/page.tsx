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
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">编辑活动</h1>
      <EventForm mode="edit" initialData={event} />
    </div>
  );
}
