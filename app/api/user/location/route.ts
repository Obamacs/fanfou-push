import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleError } from "@/lib/api-helpers";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  // Rate Limiting Protection (Max 10 requests per minute)
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const limitKey = `user:location:${auth.userId}:${ip}`;
  const rateLimit = await checkRateLimit(limitKey, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "更新位置过于频繁，请稍后再试。" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

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
      select: {
        id: true,
        email: true,
        name: true,
        latitude: true,
        longitude: true,
        lastLocationUpdate: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "位置更新失败");
  }
}
