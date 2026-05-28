import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Get unique partners using two lightweight DB groupBy operations
    const [sentGroups, receivedGroups] = await Promise.all([
      db.directMessage.groupBy({
        by: ["receiverId"],
        where: { senderId: userId },
      }),
      db.directMessage.groupBy({
        by: ["senderId"],
        where: { receiverId: userId },
      }),
    ]);

    const partnerIds = Array.from(
      new Set([
        ...sentGroups.map((p) => p.receiverId),
        ...receivedGroups.map((p) => p.senderId),
      ])
    );

    // 2. Query details for each partner concurrently with O(1) specific queries
    const result = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const [partner, lastMsg, unreadCount] = await Promise.all([
          db.user.findUnique({
            where: { id: partnerId },
            select: { id: true, name: true, avatarUrl: true },
          }),
          db.directMessage.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: partnerId },
                { senderId: partnerId, receiverId: userId },
              ],
            },
            orderBy: { createdAt: "desc" },
          }),
          db.directMessage.count({
            where: {
              senderId: partnerId,
              receiverId: userId,
              isRead: false,
            },
          }),
        ]);

        return {
          partnerId,
          partnerName: partner?.name || "未知用户",
          partnerAvatar: partner?.avatarUrl || null,
          lastMessage: lastMsg?.content || "",
          lastMessageTime: lastMsg?.createdAt || new Date(),
          unreadCount,
        };
      })
    );

    // 3. Sort by latest message time
    result.sort(
      (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
    );

    return NextResponse.json({ conversations: result });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json(
      { error: "获取对话列表失败" },
      { status: 500 }
    );
  }
}
