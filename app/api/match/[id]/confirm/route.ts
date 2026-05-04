import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const match = await db.match.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!match) {
      return NextResponse.json({ error: "匹配不存在" }, { status: 404 });
    }

    // Check if user is a member
    const member = match.members.find((m) => m.userId === session.user?.id);
    if (!member) {
      return NextResponse.json({ error: "你不是此匹配的成员" }, { status: 403 });
    }

    // Check if match is still valid
    if (match.status === "EXPIRED" || match.status === "CANCELLED") {
      return NextResponse.json(
        { error: "此匹配已过期或已取消" },
        { status: 400 }
      );
    }

    // Update member confirmation
    await db.matchMember.update({
      where: {
        matchId_userId: {
          matchId: id,
          userId: session.user.id,
        },
      },
      data: { confirmed: true },
    });

    // Check if all members are confirmed
    const updatedMatch = await db.match.findUnique({
      where: { id },
      include: { members: true },
    });

    const allConfirmed = updatedMatch!.members.every((m) => m.confirmed);

    if (allConfirmed) {
      await db.match.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });
    }

    const finalMatch = await db.match.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                ageGroup: true,
                city: true,
                interests: {
                  include: {
                    interest: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(finalMatch);
  } catch (error) {
    console.error("Match confirm error:", error);
    return NextResponse.json(
      { error: "确认失败，请重试" },
      { status: 500 }
    );
  }
}
