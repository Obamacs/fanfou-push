import { NextRequest, NextResponse } from "next/server";
import { findMatch } from "@/lib/match-actions";
import { validateAuth, logAuditEvent } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Input validation schema
const findMatchRequestSchema = z.object({
  activityType: z.string().optional(),
  ageMin: z.number().int().min(18).max(100).optional(),
  ageMax: z.number().int().min(18).max(100).optional(),
  maxDistance: z.number().positive().optional(),
});

type FindMatchRequest = z.infer<typeof findMatchRequestSchema>;

export async function POST(req: NextRequest) {
  try {
    // Step 1: Validate authentication
    const authResult = await validateAuth();
    if (!authResult.success) {
      return authResult.error;
    }

    const userId = authResult.auth.userId;

    // Step 2: Rate limiting (5 requests per minute)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const limitKey = `match:find:${userId}:${ip}`;
    const rateLimit = await checkRateLimit(limitKey, {
      maxRequests: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfter ? Math.ceil(rateLimit.retryAfter / 1000) : 60;
      return NextResponse.json(
        {
          error: "发起匹配请求过于频繁，请稍后再试。",
          retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }

    // Step 3: Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "请求体格式无效" },
        { status: 400 }
      );
    }

    const validation = findMatchRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });
      return NextResponse.json(
        { error: "数据验证失败", details: errors },
        { status: 400 }
      );
    }

    const { activityType } = validation.data;

    // Step 4: Call matching service
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

    // Step 5: Log audit event (if admin)
    if (authResult.auth.role === "ADMIN") {
      await logAuditEvent(userId, "FIND_MATCH", "Match", result.matchId, {
        activityType,
      });
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
