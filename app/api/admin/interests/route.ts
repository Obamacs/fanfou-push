import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const interests = await db.interest.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { userInterests: true } } },
    });

    return NextResponse.json({ interests });
  } catch (error) {
    console.error("Get interests error:", error);
    return NextResponse.json({ error: "获取兴趣标签失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { name, icon } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "兴趣名称为必填项" }, { status: 400 });
    }

    const interest = await db.interest.create({
      data: { name: name.trim(), icon: icon || null },
    });

    return NextResponse.json({ interest }, { status: 201 });
  } catch (error) {
    console.error("Create interest error:", error);
    return NextResponse.json({ error: "创建兴趣标签失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id, name, icon } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "兴趣ID为必填项" }, { status: 400 });
    }

    const interest = await db.interest.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(icon !== undefined && { icon }),
      },
    });

    return NextResponse.json({ interest });
  } catch (error) {
    console.error("Update interest error:", error);
    return NextResponse.json({ error: "更新兴趣标签失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "兴趣ID为必填项" }, { status: 400 });
    }

    const inUse = await db.userInterest.count({ where: { interestId: id } });
    if (inUse > 0) {
      return NextResponse.json({ error: `该兴趣标签被 ${inUse} 个用户使用，无法删除` }, { status: 400 });
    }

    await db.interest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete interest error:", error);
    return NextResponse.json({ error: "删除兴趣标签失败" }, { status: 500 });
  }
}
