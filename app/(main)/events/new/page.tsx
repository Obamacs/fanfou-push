import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventForm } from "@/components/events/EventForm";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: { matchId?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // 获取用户信息，检查是否有权限创建活动
  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
    select: { canCreateEvents: true, role: true },
  });

  // 只有管理员或授权用户才能创建活动
  if (!user?.canCreateEvents && user?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="p-8 border-0 shadow-md bg-gradient-to-br from-orange-50 to-red-50">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              权限限制
            </h1>
            <p className="text-lg text-gray-700 mb-4">
              目前只有系统管理员授权的用户可以发起活动。
            </p>
            <p className="text-gray-600 mb-6">
              如果您想成为活动组织者，请联系我们的管理员。我们期待您的活动创意！
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/events">
                <Button className="btn-brand text-white">
                  浏览现有活动
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="outline">
                  联系管理员
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  let matchData = null;
  if (searchParams.matchId) {
    matchData = await db.match.findUnique({
      where: { id: searchParams.matchId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // 验证当前用户是匹配的成员
    if (!matchData?.members.some((m) => m.userId === session.user?.id)) {
      redirect("/events");
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">创建活动</h1>
      {matchData && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            ✨ 基于匹配创建 - 将邀请{matchData.members.length}位匹配成员自动加入
          </p>
        </div>
      )}
      <EventForm mode="create" matchId={searchParams.matchId} matchMembers={matchData?.members.map(m => m.userId) || []} />
    </div>
  );
}
