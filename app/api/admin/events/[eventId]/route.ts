import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { eventId } = await params;

    // Delete related records first
    await db.eventAttendance.deleteMany({
      where: { eventId },
    });

    await db.message.deleteMany({
      where: { eventId },
    });

    await db.rating.deleteMany({
      where: { eventId },
    });

    await db.report.deleteMany({
      where: { reportedEventId: eventId },
    });

    // Delete the event
    await db.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "删除活动失败" },
      { status: 500 }
    );
  }
}
