"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateScore, selectBalancedGroup } from "@/lib/matching";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        interests: true,
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

    // Query candidates: same city + same age group + onboarded + active + not banned + no active match
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
        interests: true,
        answers: true,
      },
    });

    // 如果候选人不足，扩大搜索范围（忽略年龄限制）
    let relaxedMode = false;
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
          interests: true,
          answers: true,
        },
      });
      relaxedMode = true;
    }

    if (candidates.length < 3) {
      return NextResponse.json(
        { error: "附近暂时没有合适的匹配，请稍后重试" },
        { status: 400 }
      );
    }

    // Get all questions with weights
    const questions = await db.questionnaireQuestion.findMany({
      select: { id: true, weight: true },
    });

    // Calculate scores for each candidate
    const scoredCandidates = candidates.map((candidate) => ({
      ...candidate,
      score: calculateScore(user, candidate, questions, relaxedMode),
    }));

    // Select balanced group (4-6 people including current user)
    const selectedCandidates = selectBalancedGroup(user, scoredCandidates, 6, 3);

    // Create match with all members (including current user)
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
