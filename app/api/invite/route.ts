import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureInviteCode } from "@/lib/coupon";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const code = await ensureInviteCode(session.user.id);

    const inviteCodeRecord = await db.inviteCode.findUnique({
      where: { code },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://meal-meet.com";
    const shareUrl = `${baseUrl}/register?invite=${code}`;

    return NextResponse.json({
      inviteCode: {
        code,
        usageCount: inviteCodeRecord?.usageCount || 0,
        createdAt: inviteCodeRecord?.createdAt,
        shareUrl,
      },
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "获取邀请码失败" },
      { status: 500 }
    );
  }
}
