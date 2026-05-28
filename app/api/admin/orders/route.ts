import { requireAdmin } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, RefundStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.error;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status = (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus))
      ? (statusParam as OrderStatus)
      : undefined;

    const refundStatusParam = searchParams.get("refundStatus");
    const refundStatus = (refundStatusParam && Object.values(RefundStatus).includes(refundStatusParam as RefundStatus))
      ? (refundStatusParam as RefundStatus)
      : undefined;

    const query = searchParams.get("q") || "";
    
    // Pagination parameters with fallback defaults
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 100);
    const skip = (page - 1) * limit;

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
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
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
