import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EVENT_TYPES } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const city = searchParams.get("city");
    const type = searchParams.get("type");

    const where: any = {
      status: { not: "CANCELLED" },
    };

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (type && EVENT_TYPES.includes(type)) {
      where.type = type;
    }

    const events = await db.event.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
        _count: {
          select: {
            attendances: {
              where: { status: "CONFIRMED" },
            },
          },
        },
      },
      orderBy: { date: "asc" },
      take: 20,
    });

    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: "查询活动失败", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取用户信息，检查是否有权限创建活动
    const user = await db.user.findUnique({
      where: { id: session.user.id as string },
      select: { canCreateEvents: true, role: true },
    });

    // 只有管理员或授权用户才能创建活动
    if (!user?.canCreateEvents && user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "您没有权限创建活动。请联系管理员申请权限。" },
        { status: 403 }
      );
    }

    const {
      title,
      type,
      city,
      address,
      date,
      maxAttendees,
      priceAmount,
      description,
      imageUrl,
      matchId,
      autoInviteMembers,
    } = await req.json();

    // Validation
    if (!title || !type || !city || !date) {
      return NextResponse.json(
        { error: "请填写所有必填项" },
        { status: 400 }
      );
    }

    if (!EVENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "活动类型无效" },
        { status: 400 }
      );
    }

    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
      return NextResponse.json(
        { error: "活动时间必须是未来的时间" },
        { status: 400 }
      );
    }

    const max = Math.max(2, Math.min(20, maxAttendees || 6));
    const price = Math.max(0, priceAmount || 0);

    const userId = session.user.id as string;

    // Create event
    const event = await db.event.create({
      data: {
        title,
        type,
        city,
        address,
        date: eventDate,
        maxAttendees: max,
        priceAmount: price,
        description,
        imageUrl,
        creatorId: userId,
        status: "UPCOMING",
        matchId: matchId || null,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    // Auto-add creator as confirmed attendee
    await db.eventAttendance.create({
      data: {
        eventId: event.id,
        userId,
        status: "CONFIRMED",
      },
    });

    // Auto-invite match members if provided
    if (autoInviteMembers && Array.isArray(autoInviteMembers) && autoInviteMembers.length > 0) {
      const memberIds = autoInviteMembers.filter((id: string) => id !== userId);
      if (memberIds.length > 0) {
        await db.eventAttendance.createMany({
          data: memberIds.map((memberId: string) => ({
            eventId: event.id,
            userId: memberId,
            status: "CONFIRMED",
          })),
          skipDuplicates: true,
        });
      }
    }

    revalidatePath("/events");

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: "创建活动失败", details: String(error) },
      { status: 500 }
    );
  }
}
