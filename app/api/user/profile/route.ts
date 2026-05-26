import { db } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { requireAuth, handleError } from "@/lib/api-helpers";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        isOnboarded: true,
        role: true,
        avatarUrl: true,
        bio: true,
        age: true,
        gender: true,
        city: true,
        refundMethod: true,
        refundAccount: true,
        refundRealName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "获取用户信息失败");
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { name, bio, age, gender, city, avatarUrl, refundMethod, refundAccount, refundRealName } = body;

    if (name !== undefined && (typeof name !== "string" || name.length > 50)) {
      return NextResponse.json({ error: "名字过长" }, { status: 400 });
    }
    if (bio !== undefined && typeof bio === "string" && bio.length > 500) {
      return NextResponse.json({ error: "个人简介过长" }, { status: 400 });
    }

    // 强规则安全过滤与输入验证：退款字段
    if (refundMethod !== undefined && refundMethod !== null) {
      if (refundMethod !== "WECHAT" && refundMethod !== "ALIPAY") {
        return NextResponse.json({ error: "退款方式无效（仅支持 WECHAT 或 ALIPAY）" }, { status: 400 });
      }
    }
    if (refundAccount !== undefined && refundAccount !== null) {
      if (typeof refundAccount !== "string" || refundAccount.trim().length === 0 || refundAccount.length > 100) {
        return NextResponse.json({ error: "退款账号格式不合法" }, { status: 400 });
      }
    }
    if (refundRealName !== undefined && refundRealName !== null) {
      if (typeof refundRealName !== "string" || refundRealName.trim().length === 0 || refundRealName.length > 50) {
        return NextResponse.json({ error: "退款实名格式不合法" }, { status: 400 });
      }
    }

    const user = await db.user.update({
      where: { id: auth.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(age !== undefined && { age: age ? parseInt(age, 10) : null }),
        ...(gender !== undefined && { gender }),
        ...(city !== undefined && { city }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(refundMethod !== undefined && { refundMethod }),
        ...(refundAccount !== undefined && { refundAccount: refundAccount ? refundAccount.trim() : null }),
        ...(refundRealName !== undefined && { refundRealName: refundRealName ? refundRealName.trim() : null }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isOnboarded: true,
        role: true,
        avatarUrl: true,
        bio: true,
        age: true,
        gender: true,
        city: true,
        refundMethod: true,
        refundAccount: true,
        refundRealName: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error, "更新用户信息失败");
  }
}
