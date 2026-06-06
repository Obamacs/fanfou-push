import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sendAlert } from "@/lib/alert";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const body = Buffer.from(await req.arrayBuffer());

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err);
      await sendAlert("Stripe 支付回调签名验证失败", err.message || "Unknown Error");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const eventId = session.metadata?.eventId;
      const userId = session.metadata?.userId;

      if (!eventId || !userId) {
        console.error("Missing eventId or userId in metadata");
        await sendAlert("Stripe 支付回调元数据丢失", `无法关联订单 (Session ID: ${session.id})`);
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Check if already processed (Idempotency protection)
      const existingAttendance = await db.eventAttendance.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
      });

      if (existingAttendance && existingAttendance.status === "CONFIRMED" && existingAttendance.paymentId === (session.payment_intent as string)) {
        console.log(`Webhook already processed for event ${eventId}, user ${userId}`);
        return NextResponse.json({ received: true });
      }

      // Update attendance to CONFIRMED
      await db.eventAttendance.update({
        where: {
          eventId_userId: {
            eventId,
            userId,
          },
        },
        data: {
          status: "CONFIRMED",
          paidAt: new Date(session.created * 1000),
          paymentId: session.payment_intent as string,
        },
      });

      // Revalidate the event page
      revalidatePath(`/events/${eventId}`);

      console.log(`Payment confirmed for event ${eventId}, user ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    await sendAlert("Stripe Webhook 处理崩溃", error.message || "Unknown Error");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
