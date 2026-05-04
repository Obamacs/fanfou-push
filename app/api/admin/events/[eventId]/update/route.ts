import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 检查是否为管理员
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    const { eventId } = await params;
    const { title, description, type, city, address, date, maxAttendees } =
      await req.json();

    const event = await db.event.update({
      where: { id: eventId },
      data: {
        title,
        description,
        type,
        city,
        address,
        date: new Date(date),
        maxAttendees,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      { error: "更新失败，请重试" },
      { status: 500 }
    );
  }
}
