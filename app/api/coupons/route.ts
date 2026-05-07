import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const now = new Date();

    const coupons = await db.freeCoupon.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const validCoupons = coupons.filter(
      (c) => !c.isUsed && c.expiresAt > now
    );

    const formattedCoupons = coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      welcomeText: coupon.welcomeText,
      isUsed: coupon.isUsed,
      expiresAt: coupon.expiresAt,
      isExpired: coupon.expiresAt < now,
      reason: coupon.reason,
      createdAt: coupon.createdAt,
    }));

    return NextResponse.json({
      coupons: formattedCoupons,
      validCount: validCoupons.length,
    });
  } catch (error) {
    console.error("Coupons error:", error);
    return NextResponse.json(
      { error: "获取优惠券失败" },
      { status: 500 }
    );
  }
}
