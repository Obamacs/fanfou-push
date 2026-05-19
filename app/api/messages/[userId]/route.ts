import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { userId } = await params;

    // Check if the other user exists
    const otherUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!otherUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // Timeleft Chat Gatekeeping: Check if they share a started event
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
              some: { userId: userId, status: "CONFIRMED" }
            }
          }
        ]
      }
    });

    if (sharedEventsCount === 0) {
      return NextResponse.json(
        { error: "破冰从见面开始！聊天将在你们共同参加的聚餐开始后解锁。" },
        { status: 403 }
      );
    }

    // Get all messages between the two users
    const messages = await db.directMessage.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            receiverId: userId,
          },
          {
            senderId: userId,
            receiverId: session.user.id,
          },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark all received messages as read
    await db.directMessage.updateMany({
      where: {
        senderId: userId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      otherUser,
      messages,
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { error: "获取消息失败" },
      { status: 500 }
    );
  }
}
