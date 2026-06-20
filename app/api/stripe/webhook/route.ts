import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sendAlert } from "@/lib/alert";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let webhookEventId: string | null = null;

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

    // Step 1: Check for duplicate webhook (idempotency)
    // Use a unique constraint on (provider, eventId) to prevent duplicates
    const existingWebhook = await db.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "stripe",
          eventId: event.id,
        },
      },
    });

    if (existingWebhook) {
      if (existingWebhook.status === "COMPLETED") {
        console.log(`Webhook ${event.id} already processed successfully`);
        return NextResponse.json({ received: true });
      }
      if (existingWebhook.status === "PROCESSING") {
        console.log(`Webhook ${event.id} is still processing, returning 202`);
        return NextResponse.json({ message: "Processing" }, { status: 202 });
      }
    }

    // Step 2: Create or update webhook event record with PROCESSING status
    const webhookRecord = await db.webhookEvent.upsert({
      where: {
        provider_eventId: {
          provider: "stripe",
          eventId: event.id,
        },
      },
      create: {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        status: "PROCESSING",
        payload: event.data as any,
      },
      update: {
        status: "PROCESSING",
        updatedAt: new Date(),
      },
    });

    webhookEventId = webhookRecord.id;

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const eventId = session.metadata?.eventId;
      const userId = session.metadata?.userId;

      if (!eventId || !userId) {
        console.error("Missing eventId or userId in metadata");
        await db.webhookEvent.update({
          where: { id: webhookEventId! },
          data: {
            status: "FAILED",
            error: "Missing eventId or userId in metadata",
          },
        });
        await sendAlert("Stripe 支付回调元数据丢失", `无法关联订单 (Session ID: ${session.id})`);
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Step 3: Use database transaction for atomic update
      // This ensures that either both attendance and webhook status are updated, or neither
      await db.$transaction(async (tx) => {
        // Update attendance to CONFIRMED
        await tx.eventAttendance.update({
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

        // Mark webhook as completed
        await tx.webhookEvent.update({
          where: { id: webhookEventId! },
          data: {
            status: "COMPLETED",
            processedAt: new Date(),
          },
        });
      });

      // Revalidate the event page
      revalidatePath(`/events/${eventId}`);

      console.log(`Payment confirmed for event ${eventId}, user ${userId}`);
    } else {
      // For unhandled event types, still mark as completed
      await db.webhookEvent.update({
        where: { id: webhookEventId! },
        data: {
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);

    // Mark webhook as failed
    if (webhookEventId) {
      await db.webhookEvent.update({
        where: { id: webhookEventId! },
        data: {
          status: "FAILED",
          error: error.message || "Unknown error",
        },
      }).catch((e) => console.error("Failed to update webhook status:", e));
    }

    await sendAlert("Stripe Webhook 处理崩溃", error.message || "Unknown Error");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
