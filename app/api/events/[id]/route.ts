import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await db.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
        attendances: {
          where: {
            status: { in: ["CONFIRMED", "PENDING", "WAITLISTED"] },
          },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
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

    return NextResponse.json({ event });
  } catch (error) {
    return NextResponse.json(
      { error: "查询活动失败", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const event = await db.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    if (event.creatorId !== (session.user.id as string)) {
      return NextResponse.json(
        { error: "只有活动发起人可以编辑" },
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
    } = await req.json();

    // Validate date if provided
    if (date) {
      const eventDate = new Date(date);
      if (isNaN(eventDate.getTime()) || eventDate <= new Date()) {
        return NextResponse.json(
          { error: "活动时间必须是未来的时间" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (date !== undefined) updateData.date = new Date(date);
    if (maxAttendees !== undefined)
      updateData.maxAttendees = Math.max(2, Math.min(20, maxAttendees));
    if (priceAmount !== undefined)
      updateData.priceAmount = Math.max(0, priceAmount);
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    const updated = await db.event.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    revalidatePath("/events");
    revalidatePath(`/events/${id}`);

    return NextResponse.json({ event: updated });
  } catch (error) {
    console.error("Event update error:", error);
    return NextResponse.json(
      { error: "编辑活动失败", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const event = await db.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    const isCreator = event.creatorId === (session.user.id as string);

    if (!isCreator) {
      return NextResponse.json(
        { error: "只有活动发起人可以删除" },
        { status: 403 }
      );
    }

    await db.event.delete({
      where: { id },
    });

    revalidatePath("/events");
    revalidatePath(`/events/${id}`);

    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error("Event delete error:", error);
    return NextResponse.json(
      { error: "删除活动失败", details: String(error) },
      { status: 500 }
    );
  }
}
