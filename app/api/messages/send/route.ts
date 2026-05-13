import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { receiverId, content } = await req.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: "接收者和消息内容不能为空" },
        { status: 400 }
      );
    }

    if (typeof content === "string" && content.length > 2000) {
      return NextResponse.json(
        { error: "消息内容过长" },
        { status: 400 }
      );
    }

    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "不能给自己发送消息" },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "接收者不存在" },
        { status: 404 }
      );
    }

    // Check if sender is blocked by receiver
    const isBlocked = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: receiverId,
          blockedId: session.user.id,
        },
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "无法发送消息" },
        { status: 403 }
      );
    }

    const message = await db.directMessage.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { error: "发送消息失败" },
      { status: 500 }
    );
  }
}
