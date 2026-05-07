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
export async function useCouponForEvent(
  userId: string,
  couponCode: string,
  eventId: string
) {
  const now = new Date();

  // 验证券
  const coupon = await db.freeCoupon.findUnique({
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

  // 验证活动
  const event = await db.event.findUnique({
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
    throw new Error("免费活动无需使用券");
  }

  // 检查是否已报名
  const existing = await db.eventAttendance.findUnique({
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

  // 事务性更新：使用券 + 确认报名
  return db.$transaction(async (tx) => {
    const updatedCoupon = await tx.freeCoupon.update({
      where: { id: coupon.id },
      data: {
        isUsed: true,
        usedAt: now,
        usedForEventId: eventId,
      },
    });

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
