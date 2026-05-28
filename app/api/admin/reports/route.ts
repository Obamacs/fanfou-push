import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const [reports, total] = await Promise.all([
      db.report.findMany({
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.report.count(),
    ]);

    return NextResponse.json({ reports, total, page, limit });
  } catch (error) {
    console.error("Reports fetch error:", error);
    return NextResponse.json(
      { error: "获取举报列表失败" },
      { status: 500 }
    );
  }
}
