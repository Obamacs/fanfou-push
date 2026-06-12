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
    const { userId, action } = await req.json();

    if (!userId || !["ATTEND", "NO_SHOW"].includes(action)) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }

    // Check permissions (must be Admin or Event Creator)
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { creatorId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isCreator = event.creatorId === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: "没有权限" }, { status: 403 });
    }

    // Determine the target refund status based on the action
    const newRefundStatus = action === "ATTEND" ? "ELIGIBLE" : "FORFEITED";

    // Update the refund status on the confirmed reservation order
    const updateResult = await db.reservationOrder.updateMany({
      where: {
        eventId: eventId,
        userId: userId,
        status: "CONFIRMED",
        // Only allow updating if it hasn't been refunded yet
        refundStatus: {
          notIn: ["REFUNDED"],
        },
      },
      data: {
        refundStatus: newRefundStatus,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "未找到可更新的有效订单或已完成退款" }, { status: 400 });
    }

    return NextResponse.json({
      message: action === "ATTEND" ? "已确认用户出席，该押金已移入待退款池" : "已标记用户爽约，该押金已被没收",
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    return NextResponse.json({ error: "系统错误，请重试" }, { status: 500 });
  }
}
