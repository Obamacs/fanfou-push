import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // Rate Limiting Protection (Max 60 requests per minute)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const limitKey = `messages:send:${session.user.id}:${ip}`;
    const rateLimit = await checkRateLimit(limitKey, {
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "发送消息过于频繁，请稍后再试。" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const { receiverId, content } = await req.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "接收者和消息内容不能为空" },
        { status: 400 }
      );
    }

    if (typeof content === "string" && content.length > 2000) {
      return NextResponse.json(
        { error: "消息内容过长" },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "不能给自己发送消息" },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "接收者不存在" },
        { status: 404 }
      );
    }

    // Check if sender is blocked by receiver
    const isBlocked = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: receiverId,
          blockedId: session.user.id,
        },
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "无法发送消息" },
        { status: 403 }
      );
    }

    // Timeleft Chat Gatekeeping: Only allow messaging if they share a started event
    const sharedEventsCount = await db.event.count({
      where: {
        date: { lte: new Date() }, // Event has started
        AND: [
          {
            attendances: {
              some: { userId: session.user.id, status: "CONFIRMED" }
            }
          },
          {
            attendances: {
              some: { userId: receiverId, status: "CONFIRMED" }
            }
          }
        ]
      }
    });

    if (sharedEventsCount === 0) {
      return NextResponse.json(
        { error: "破冰从见面开始！私聊将在你们共同参加的聚餐开始后解锁。" },
        { status: 403 }
      );
    }

    const message = await db.directMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { error: "发送消息失败" },
      { status: 500 }
    );
  }
}
