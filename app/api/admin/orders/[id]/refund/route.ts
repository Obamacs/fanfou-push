import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, logAuditEvent } from "@/lib/permissions";
import { z } from "zod";

// Input validation schema
const refundRequestSchema = z.object({
  action: z.enum(["refund", "forfeit"]),
  reason: z.string().min(5, "原因至少5个字").max(500, "原因不能超过500字").optional(),
});

type RefundRequest = z.infer<typeof refundRequestSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Step 1: Validate admin permission
    const authResult = await requireAdmin();
    if (!authResult.success) {
      return authResult.error;
    }

    const adminUserId = authResult.auth.userId;
    const { id: orderId } = await params;

    // Step 2: Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "请求体格式无效" },
        { status: 400 }
      );
    }

    const validation = refundRequestSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });
      return NextResponse.json(
        {
          error: "数据验证失败",
          details: errors,
        },
        { status: 400 }
      );
    }

    const { action, reason } = validation.data;

    // Step 3: Verify order exists
    const order = await db.reservationOrder.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, name: true } },
        event: { select: { id: true, title: true } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "订单不存在" },
        { status: 404 }
      );
    }

    // Step 4: Validate order state
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

    // Step 5: Get admin name for audit
    const adminUser = await db.user.findUnique({
      where: { id: adminUserId },
      select: { email: true, name: true },
    });
    const operator = adminUser?.name || adminUser?.email || "ADMIN";

    // Step 6: Process refund/forfeit with transaction
    const result = await db.$transaction(async (tx) => {
      if (action === "refund") {
        return await tx.reservationOrder.update({
          where: { id: orderId },
          data: {
            refundStatus: "REFUNDED",
            refundedAt: new Date(),
            refundOperator: operator,
          },
        });
      } else {
        return await tx.reservationOrder.update({
          where: { id: orderId },
          data: {
            refundStatus: "FORFEITED",
            refundOperator: operator,
          },
        });
      }
    });

    // Step 7: Log audit event
    await logAuditEvent(
      adminUserId,
      action === "refund" ? "ORDER_DEPOSIT_REFUND" : "ORDER_DEPOSIT_FORFEIT",
      "ReservationOrder",
      orderId,
      {
        eventId: order.eventId,
        eventTitle: order.event.title,
        userId: order.userId,
        userName: order.user.name || order.user.email,
        depositFee: order.depositFee,
        action,
        reason: reason || "未提供",
        operator,
      }
    );

    // Step 8: Revalidate cache
    revalidatePath(`/events/${order.eventId}`);

    // Step 9: Return success response
    const message =
      action === "refund"
        ? "保证金退还记录已登记成功！"
        : "保证金没收成功，已扣减该放鸽子用户的保证金！";

    return NextResponse.json({
      success: true,
      message,
      refundStatus: result.refundStatus,
      data: {
        orderId: result.id,
        eventId: result.eventId,
        userId: result.userId,
        refundedAt: result.refundedAt,
        operator,
      },
    });
  } catch (error) {
    console.error("Refund/Forfeit order error:", error);
    return NextResponse.json(
      { error: "处理保证金对账失败" },
      { status: 500 }
    );
  }
}
