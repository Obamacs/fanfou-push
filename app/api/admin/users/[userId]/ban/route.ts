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
    const { isBanned } = await req.json();

    const user = await db.user.update({
      where: { id: userId },
      data: { isBanned },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "禁用用户失败");
  }
}
