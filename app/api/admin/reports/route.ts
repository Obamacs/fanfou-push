import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const reports = await db.report.findMany({
      select: {
        id: true,
        reason: true,
        description: true,
        status: true,
        createdAt: true,
        reportedBy: {
          select: { name: true, email: true },
        },
        reportedUser: {
          select: { name: true, email: true },
        },
        reportedEvent: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { error: "获取举报列表失败" },
      { status: 500 }
    );
  }
}
