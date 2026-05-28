import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureInviteCode } from "@/lib/coupon";
import { requireAdmin } from "@/lib/api-helpers";
import { logAdminAction } from "@/lib/admin-audit";

// GET: list all invite codes with usage stats
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { owner: { name: { contains: search } } },
        { owner: { email: { contains: search } } },
      ];
    }

    const [codes, total] = await Promise.all([
      db.inviteCode.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          usages: {
            include: {
              newUser: { select: { id: true, name: true, email: true, createdAt: true } },
            },
            orderBy: { usedAt: "desc" },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.inviteCode.count({ where }),
    ]);

    const formatted = codes.map((c) => ({
      id: c.id,
      code: c.code,
      ownerId: c.ownerId,
      ownerName: c.owner.name,
      ownerEmail: c.owner.email,
      usageCount: c.usageCount,
      isActive: c.isActive,
      createdAt: c.createdAt,
      usages: c.usages.map((u) => ({
        id: u.id,
        newUserName: u.newUser.name,
        newUserEmail: u.newUser.email,
        usedAt: u.usedAt,
        firstEventAt: u.invitedUserFirstEventAt,
        rewardClaimedAt: u.inviterRewardClaimedAt,
      })),
    }));

    return NextResponse.json({ codes: formatted, total, page, limit });
  } catch (error) {
    console.error("Admin invites error:", error);
    return NextResponse.json({ error: "获取邀请码列表失败" }, { status: 500 });
  }
}

// POST: generate invite code for a user (or toggle status)
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if (authResult.error) return authResult.error;
  const adminId = authResult.userId;

  try {
    const body = await req.json();
    const { action, userId, codeId, isActive } = body;

    switch (action) {
      case "generate": {
        if (!userId) {
          return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
        }
        // Check user exists
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) {
          return NextResponse.json({ error: "用户不存在" }, { status: 404 });
        }
        const code = await ensureInviteCode(userId);
        await logAdminAction({
          adminId,
          action: "INVITE_GENERATE",
          targetType: "User",
          targetId: userId,
          payload: { code },
        });
        return NextResponse.json({ code });
      }

      case "toggle": {
        if (!codeId || isActive === undefined) {
          return NextResponse.json({ error: "缺少参数" }, { status: 400 });
        }
        await db.inviteCode.update({
          where: { id: codeId },
          data: { isActive },
        });
        await logAdminAction({
          adminId,
          action: "INVITE_TOGGLE",
          targetType: "InviteCode",
          targetId: codeId,
          payload: { isActive },
        });
        return NextResponse.json({ success: true });
      }

      case "generateAll": {
        // Generate codes for all users who don't have one
        const usersWithoutCode = await db.user.findMany({
          where: {
            isActive: true,
            isBanned: false,
            inviteCodesOwned: { none: { isActive: true } },
          },
          select: { id: true },
        });

        if (usersWithoutCode.length === 0) {
          return NextResponse.json({ generated: 0, total: 0 });
        }

        const { customAlphabet } = await import("nanoid");
        const generateInviteCodeStr = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

        // Fetch existing codes from DB to prevent collisions in this run
        const existingCodes = new Set(
          (await db.inviteCode.findMany({ select: { code: true } })).map((c) => c.code)
        );

        const inviteCodesToCreate: Array<{ code: string; ownerId: string }> = [];
        const uniqueBatchCodes = new Set<string>();

        for (const user of usersWithoutCode) {
          let code = generateInviteCodeStr();
          let retries = 0;
          while ((existingCodes.has(code) || uniqueBatchCodes.has(code)) && retries < 10) {
            code = generateInviteCodeStr();
            retries++;
          }
          if (retries < 10) {
            uniqueBatchCodes.add(code);
            inviteCodesToCreate.push({
              code,
              ownerId: user.id,
            });
          }
        }

        const result = await db.inviteCode.createMany({
          data: inviteCodesToCreate,
          skipDuplicates: true,
        });

        await logAdminAction({
          adminId,
          action: "INVITE_GENERATE_ALL",
          targetType: "InviteCode",
          payload: {
            generated: result.count,
            total: usersWithoutCode.length,
          },
        });

        return NextResponse.json({ generated: result.count, total: usersWithoutCode.length });
      }

      default:
        return NextResponse.json({ error: "未知操作" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin invites action error:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
