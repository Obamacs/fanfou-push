import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
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

    const { title, description, type, city, address, date, maxAttendees } =
      await req.json();

    if (!title || !type || !city || !date) {
      return NextResponse.json(
        { error: "请填写所有必填项" },
        { status: 400 }
      );
    }

    const event = await db.event.create({
      data: {
        title,
        description,
        type,
        city,
        address,
        date: new Date(date),
        maxAttendees: maxAttendees || 6,
        creatorId: session.user.id,
        status: "UPCOMING",
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: "创建失败，请重试" },
      { status: 500 }
    );
  }
}
