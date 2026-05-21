import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

async function generateUniqueOrderCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = `MM${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await db.reservationOrder.findUnique({
      where: { orderCode: code },
    });
    if (!existing) {
      return code;
    }
    attempts++;
  }
  return `MM${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Fetch event
    const event = await db.event.findUnique({
      where: { id: eventId },
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

    // Check if already attending (CONFIRMED or WAITLISTED)
    const existingAttendance = await db.eventAttendance.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingAttendance && existingAttendance.status === "CONFIRMED") {
      return NextResponse.json(
        { error: "你已报名且确认此活动" },
        { status: 409 }
      );
    }

    if (event._count.attendances >= event.maxAttendees) {
      return NextResponse.json(
        { error: "活动人数已满，无法申请付款通道" },
        { status: 400 }
      );
    }

    // Find if there is an existing pending order
    const existingOrder = await db.reservationOrder.findFirst({
      where: {
        userId,
        eventId,
        status: "PENDING",
      },
    });

    if (existingOrder) {
      return NextResponse.json({
        message: "订单已存在",
        order: existingOrder,
      });
    }

    // Generate unique order code
    const orderCode = await generateUniqueOrderCode();

    // Create reservation order and set event attendance to PENDING in a transaction
    const [order, attendance] = await db.$transaction([
      db.reservationOrder.create({
        data: {
          userId,
          eventId,
          orderCode,
          amount: event.priceAmount,
          status: "PENDING",
        },
      }),
      db.eventAttendance.upsert({
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
      }),
    ]);

    revalidatePath(`/events/${eventId}`);
    revalidatePath("/events");

    return NextResponse.json({
      message: "预订订单创建成功",
      order,
      attendance,
    });
  } catch (error) {
    console.error("Reserve error:", error);
    return NextResponse.json(
      { error: "创建预订失败" },
      { status: 500 }
    );
  }
}
