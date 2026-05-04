import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import OnboardingWizard from "./OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // 检查用户是否已完成onboarding
  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
  });

  if (user?.isOnboarded) {
    redirect("/dashboard");
  }

  // 加载兴趣列表
  const interests = await db.interest.findMany({
    orderBy: { name: "asc" },
  });

  // 加载问卷问题
  const questions = await db.questionnaireQuestion.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <OnboardingWizard
        interests={interests}
        questions={questions}
        userName={user?.name || ""}
      />
    </div>
  );
}
