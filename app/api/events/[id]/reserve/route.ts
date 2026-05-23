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

    let couponCode: string | null = null;
    try {
      const body = await req.json();
      if (body?.couponCode) {
        couponCode = (body.couponCode as string).trim().toUpperCase();
      }
    } catch {
      // Body might be empty, ignore
    }

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

    // Check if user is Pro subscriber
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isPro: true, subscriptionStatus: true },
    });
    const isPro = user?.isPro || user?.subscriptionStatus === "ACTIVE";

    let platformFee = 29; // 默认活动组织服务费：29元

    if (isPro) {
      platformFee = 0; // 月度订阅（99元/月）用户免收活动组织费
    } else if (couponCode) {
      // 验证免费券
      const coupon = await db.freeCoupon.findUnique({
        where: { code: couponCode },
      });

      if (!coupon) {
        return NextResponse.json({ error: "优惠券码不存在" }, { status: 400 });
      }
      if (coupon.userId !== userId) {
        return NextResponse.json({ error: "此优惠券不属于您" }, { status: 400 });
      }
      if (coupon.isUsed) {
        return NextResponse.json({ error: "此优惠券已被使用" }, { status: 400 });
      }
      if (coupon.expiresAt < now) {
        return NextResponse.json({ error: "此优惠券已过期" }, { status: 400 });
      }

      platformFee = 0; // 优惠券免收活动组织费
    }

    const depositFee = event.priceAmount; // 第二笔费用：出席押金/预付餐费
    const totalAmount = platformFee + depositFee;

    // Find if there is an existing pending order, if so, delete it so we can issue a fresh one
    const existingOrder = await db.reservationOrder.findFirst({
      where: {
        userId,
        eventId,
        status: "PENDING",
      },
    });

    if (existingOrder) {
      await db.reservationOrder.delete({
        where: { id: existingOrder.id },
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
          amount: totalAmount,
          platformFee,
          depositFee,
          couponCode: platformFee === 0 && couponCode ? couponCode : null,
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
