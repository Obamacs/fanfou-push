import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const auth = await requireAdmin();
    if (auth.error) return auth.error;
    const adminUserId = auth.userId;

    const { action } = await req.json();

    if (!action || !["refund", "forfeit"].includes(action)) {
      return NextResponse.json({ error: "无效的操作类型" }, { status: 400 });
    }

    // Find the order
    const order = await db.reservationOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "该订单尚未确认支付，无法处理保证金退还" },
        { status: 400 }
      );
    }

    if (order.refundStatus === "REFUNDED" || order.refundStatus === "FORFEITED") {
      return NextResponse.json(
        { error: `保证金已处理完毕，当前状态为 ${order.refundStatus}` },
        { status: 400 }
      );
    }

    const adminUser = await db.user.findUnique({
      where: { id: adminUserId },
      select: { email: true, name: true }
    });
    const operator = adminUser?.email || adminUser?.name || "ADMIN";

    if (action === "refund") {
      await db.reservationOrder.update({
        where: { id: orderId },
        data: {
          refundStatus: "REFUNDED",
          refundedAt: new Date(),
          refundOperator: operator,
        },
      });

      revalidatePath(`/events/${order.eventId}`);
      await logAdminAction({
        adminId: adminUserId,
        action: "ORDER_DEPOSIT_REFUND",
        targetType: "ReservationOrder",
        targetId: orderId,
        payload: {
          eventId: order.eventId,
          userId: order.userId,
          depositFee: order.depositFee,
          operator,
        },
      });
      return NextResponse.json({
        message: "保证金退还记录已登记成功！",
        refundStatus: "REFUNDED",
      });
    } else {
      await db.reservationOrder.update({
        where: { id: orderId },
        data: {
          refundStatus: "FORFEITED",
          refundOperator: operator,
        },
      });

      revalidatePath(`/events/${order.eventId}`);
      await logAdminAction({
        adminId: adminUserId,
        action: "ORDER_DEPOSIT_FORFEIT",
        targetType: "ReservationOrder",
        targetId: orderId,
        payload: {
          eventId: order.eventId,
          userId: order.userId,
          depositFee: order.depositFee,
          operator,
        },
      });
      return NextResponse.json({
        message: "保证金没收成功，已扣减该放鸽子用户的保证金！",
        refundStatus: "FORFEITED",
      });
    }
  } catch (error) {
    console.error("Refund/Forfeit order error:", error);
    return NextResponse.json(
      { error: "处理保证金对账失败" },
      { status: 500 }
    );
  }
}
