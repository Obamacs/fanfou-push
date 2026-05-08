import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { timingSafeEqual } from "crypto";

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  // 允许两种认证方式：管理员会话 或 SEED_TOKEN header（用于 CI/首次部署引导）
  const session = await auth();
  const isAdminSession =
    session?.user?.id && (session.user as { role?: string }).role === "ADMIN";

  const seedToken = process.env.SEED_TOKEN;
  const providedToken = req.headers.get("x-seed-token") || "";
  const tokenValid = !!seedToken && tokenMatches(providedToken, seedToken);

  if (!isAdminSession && !tokenValid) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    console.log("开始初始化种子数据...");

    // 创建20个兴趣
    const interests = [
      { name: "美食", icon: "🍽️" },
      { name: "旅行", icon: "✈️" },
      { name: "音乐", icon: "🎵" },
      { name: "电影", icon: "🎬" },
      { name: "读书", icon: "📚" },
      { name: "运动", icon: "🏃" },
      { name: "户外", icon: "🏕️" },
      { name: "游戏", icon: "🎮" },
      { name: "艺术", icon: "🎨" },
      { name: "摄影", icon: "📷" },
      { name: "烹饪", icon: "👨‍🍳" },
      { name: "舞蹈", icon: "💃" },
      { name: "健身", icon: "💪" },
      { name: "茶艺", icon: "🍵" },
      { name: "棋牌", icon: "♟️" },
      { name: "宠物", icon: "🐶" },
      { name: "手工", icon: "🧵" },
      { name: "科技", icon: "💻" },
      { name: "语言", icon: "🌐" },
      { name: "冥想", icon: "🧘" },
    ];

    let createdInterests = 0;
    for (const interest of interests) {
      await db.interest.upsert({
        where: { name: interest.name },
        update: {},
        create: interest,
      });
      createdInterests++;
    }

    console.log(`✓ 创建了 ${createdInterests} 个兴趣`);

    // 创建5个问卷问题
    const questions = [
      {
        text: "你理想的周末是？",
        type: "single",
        options: JSON.stringify([
          "宅在家里放松",
          "和朋友聚餐聊天",
          "户外运动冒险",
          "参加文化活动",
        ]),
        weight: 1.0,
        order: 1,
      },
      {
        text: "你在朋友圈中的角色是？",
        type: "single",
        options: JSON.stringify([
          "聚会组织者",
          "话题引导者",
          "倾听者和陪伴者",
          "观察者和记录者",
        ]),
        weight: 1.0,
        order: 2,
      },
      {
        text: "你更喜欢哪种聚会方式？",
        type: "single",
        options: JSON.stringify([
          "小范围深度交流",
          "大人数热闹聚会",
          "一对一深度对话",
          "混合型即兴聚会",
        ]),
        weight: 1.0,
        order: 3,
      },
      {
        text: "你对新事物的态度是？",
        type: "single",
        options: JSON.stringify([
          "积极拥抱变化",
          "谨慎尝试新事物",
          "需要时间适应",
          "保持传统做法",
        ]),
        weight: 1.0,
        order: 4,
      },
      {
        text: "你最重视友谊中的哪些品质？",
        type: "single",
        options: JSON.stringify([
          "真诚和信任",
          "共同兴趣爱好",
          "相互支持帮助",
          "有趣和幽默感",
        ]),
        weight: 1.0,
        order: 5,
      },
    ];

    let createdQuestions = 0;
    for (const question of questions) {
      try {
        await db.questionnaireQuestion.create({
          data: question,
        });
        createdQuestions++;
      } catch {
        // Question already exists, skip
      }
    }

    console.log(`✓ 创建了 ${createdQuestions} 个问卷问题`);

    return NextResponse.json(
      {
        message: "✅ 种子数据初始化完成！",
        interests: createdInterests,
        questions: createdQuestions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("种子数据初始化失败:", error);
    return NextResponse.json(
      { error: "初始化失败，请重试" },
      { status: 500 }
    );
  }
}
