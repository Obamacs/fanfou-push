import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "仅管理员可访问" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const userId = searchParams.get("userId");
    const isUsed = searchParams.get("isUsed");

    const skip = (page - 1) * limit;

    const where: any = {};
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
