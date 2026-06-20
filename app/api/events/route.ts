import { db } from "@/lib/db";
import { EVENT_TYPES } from "@/lib/constants";
import { createEventSchema, formatValidationErrors } from "@/lib/validation";
import { requirePermission, logAuditEvent } from "@/lib/permissions";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const city = searchParams.get("city");
    const type = searchParams.get("type");

    const where: Prisma.EventWhereInput = {
      status: { not: "CANCELLED" },
    };

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (type && (EVENT_TYPES as readonly string[]).includes(type)) {
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
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "查询活动失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Check authentication and permission
    const authResult = await requirePermission("CREATE_EVENT");
    if (!authResult.success) {
      return authResult.error;
    }

    const userId = authResult.auth.userId;

    // Step 2: Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "请求体格式无效" },
        { status: 400 }
      );
    }

    // Step 3: Validate input using Zod schema
    const validation = createEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "数据验证失败",
          details: formatValidationErrors(validation.error),
        },
        { status: 400 }
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
      estimatedSpend,
      estimatedSpicy,
      estimatedCuisine,
      alcoholPolicy,
    } = validation.data;

    // Convert date string to Date object
    const eventDate = new Date(date);
    const max = Math.max(2, Math.min(200, maxAttendees || 6));
    const price = Math.max(0, Math.min(10000, priceAmount || 0));

    // Step 4: Create event and attendances in atomic transaction
    const event = await db.$transaction(async (tx) => {
      // 4.1: Create the event
      const newEvent = await tx.event.create({
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
          estimatedSpend: estimatedSpend || null,
          estimatedSpicy: estimatedSpicy || null,
          estimatedCuisine: estimatedCuisine || null,
          alcoholPolicy: alcoholPolicy || null,
        },
        include: {
          creator: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      // 4.2: Get creator's role
      const creatorUser = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      const isAdmin = creatorUser?.role === "ADMIN";

      // 4.3: Auto-add creator as confirmed attendee (skip for admins)
      if (!isAdmin) {
        await tx.eventAttendance.create({
          data: {
            eventId: newEvent.id,
            userId,
            status: "CONFIRMED",
          },
        });
      }

      // 4.4: Auto-invite match members if provided
      if (matchId && autoInviteMembers && Array.isArray(autoInviteMembers)) {
        const matchMembers = await tx.matchMember.findMany({
          where: {
            matchId,
            userId: { in: autoInviteMembers },
          },
          select: { userId: true },
        });

        const validMemberIds = matchMembers
          .map((m) => m.userId)
          .filter((id) => id !== userId);

        if (validMemberIds.length > 0) {
          await tx.eventAttendance.createMany({
            data: validMemberIds.map((memberId: string) => ({
              eventId: newEvent.id,
              userId: memberId,
              status: "CONFIRMED",
            })),
            skipDuplicates: true,
          });
        }
      }

      return newEvent;
    });

    // Step 5: Log audit event
    if (authResult.auth.role === "ADMIN") {
      await logAuditEvent(userId, "CREATE_EVENT", "Event", event.id, {
        title: event.title,
        type: event.type,
        city: event.city,
      });
    }

    revalidatePath("/events");

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: "创建活动失败" },
      { status: 500 }
    );
  }
}
