import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// GET: 获取活动的全部评价
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reviews = await db.eventReview.findMany({
      where: { eventId: id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, gender: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 50 // Limit to latest 50 for performance
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json({ error: "获取评价失败" }, { status: 500 });
  }
}

// POST: 提交活动评价
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权，请先登录" }, { status: 401 });
    }
    const userId = session.user.id as string;

    // 1. 防爆破限流 (每分钟只能提交1次)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limitKey = `events:review:${userId}:${ip}`;
    const rateLimit = await checkRateLimit(limitKey, { maxRequests: 1, windowMs: 60 * 1000 });
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "操作过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const { score, comment } = await req.json();

    // 2. 数据校验：强类型拦截
    if (typeof score !== "number" || score < 1 || score > 5) {
      return NextResponse.json({ error: "评分必须在 1 到 5 星之间" }, { status: 400 });
    }

    // 字符截断防内存溢出（最大 300 字符）
    const sanitizedComment = comment ? String(comment).slice(0, 300).trim() : null;

    // 3. 强权校验：活动是否已结束？该用户是否真的参加了？
    const event = await db.event.findUnique({
      where: { id },
      select: { date: true, status: true }
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    // 活动只有过期才能评价
    if (event.date > new Date()) {
      return NextResponse.json({ error: "活动尚未结束，暂不能评价" }, { status: 400 });
    }

    // 查询参加状态
    const attendance = await db.eventAttendance.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
      select: { status: true }
    });

    if (!attendance || attendance.status !== "CONFIRMED") {
      return NextResponse.json({ error: "您未确认参加该活动，无法评价" }, { status: 403 });
    }

    // 4. 防重复评价
    const existingReview = await db.eventReview.findUnique({
      where: { eventId_userId: { eventId: id, userId } }
    });

    if (existingReview) {
      return NextResponse.json({ error: "您已经对该活动进行过评价了" }, { status: 409 });
    }

    // 5. 写入评价
    const review = await db.eventReview.create({
      data: {
        eventId: id,
        userId,
        score,
        comment: sanitizedComment
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, gender: true } }
      }
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "提交评价失败" }, { status: 500 });
  }
}
