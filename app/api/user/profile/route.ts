import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
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
        bio: true,
        age: true,
        gender: true,
        city: true,
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

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { name, bio, age, gender, city, avatarUrl } = body;

    const user = await db.user.update({
      where: { id: auth.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(age !== undefined && { age: age ? parseInt(age, 10) : null }),
        ...(gender !== undefined && { gender }),
        ...(city !== undefined && { city }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isOnboarded: true,
        role: true,
        avatarUrl: true,
        bio: true,
        age: true,
        gender: true,
        city: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "更新用户信息失败");
  }
}
