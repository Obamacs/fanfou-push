"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateActivityScore, selectBalancedGroup } from "@/lib/matching";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { activityType } = await req.json();

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        interests: {
          include: { interest: true },
        },
        answers: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (!user.isOnboarded) {
      return NextResponse.json(
        { error: "请先完成入职流程" },
        { status: 400 }
      );
    }

    // Check if user already has an active match
    const existingMatch = await db.matchMember.findFirst({
      where: {
        userId: session.user.id,
        match: {
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      },
    });

    if (existingMatch) {
      return NextResponse.json(
        { error: "你已有一个活跃的匹配，请先完成或取消它" },
        { status: 400 }
      );
    }

    // 第一步：在同城同年龄段搜索
    let candidates = await db.user.findMany({
      where: {
        id: { not: session.user.id },
        city: user.city,
        ageGroup: user.ageGroup,
        isOnboarded: true,
        isActive: true,
        isBanned: false,
        matchMemberships: {
          none: {
            match: {
              status: { in: ["PENDING", "CONFIRMED"] },
            },
          },
        },
      },
      include: {
        interests: {
          include: { interest: true },
        },
        answers: true,
      },
    });

    // 第二步：如果候选人不足，扩大搜索范围（忽略年龄限制）
    if (candidates.length < 6) {
      candidates = await db.user.findMany({
        where: {
          id: { not: session.user.id },
          city: user.city,
          isOnboarded: true,
          isActive: true,
          isBanned: false,
          matchMemberships: {
            none: {
              match: {
                status: { in: ["PENDING", "CONFIRMED"] },
              },
            },
          },
        },
        include: {
          interests: {
            include: { interest: true },
          },
          answers: true,
        },
      });
    }

    if (candidates.length < 3) {
      return NextResponse.json(
        { error: "附近暂时没有合适的匹配，请稍后重试" },
        { status: 400 }
      );
    }

    // 根据活动类型计算匹配分数
    const scoredCandidates = candidates.map((candidate) => ({
      ...candidate,
      score: calculateActivityScore(user, candidate, activityType || ""),
    }));

    // 选择平衡的小组（4-6人，包括当前用户）
    const selectedCandidates = selectBalancedGroup(user, scoredCandidates, 6, 3);

    // 创建匹配，包括所有成员（包括当前用户）
    const match = await db.match.create({
      data: {
        status: "PENDING",
        city: user.city!,
        ageGroup: user.ageGroup!,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        members: {
          create: [
            { userId: session.user.id, confirmed: false },
            ...selectedCandidates.map((candidate) => ({
              userId: candidate.id,
              confirmed: false,
            })),
          ],
        },
      },
    });

    return NextResponse.json({ matchId: match.id });
  } catch (error) {
    console.error("Match find error:", error);
    return NextResponse.json(
      { error: "匹配失败，请重试" },
      { status: 500 }
    );
  }
}
