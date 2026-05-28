import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-helpers";
import { ReportStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

    const { reportId } = await params;
    const { status } = await req.json();

    if (!status || !Object.values(ReportStatus).includes(status as ReportStatus)) {
      return NextResponse.json({ error: "无效的举报状态值" }, { status: 400 });
    }

    const report = await db.report.update({
      where: { id: reportId },
      data: {
        status: status as ReportStatus,
        resolvedAt: ["RESOLVED", "DISMISSED"].includes(status)
          ? new Date()
          : null,
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json(
      { error: "更新举报失败" },
      { status: 500 }
    );
  }
}
