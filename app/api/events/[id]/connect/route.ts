import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const { targetUserId, action } = await req.json();

    if (!targetUserId || !["YES", "NO"].includes(action)) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }

    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: "不能对自己进行操作" }, { status: 400 });
    }

    const score = action === "YES" ? 1 : 0;

    // 1. Upsert the rating
    await db.rating.upsert({
      where: {
        eventId_raterId_ratedUserId: {
          eventId,
          raterId: session.user.id,
          ratedUserId: targetUserId,
        },
      },
      update: {
        score,
      },
      create: {
        eventId,
        raterId: session.user.id,
        ratedUserId: targetUserId,
        score,
      },
    });

    // 2. If 'YES', check for mutual match
    let matched = false;
    if (score === 1) {
      const mutualRating = await db.rating.findFirst({
        where: {
          raterId: targetUserId,
          ratedUserId: session.user.id,
          score: 1, // They also rated YES
          // We can optionally scope it to the same eventId, but allowing cross-event mutual matches is also fun
        },
      });

      if (mutualRating) {
        matched = true;

        // 3. Insert Icebreaker Direct Message if not already existing recently
        // To avoid spamming if they click back and forth, check if a message exists
        const existingMsg = await db.directMessage.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: targetUserId },
              { senderId: targetUserId, receiverId: session.user.id },
            ],
            content: { contains: "互相心动" }
          }
        });

        if (!existingMsg) {
          await db.directMessage.create({
            data: {
              senderId: session.user.id,
              receiverId: targetUserId,
              content: "✨ 恭喜！我们在刚才的活动中互相心动了，来打个招呼吧！",
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, matched });
  } catch (error) {
    console.error("Mutual connect error:", error);
    return NextResponse.json({ error: "系统错误，请重试" }, { status: 500 });
  }
}
