import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { useCouponForEvent } from "@/lib/coupon";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { eventId, couponCode } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "缺少活动ID" },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // Try to use coupon first if provided
    if (couponCode) {
      try {
        await useCouponForEvent(userId, couponCode.toUpperCase(), eventId);
        return NextResponse.json({
          usedCoupon: true,
          redirectUrl: `/events/${eventId}?payment=success`,
        });
      } catch (err) {
        // Coupon usage failed, fall through to Stripe payment
        console.error("Coupon usage failed, falling back to Stripe:", err);
      }
    }

    // Fetch event
    const event = await db.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    // Check if event is joinable
    if (event.status !== "UPCOMING") {
      return NextResponse.json(
        { error: "该活动已无法报名" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (event.date <= now) {
      return NextResponse.json(
        { error: "该活动已开始或已结束" },
        { status: 400 }
      );
    }

    // Check if creator
    if (event.creatorId === userId) {
      return NextResponse.json(
        { error: "活动发起人无需报名" },
        { status: 400 }
      );
    }

    // Check if already attending (CONFIRMED or PENDING)
    const existing = await db.eventAttendance.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existing && (existing.status === "CONFIRMED" || existing.status === "PENDING")) {
      return NextResponse.json(
        { error: "你已报名此活动" },
        { status: 409 }
      );
    }

    // Create or update PENDING attendance
    await db.eventAttendance.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      create: {
        eventId,
        userId,
        status: "PENDING",
      },
      update: {
        status: "PENDING",
      },
    });

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "cny",
            unit_amount: event.priceAmount * 100, // Convert to cents
            product_data: {
              name: event.title,
              description: `${event.city} · ${new Intl.DateTimeFormat("zh-CN", {
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(event.date)}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.nextUrl.origin}/events/${eventId}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/events/${eventId}?payment=cancelled`,
      metadata: {
        eventId,
        userId,
      },
      client_reference_id: `${eventId}:${userId}`,
    });

    return NextResponse.json({
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "创建支付会话失败", details: String(error) },
      { status: 500 }
    );
  }
}
