import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Verify Admin permission
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const refundStatus = searchParams.get("refundStatus") || undefined;
    const query = searchParams.get("q") || "";

    const orders = await db.reservationOrder.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(refundStatus ? { refundStatus } : {}),
        OR: [
          { orderCode: { contains: query, mode: "insensitive" } },
          { user: { name: { contains: query, mode: "insensitive" } } },
          { user: { email: { contains: query, mode: "insensitive" } } },
          { event: { title: { contains: query, mode: "insensitive" } } },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            refundMethod: true,
            refundAccount: true,
            refundRealName: true,
          },
        },
        event: {
          select: {
            title: true,
            priceAmount: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error);
    return NextResponse.json(
      { error: "获取订单列表失败" },
      { status: 500 }
    );
  }
}
