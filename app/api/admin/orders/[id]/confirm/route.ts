import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const session = await auth();

    // Verify Admin permission
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权，仅限管理员访问" }, { status: 401 });
    }

    const { action } = await req.json();

    if (!action || !["confirm", "cancel"].includes(action)) {
      return NextResponse.json({ error: "无效的操作" }, { status: 400 });
    }

    // Find the order
    const order = await db.reservationOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: `订单当前状态为 ${order.status}，无法重复处理` },
        { status: 400 }
      );
    }

    if (action === "confirm") {
      // Confirm reservation order and update corresponding EventAttendance in a transaction
      await db.$transaction([
        db.reservationOrder.update({
          where: { id: orderId },
          data: { status: "CONFIRMED" },
        }),
        db.eventAttendance.update({
          where: {
            eventId_userId: {
              eventId: order.eventId,
              userId: order.userId,
            },
          },
          data: {
            status: "CONFIRMED",
            paidAt: new Date(),
            paymentId: order.orderCode,
          },
        }),
      ]);

      revalidatePath(`/events/${order.eventId}`);
      revalidatePath("/events");

      return NextResponse.json({
        message: "订单确认成功，用户名额已激活",
        status: "CONFIRMED",
      });
    } else {
      // Cancel reservation order and event attendance in a transaction
      await db.$transaction([
        db.reservationOrder.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        }),
        db.eventAttendance.update({
          where: {
            eventId_userId: {
              eventId: order.eventId,
              userId: order.userId,
            },
          },
          data: {
            status: "CANCELLED",
          },
        }),
      ]);

      revalidatePath(`/events/${order.eventId}`);
      revalidatePath("/events");

      return NextResponse.json({
        message: "订单取消成功，用户预订名额已释放",
        status: "CANCELLED",
      });
    }
  } catch (error) {
    console.error("Confirm order error:", error);
    return NextResponse.json(
      { error: "对账操作失败" },
      { status: 500 }
    );
  }
}
