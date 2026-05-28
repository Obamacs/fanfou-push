import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

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
        creatorId: authResult.userId,
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
