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
      { error: "获取消息失败", details: String(error) },
      { status: 500 }
    );
  }
}
