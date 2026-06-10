import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEventRevealEmail, sendEventReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Check authorization header
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const appUrl = process.env.NEXTAUTH_URL || "https://meal-meet.com";
    
    // 1. Process 24h Reveals
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const eventsToReveal = await db.event.findMany({
      where: {
        status: "UPCOMING",
        notified24h: false,
        date: {
          lte: in24Hours,
          gt: now, // still in the future
        },
      },
      include: {
        attendances: {
          where: { status: "CONFIRMED" },
          include: { user: true },
        },
      },
    });

    for (const event of eventsToReveal) {
      if (event.attendances.length > 0) {
        // Send emails
        await Promise.all(
          event.attendances.map((att) =>
            sendEventRevealEmail(
              att.user.email,
              att.user.name,
              event.title,
              event.address || event.city,
              `${appUrl}/events/${event.id}`
            )
          )
        );
      }

      // Mark as notified
      await db.event.update({
        where: { id: event.id },
        data: { notified24h: true },
      });
    }

    // 2. Process 3h Reminders
    const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const eventsToRemind = await db.event.findMany({
      where: {
        status: "UPCOMING",
        notified3h: false,
        date: {
          lte: in3Hours,
          gt: now, // still in the future
        },
      },
      include: {
        attendances: {
          where: { status: "CONFIRMED" },
          include: { user: true },
        },
      },
    });

    for (const event of eventsToRemind) {
      if (event.attendances.length > 0) {
        // Send emails
        await Promise.all(
          event.attendances.map((att) =>
            sendEventReminderEmail(
              att.user.email,
              att.user.name,
              event.title,
              `${appUrl}/events/${event.id}`
            )
          )
        );
      }

      // Mark as notified
      await db.event.update({
        where: { id: event.id },
        data: { notified3h: true },
      });
    }

    return NextResponse.json({
      success: true,
      revealedEvents: eventsToReveal.length,
      remindedEvents: eventsToRemind.length,
    });
  } catch (error) {
    console.error("Error in notify-events cron:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
