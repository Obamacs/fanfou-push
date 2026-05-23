import { NextRequest, NextResponse } from "next/server";
import { findMatch } from "@/lib/match-actions";

export async function POST(req: NextRequest) {
  try {
    const { activityType } = await req.json();
    const result = await findMatch(activityType);
    if (result.error) {
      const status =
        result.error === "未授权" ? 401
        : result.error === "用户不存在" ? 404
        : result.error.includes("已有一个活跃") ? 400
        : result.error.includes("入职") ? 400
        : result.error.includes("附近暂时没有") ? 400
        : 500;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ matchId: result.matchId });
  } catch (error) {
    console.error("Match find error:", error);
    return NextResponse.json(
      { error: "匹配失败，请重试" },
      { status: 500 }
    );
  }
}
