import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

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
