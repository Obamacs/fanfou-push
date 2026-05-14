import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const questions = await db.questionnaireQuestion.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { answers: true } } },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json({ error: "获取问题失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { text, type, options, weight, order } = await req.json();

    if (!text || !type) {
      return NextResponse.json({ error: "问题文本和类型为必填项" }, { status: 400 });
    }

    const question = await db.questionnaireQuestion.create({
      data: {
        text,
        type: type || "single",
        options: options ? JSON.stringify(options) : null,
        weight: weight ?? 1.0,
        order: order ?? 0,
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json({ error: "创建问题失败" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id, text, type, options, weight, order } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "问题ID为必填项" }, { status: 400 });
    }

    const question = await db.questionnaireQuestion.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(type !== undefined && { type }),
        ...(options !== undefined && { options: JSON.stringify(options) }),
        ...(weight !== undefined && { weight }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Update question error:", error);
    return NextResponse.json({ error: "更新问题失败" }, { status: 500 });
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
      return NextResponse.json({ error: "问题ID为必填项" }, { status: 400 });
    }

    await db.questionnaireQuestion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete question error:", error);
    return NextResponse.json({ error: "删除问题失败" }, { status: 500 });
  }
}
