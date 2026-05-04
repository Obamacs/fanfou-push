import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { ageGroup, gender, relationshipGoal, smokingHabit, drinkingHabit, wantsChildren, avatar, city, interestIds, answers } = await req.json();

    // 验证必填字段
    if (!ageGroup || !gender || !relationshipGoal || !city || !interestIds || interestIds.length === 0) {
      return NextResponse.json(
        { error: "请填写所有必填项" },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // 更新用户基本信息
    await db.user.update({
      where: { id: userId },
      data: {
        ageGroup,
        gender,
        relationshipGoal,
        smokingHabit,
        drinkingHabit,
        wantsChildren,
        avatarUrl: avatar,
        city,
        isOnboarded: true,
      },
    });

    // 批量创建用户兴趣
    await db.userInterest.createMany({
      data: interestIds.map((interestId: string) => ({
        userId,
        interestId,
      })),
      skipDuplicates: true,
    });

    // 批量创建问卷答案
    if (answers && answers.length > 0) {
      await db.questionnaireAnswer.createMany({
        data: answers.map(
          (item: { questionId: string; answer: string }) => ({
            userId,
            questionId: item.questionId,
            answer: item.answer,
          })
        ),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(
      { message: "引导完成，欢迎加入饭否！" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "引导保存失败，请重试" },
      { status: 500 }
    );
  }
}
