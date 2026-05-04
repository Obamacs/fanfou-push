import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const eventId = session.metadata?.eventId;
      const userId = session.metadata?.userId;

      if (!eventId || !userId) {
        console.error("Missing eventId or userId in metadata");
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
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
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: String(error) },
      { status: 500 }
    );
  }
}
