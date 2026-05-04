import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // Get all conversations (both sent and received)
    const conversations = await db.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation partner and get latest message
    const conversationMap = new Map<
      string,
      {
        partnerId: string;
        partnerName: string;
        partnerAvatar: string | null;
        lastMessage: string;
        lastMessageTime: Date;
        unreadCount: number;
      }
    >();

    for (const msg of conversations) {
      const partnerId =
        msg.senderId === session.user.id ? msg.receiverId : msg.senderId;
      const partner =
        msg.senderId === session.user.id ? msg.receiver : msg.sender;

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          partnerName: partner.name,
          partnerAvatar: partner.avatarUrl,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
        });
      }

      // Count unread messages from this partner
      if (msg.receiverId === session.user.id && !msg.isRead) {
        const conv = conversationMap.get(partnerId)!;
        conv.unreadCount += 1;
      }
    }

    const result = Array.from(conversationMap.values()).sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json(
      { error: "获取对话列表失败", details: String(error) },
      { status: 500 }
    );
  }
}
