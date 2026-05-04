import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    if (!match) {
      return NextResponse.json({ error: "匹配不存在" }, { status: 404 });
    }

    // Check if current user is a member of this match
    const isMember = match.members.some((m) => m.userId === session.user?.id);
    if (!isMember) {
      return NextResponse.json({ error: "无权访问此匹配" }, { status: 403 });
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("Match get error:", error);
    return NextResponse.json(
      { error: "获取匹配失败" },
      { status: 500 }
    );
  }
}
