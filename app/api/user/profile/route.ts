import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAuth, handleError } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isOnboarded: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "获取用户信息失败");
  }
}
