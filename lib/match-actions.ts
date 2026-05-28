import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateActivityScore, selectBalancedGroup } from "@/lib/matching";

export async function findMatch(activityType?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "未授权" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      interests: { include: { interest: true } },
      answers: true,
    },
  });

  if (!user) return { error: "用户不存在" };
  if (!user.isOnboarded) return { error: "请先完成入职流程" };

  // Check if user already has an active match
  const existingMatch = await db.matchMember.findFirst({
    where: {
      userId: session.user.id,
      match: { status: { in: ["PENDING", "CONFIRMED"] } },
    },
  });
  if (existingMatch) return { error: "你已有一个活跃的匹配，请先完成或取消它" };

  // Step 1: same city + same age group
  let candidates = await db.user.findMany({
    where: {
      id: { not: session.user.id },
      city: user.city,
      ageGroup: user.ageGroup,
      isOnboarded: true,
      isActive: true,
      isBanned: false,
      matchMemberships: {
        none: { match: { status: { in: ["PENDING", "CONFIRMED"] } } },
      },
    },
    take: 200,
    include: {
      interests: { include: { interest: true } },
      answers: true,
    },
  });

  // Step 2: fallback — wider search (same city, any age)
  if (candidates.length < 6) {
    candidates = await db.user.findMany({
      where: {
        id: { not: session.user.id },
        city: user.city,
        isOnboarded: true,
        isActive: true,
        isBanned: false,
        matchMemberships: {
          none: { match: { status: { in: ["PENDING", "CONFIRMED"] } } },
        },
      },
      take: 200,
      include: {
        interests: { include: { interest: true } },
        answers: true,
      },
    });
  }

  if (candidates.length < 3) {
    return { error: "附近暂时没有合适的匹配，请稍后重试" };
  }

  const scoredCandidates = candidates.map((candidate) => ({
    ...candidate,
    score: calculateActivityScore(user, candidate, activityType || ""),
  }));

  const selectedCandidates = selectBalancedGroup(user, scoredCandidates, 6, 3);

  const match = await db.match.create({
    data: {
      status: "PENDING",
      city: user.city!,
      ageGroup: user.ageGroup!,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: session.user.id, confirmed: false },
          ...selectedCandidates.map((c) => ({
            userId: c.id,
            confirmed: false,
          })),
        ],
      },
    },
  });

  return { matchId: match.id };
}

export async function confirmMatch(matchId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "未授权" };
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { members: true },
  });

  if (!match) {
    return { error: "匹配不存在" };
  }

  const member = match.members.find((m) => m.userId === session.user?.id);
  if (!member) {
    return { error: "你不是此匹配的成员" };
  }

  if (match.status === "EXPIRED" || match.status === "CANCELLED") {
    return { error: "此匹配已过期或已取消" };
  }

  await db.$transaction(async (tx) => {
    await tx.matchMember.update({
      where: { matchId_userId: { matchId, userId: session.user!.id! } },
      data: { confirmed: true },
    });

    const [confirmedCount, totalCount] = await Promise.all([
      tx.matchMember.count({ where: { matchId, confirmed: true } }),
      tx.matchMember.count({ where: { matchId } }),
    ]);

    if (confirmedCount === totalCount && confirmedCount > 0) {
      await tx.match.update({
        where: { id: matchId },
        data: { status: "CONFIRMED" },
      });
    }
  });

  return { success: true };
}
