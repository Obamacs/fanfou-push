import { db } from "@/lib/db";
import { generateCouponWelcomeText } from "@/lib/claude";
import { customAlphabet } from "nanoid";

// 生成唯一券码：COUP-XXXX-XXXX 格式
function generateCouponCode(): string {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);
  const part1 = nanoid(4);
  const part2 = nanoid(4);
  return `COUP-${part1}-${part2}`;
}

// 生成邀请码：6位大写字母数字
function generateInviteCodeStr(): string {
  const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
  return nanoid();
}

// 为用户发放一张免费券
export async function issueCoupon(
  userId: string,
  userName: string,
  reason: "REGISTER" | "INVITED_SOMEONE"
) {
  const welcomeText = await generateCouponWelcomeText(userName);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  let code = generateCouponCode();
  let retries = 0;
  while (retries < 5) {
    const exists = await db.freeCoupon.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCouponCode();
    retries++;
  }

  return db.freeCoupon.create({
    data: {
      code,
      userId,
      welcomeText,
      expiresAt,
      reason,
    },
  });
}

// 确保用户有邀请码，没有则创建
export async function ensureInviteCode(userId: string): Promise<string> {
  const existing = await db.inviteCode.findFirst({
    where: { ownerId: userId, isActive: true },
  });
  if (existing) return existing.code;

  let code = generateInviteCodeStr();
  let retries = 0;
  while (retries < 5) {
    const exists = await db.inviteCode.findUnique({ where: { code } });
    if (!exists) break;
    code = generateInviteCodeStr();
    retries++;
  }

  const inviteCode = await db.inviteCode.create({
    data: { code, ownerId: userId },
  });
  return inviteCode.code;
}

// 获取用户的有效券（未使用、未过期）
export async function getValidCoupons(userId: string) {
  const now = new Date();
  return db.freeCoupon.findMany({
    where: {
      userId,
      isUsed: false,
      expiresAt: { gt: now },
    },
    orderBy: { expiresAt: "asc" },
  });
}

// 使用券报名活动
export async function redeemCouponForEvent(
  userId: string,
  couponCode: string,
  eventId: string
) {
  const now = new Date();

  // 事务性安全更新与串行校验：使用券 + 确认报名
  return db.$transaction(async (tx) => {
    // 1. 验证券（在事务内重新查询以防止竞态条件并发防刷）
    const coupon = await tx.freeCoupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon) {
      throw new Error("券码不存在");
    }

    if (coupon.userId !== userId) {
      throw new Error("该券不属于你");
    }

    if (coupon.isUsed) {
      throw new Error("该券已被使用");
    }

    if (coupon.expiresAt < now) {
      throw new Error("该券已过期");
    }

    // 2. 验证活动（在事务内校验）
    const event = await tx.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("活动不存在");
    }

    if (event.status !== "UPCOMING") {
      throw new Error("该活动已无法报名");
    }

    if (event.date <= now) {
      throw new Error("该活动已开始或已结束");
    }

    if (event.priceAmount <= 0) {
      throw new Error("免费活动无需使用预约金代付券");
    }

    // 3. 检查是否已报名
    const existing = await tx.eventAttendance.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existing && (existing.status === "CONFIRMED" || existing.status === "PENDING")) {
      throw new Error("你已报名此活动");
    }

    // 4. 执行状态更新
    const updatedCoupon = await tx.freeCoupon.update({
      where: { id: coupon.id },
      data: {
        isUsed: true,
        usedAt: now,
        usedForEventId: eventId,
      },
    });

    // 5. 执行报名
    const attendance = await tx.eventAttendance.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      create: {
        eventId,
        userId,
        status: "CONFIRMED",
        paidAt: now,
        paymentId: `COUPON:${coupon.id}`,
      },
      update: {
        status: "CONFIRMED",
        paidAt: now,
        paymentId: `COUPON:${coupon.id}`,
      },
    });

    return { coupon: updatedCoupon, attendance };
  });
}

// 为用户特赠一张餐券（管理员手动发放）
export async function issueAdminCoupon(
  userId: string,
  welcomeText: string,
  daysValid: number = 90
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysValid);

  let code = generateCouponCode();
  let retries = 0;
  while (retries < 5) {
    const exists = await db.freeCoupon.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCouponCode();
    retries++;
  }

  // 确保欢迎词带有 [专属赠券] 前缀，便于前端渲染出奢华紫色的特定标识
  const cleanWelcomeText = welcomeText.trim().startsWith("[专属赠券]")
    ? welcomeText.trim()
    : `[专属赠券] ${welcomeText.trim()}`;

  return db.freeCoupon.create({
    data: {
      code,
      userId,
      welcomeText: cleanWelcomeText,
      expiresAt,
      reason: "REGISTER", // 使用已有的 REGISTER 枚举，确保不需要数据库迁移，百分之百兼容安全
    },
  });
}

// 校验邀请码规则 (共享业务逻辑)
export async function validateInviteCode(code: string, newUserId?: string) {
  const trimmedCode = code.trim().toUpperCase();
  const invite = await db.inviteCode.findUnique({
    where: { code: trimmedCode },
  });

  if (!invite) {
    return { valid: false, error: "优惠券码或邀请码不存在，请检查后重试" };
  }
  if (!invite.isActive) {
    return { valid: false, error: "该邀请码已失效" };
  }
  if (newUserId && invite.ownerId === newUserId) {
    return { valid: false, error: "不能使用自己的邀请码" };
  }

  // 验证用户是否已使用过邀请码（每个用户只能被邀请一次）
  if (newUserId) {
    const existingUsage = await db.inviteCodeUsage.findUnique({
      where: { newUserId },
    });
    if (existingUsage) {
      return { valid: false, error: "您已使用过邀请码，无法重复使用邀请码" };
    }
  }

  return { valid: true, invite };
}

