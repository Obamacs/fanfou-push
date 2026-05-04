import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { latitude, longitude } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "缺少位置信息" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: auth.userId },
      data: {
        latitude,
        longitude,
        lastLocationUpdate: new Date(),
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "位置更新失败");
  }
}
