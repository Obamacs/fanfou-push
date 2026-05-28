import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api-helpers";
import { issueCoupon } from "@/lib/coupon";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

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
      // Find the coupon first if applicable
      let couponToUse = null;
      let inviteToUse = null;
      if (order.couponCode) {
        couponToUse = await db.freeCoupon.findUnique({
          where: { code: order.couponCode },
        });
        if (!couponToUse) {
          // It could be an invite code!
          inviteToUse = await db.inviteCode.findUnique({
            where: { code: order.couponCode.toUpperCase() },
            include: { owner: true },
          });
        }
      }

      let shouldIssueReferralCoupon = false;

      // Confirm reservation order and update corresponding EventAttendance in a transaction
      await db.$transaction(async (tx) => {
        // 1. Confirm the order
        await tx.reservationOrder.update({
          where: { id: orderId },
          data: { status: "CONFIRMED" },
        });

        // 2. Confirm the attendance
        await tx.eventAttendance.update({
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
        });

        // 3. Mark the coupon as used (if one was applied)
        if (couponToUse) {
          await tx.freeCoupon.update({
            where: { id: couponToUse.id },
            data: {
              isUsed: true,
              usedAt: new Date(),
              usedForEventId: order.eventId,
            },
          });
        }

        // 4. If it was an invite code, create InviteCodeUsage
        if (inviteToUse) {
          const existingUsage = await tx.inviteCodeUsage.findUnique({
            where: { newUserId: order.userId },
          });
          if (!existingUsage) {
            await tx.inviteCodeUsage.create({
              data: {
                inviteCodeId: inviteToUse.id,
                newUserId: order.userId,
                invitedUserFirstEventAt: new Date(),
              },
            });

            await tx.inviteCode.update({
              where: { id: inviteToUse.id },
              data: { usageCount: { increment: 1 } },
            });

            shouldIssueReferralCoupon = true;
          }
        }
      });

      // 5. Issue referral coupon outside transaction to prevent holding locks during LLM/API call
      if (shouldIssueReferralCoupon && inviteToUse) {
        try {
          await issueCoupon(
            inviteToUse.ownerId,
            inviteToUse.owner.name,
            "INVITED_SOMEONE"
          );
        } catch (couponError) {
          console.error("Failed to issue referral coupon:", couponError);
        }
      }

      revalidatePath(`/events/${order.eventId}`);
      revalidatePath("/events");

      return NextResponse.json({
        message: "订单确认成功，用户名额已激活",
        status: "CONFIRMED",
      });
    } else {
      // Cancel reservation order and event attendance in a transaction
      await db.$transaction(async (tx) => {
        // 1. Cancel the order
        await tx.reservationOrder.update({
          where: { id: orderId },
          data: { status: "CANCELLED" },
        });

        // 2. Cancel the attendance
        await tx.eventAttendance.update({
          where: {
            eventId_userId: {
              eventId: order.eventId,
              userId: order.userId,
            },
          },
          data: {
            status: "CANCELLED",
          },
        });

        // 3. Release the coupon if one was used
        if (order.couponCode) {
          const existingCoupon = await tx.freeCoupon.findUnique({
            where: { code: order.couponCode },
          });
          if (existingCoupon) {
            await tx.freeCoupon.update({
              where: { id: existingCoupon.id },
              data: {
                isUsed: false,
                usedAt: null,
                usedForEventId: null,
              },
            });
          }
        }
      });

      revalidatePath(`/events/${order.eventId}`);
      revalidatePath("/events");

      return NextResponse.json({
        message: "订单取消成功，用户预订名额与优惠券已释放",
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
