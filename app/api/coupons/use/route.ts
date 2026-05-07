import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { useCouponForEvent } from "@/lib/coupon";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { couponCode, eventId } = await req.json();

    if (!couponCode || !eventId) {
      return NextResponse.json(
        { error: "缺少券码或活动ID" },
        { status: 400 }
      );
    }

    const { coupon, attendance } = await useCouponForEvent(
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
    const message = error instanceof Error ? error.message : "使用券失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
