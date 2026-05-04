import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { reportId } = await params;
    const { status } = await req.json();

    const report = await db.report.update({
      where: { id: reportId },
      data: {
        status,
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
