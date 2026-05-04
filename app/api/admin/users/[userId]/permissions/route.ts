import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleError } from "@/lib/api-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { userId } = await params;
    const { canCreateEvents } = await req.json();

    if (typeof canCreateEvents !== "boolean") {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { canCreateEvents },
      select: {
        id: true,
        email: true,
        name: true,
        canCreateEvents: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "权限更新失败");
  }
}
