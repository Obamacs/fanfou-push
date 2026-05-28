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

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        gender: true,
        isActive: true,
        isBanned: true,
        role: true,
        canCreateEvents: true,
        createdAt: true,
        _count: {
          select: {
            eventsCreated: true,
            eventAttendances: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "获取用户列表失败" },
      { status: 500 }
    );
  }
}
