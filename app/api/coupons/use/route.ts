import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { redeemCouponForEvent } from "@/lib/coupon";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // Rate Limiting (Max 5 coupon uses per minute)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const limitKey = `coupons:use:${session.user.id}:${ip}`;
    const rateLimit = await checkRateLimit(limitKey, {
      maxRequests: 5,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "兑换优惠券请求过于频繁，请稍后再试。" },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
      );
    }

    const { couponCode, eventId } = await req.json();

    if (!couponCode || !eventId) {
      return NextResponse.json(
        { error: "缺少券码或活动ID" },
        { status: 400 }
      );
    }

    const { coupon, attendance } = await redeemCouponForEvent(
      session.user.id,
      couponCode.toUpperCase(),
      eventId
    );

    return NextResponse.json({
      success: true,
      message: "已成功使用券报名活动",
      coupon,
      attendance,
    });
  } catch (error) {
    console.error("Use coupon error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "使用券失败" }, { status: 400 });
  }
}
