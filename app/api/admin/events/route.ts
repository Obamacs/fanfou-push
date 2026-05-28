import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 100);
    const skip = (page - 1) * limit;

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
      skip,
      take: limit,
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
