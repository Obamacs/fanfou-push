import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const events = await db.event.findMany({
      select: {
        id: true,
        title: true,
        city: true,
        type: true,
        status: true,
        date: true,
        createdAt: true,
        creator: {
          select: { name: true, email: true },
        },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Events fetch error:", error);
    return NextResponse.json(
      { error: "获取活动列表失败" },
      { status: 500 }
    );
  }
}
