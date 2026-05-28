import { NextRequest, NextResponse } from "next/server";
import { findMatch } from "@/lib/match-actions";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // Rate Limiting (Max 5 matchmaking queries per minute)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const limitKey = `match:find:${session.user.id}:${ip}`;
    const rateLimit = await checkRateLimit(limitKey, {
      maxRequests: 5,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "发起匹配请求过于频繁，请稍后再试。" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const { activityType } = await req.json();
    const result = await findMatch(activityType);
    if (result.error) {
      const status =
        result.error === "未授权" ? 401
        : result.error === "用户不存在" ? 404
        : result.error.includes("已有一个活跃") ? 400
        : result.error.includes("入职") ? 400
        : result.error.includes("附近暂时没有") ? 400
        : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ matchId: result.matchId });
  } catch (error) {
    console.error("Match find error:", error);
    return NextResponse.json(
      { error: "匹配失败，请重试" },
      { status: 500 }
    );
  }
}
