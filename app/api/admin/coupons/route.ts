import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { issueAdminCoupon } from "@/lib/coupon";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const userId = searchParams.get("userId");
    const isUsed = searchParams.get("isUsed");

    const skip = (page - 1) * limit;

    const where: Prisma.FreeCouponWhereInput = {};
    if (userId) where.userId = userId;
    if (isUsed === "true") where.isUsed = true;
    if (isUsed === "false") where.isUsed = false;

    const [coupons, total] = await Promise.all([
      db.freeCoupon.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          usedForEvent: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.freeCoupon.count({ where }),
    ]);

    const formattedCoupons = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      userId: coupon.userId,
      userName: coupon.user.name,
      userEmail: coupon.user.email,
      isUsed: coupon.isUsed,
      reason: coupon.reason,
      expiresAt: coupon.expiresAt,
      usedForEventTitle: coupon.usedForEvent?.title || null,
      createdAt: coupon.createdAt,
    }));

    return NextResponse.json({
      coupons: formattedCoupons,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("Admin coupons error:", error);
    return NextResponse.json(
      { error: "获取优惠券列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

    const body = await req.json();
    const { userId, welcomeText, daysValid } = body;

    if (!userId || !welcomeText) {
      return NextResponse.json(
        { error: "缺少必要字段：userId 或 welcomeText" },
        { status: 400 }
      );
    }

    // 验证用户是否存在
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
    }

    const limitDays = daysValid ? parseInt(daysValid.toString()) : 90;
    if (isNaN(limitDays) || limitDays <= 0) {
      return NextResponse.json(
        { error: "有效天数必须为正整数" },
        { status: 400 }
      );
    }

    const coupon = await issueAdminCoupon(userId, welcomeText, limitDays);

    return NextResponse.json({
      success: true,
      message: "优惠券赠送成功",
      coupon: {
        id: coupon.id,
        code: coupon.code,
        welcomeText: coupon.welcomeText,
        expiresAt: coupon.expiresAt,
      },
    });
  } catch (error) {
    console.error("Admin coupons POST error:", error);
    return NextResponse.json(
      { error: "发放优惠券失败" },
      { status: 500 }
    );
  }
}
