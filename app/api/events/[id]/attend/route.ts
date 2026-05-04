import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { action } = await req.json();

    if (!action || !["join", "leave"].includes(action)) {
      return NextResponse.json({ error: "无效的操作" }, { status: 400 });
    }

    const userId = session.user.id as string;

    // Get event
    const event = await db.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendances: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    if (action === "join") {
      // Check if creator
      if (event.creatorId === userId) {
        return NextResponse.json(
          { error: "活动发起人无需报名" },
          { status: 400 }
        );
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

      // Check if already attending
      const existing = await db.eventAttendance.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId,
          },
        },
      });

      if (existing && existing.status !== "CANCELLED") {
        return NextResponse.json(
          { error: "你已报名此活动" },
          { status: 409 }
        );
      }

      // Determine status based on capacity and price
      let status: "CONFIRMED" | "PENDING" | "WAITLISTED" = "CONFIRMED";

      if (event.priceAmount > 0) {
        status = "PENDING"; // Need payment
      } else if (event._count.attendances >= event.maxAttendees) {
        status = "WAITLISTED"; // Waitlist if full
      }

      // Upsert attendance
      const attendance = await db.eventAttendance.upsert({
        where: {
          eventId_userId: {
            eventId: id,
            userId,
          },
        },
        create: {
          eventId: id,
          userId,
          status,
        },
        update: {
          status,
        },
      });

      revalidatePath(`/events/${id}`);
      revalidatePath("/events");

      return NextResponse.json({
        message: "报名成功",
        attendance,
      });
    } else {
      // Leave
      const attendance = await db.eventAttendance.findUnique({
        where: {
          eventId_userId: {
            eventId: id,
            userId,
          },
        },
      });

      if (!attendance) {
        return NextResponse.json({ error: "你未报名此活动" }, { status: 404 });
      }

      if (attendance.status === "CANCELLED") {
        return NextResponse.json({ error: "你已退出此活动" }, { status: 400 });
      }

      // Cannot leave if you are the creator
      if (event.creatorId === userId) {
        return NextResponse.json(
          { error: "活动发起人无法退出" },
          { status: 400 }
        );
      }

      // Update to cancelled
      await db.eventAttendance.update({
        where: {
          eventId_userId: {
            eventId: id,
            userId,
          },
        },
        data: { status: "CANCELLED" },
      });

      // If the departing person was CONFIRMED, promote first WAITLISTED
      if (attendance.status === "CONFIRMED") {
        const waitlisted = await db.eventAttendance.findFirst({
          where: {
            eventId: id,
            status: "WAITLISTED",
          },
          orderBy: { joinedAt: "asc" },
        });

        if (waitlisted) {
          await db.eventAttendance.update({
            where: {
              eventId_userId: {
                eventId: id,
                userId: waitlisted.userId,
              },
            },
            data: { status: "CONFIRMED" },
          });
        }
      }

      revalidatePath(`/events/${id}`);
      revalidatePath("/events");

      return NextResponse.json({
        message: "已退出活动",
      });
    }
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json(
      { error: "操作失败", details: String(error) },
      { status: 500 }
    );
  }
}
