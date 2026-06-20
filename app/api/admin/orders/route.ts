import { requireAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, RefundStatus } from "@prisma/client";
import { z } from "zod";

// Query validation schema
const orderQuerySchema = z.object({
  status: z.string().optional(),
  refundStatus: z.string().optional(),
  q: z.string().max(100, "搜索词不能超过100字").optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
});

export async function GET(req: NextRequest) {
  try {
    // Step 1: Validate admin permission
    const authResult = await requireAdmin();
    if (!authResult.success) {
      return authResult.error;
    }

    // Step 2: Validate and parse query parameters
    const { searchParams } = new URL(req.url);
    const queryData = Object.fromEntries(searchParams.entries());
    const validation = orderQuerySchema.safeParse(queryData);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });
      return NextResponse.json(
        { error: "查询参数无效", details: errors },
        { status: 400 }
      );
    }

    const { status: statusParam, refundStatus: refundStatusParam, q: searchQuery, page, limit } = validation.data;

    // Step 3: Validate status enums
    const orderStatus = (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus))
      ? (statusParam as OrderStatus)
      : undefined;

    const orderRefundStatus = (refundStatusParam && Object.values(RefundStatus).includes(refundStatusParam as RefundStatus))
      ? (refundStatusParam as RefundStatus)
      : undefined;

    const skip = (page - 1) * limit;

    // Step 4: Fetch orders
    const orders = await db.reservationOrder.findMany({
      where: {
        ...(orderStatus ? { status: orderStatus } : {}),
        ...(orderRefundStatus ? { refundStatus: orderRefundStatus } : {}),
        OR: [
          { orderCode: { contains: searchQuery || "", mode: "insensitive" } },
          { user: { name: { contains: searchQuery || "", mode: "insensitive" } } },
          { user: { email: { contains: searchQuery || "", mode: "insensitive" } } },
          { event: { title: { contains: searchQuery || "", mode: "insensitive" } } },
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
