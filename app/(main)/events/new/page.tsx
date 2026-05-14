import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EventForm } from "@/components/events/EventForm";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles } from "lucide-react";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ matchId?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id as string },
    select: { canCreateEvents: true, role: true },
  });

  if (!user?.canCreateEvents && user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#FFFAF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card className="border-0 shadow-sm rounded-3xl p-8 bg-white text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFFAF8] mb-5">
              <Shield className="w-7 h-7 text-[#B8A099]" />
            </div>
            <h1 className="text-[21px] font-bold text-[#2D2420] mb-2">
              需要活动创建权限
            </h1>
            <p className="text-[15px] text-[#B8A099] mb-6">
              目前仅授权用户可发起活动。如果你想成为组织者，请联系我们。
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/events">
                <Button className="rounded-full bg-[#FF2442] hover:bg-[#FF4D63] text-white font-medium">
                  浏览活动
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" className="rounded-full text-[#B8A099]">
                  联系管理员
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const { matchId } = await searchParams;
  let matchData = null;
  if (matchId) {
    matchData = await db.match.findUnique({
      where: { id: matchId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!matchData?.members.some((m) => m.userId === session.user?.id)) {
      redirect("/events");
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFAF8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[34px] font-bold text-[#2D2420] tracking-tight">
            发起活动
          </h1>
          <p className="mt-1 text-[17px] text-[#B8A099]">
            选择时间和地点，我们帮你找到合适的伙伴
          </p>
        </div>

        {matchData && (
          <div className="mb-6 p-4 bg-[#FF2442]/5 border border-[#FF2442]/10 rounded-2xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#FF2442] flex-shrink-0" />
            <p className="text-[15px] text-[#FF2442] font-medium">
              基于匹配创建 — 将自动邀请 {matchData.members.length} 位匹配成员
            </p>
          </div>
        )}

        <Card className="border-0 shadow-sm rounded-3xl p-6 sm:p-8 bg-white">
          <EventForm
            mode="create"
            matchId={matchId}
            matchMembers={matchData?.members.map((m) => m.userId) || []}
          />
        </Card>
      </div>
    </div>
  );
}
