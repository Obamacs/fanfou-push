import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export default async function MatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const match = await db.match.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              ageGroup: true,
              city: true,
              interests: {
                include: {
                  interest: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!match) {
    notFound();
  }

  // Check if current user is a member
  const isMember = match.members.some((m) => m.userId === session.user?.id);
  if (!isMember) {
    redirect("/match");
  }

  const currentUserMember = match.members.find(
    (m) => m.userId === session.user?.id
  );
  const confirmedCount = match.members.filter((m) => m.confirmed).length;
  const totalMembers = match.members.length;

  const timeLeft = new Date(match.expiresAt).getTime() - Date.now();
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (match.status === "CONFIRMED") {
    return (
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/match" className="text-[#FF2442] hover:text-[#FF2442] mb-6 inline-block">
            ← 返回匹配
          </Link>

          <h1 className="text-3xl font-bold mb-6">匹配已确认！</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {match.members.map((member) => (
              <Card key={member.userId}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#FFF0F3] flex items-center justify-center text-2xl font-semibold text-[#FF2442] mb-3">
                      {member.user.name.charAt(0)}
                    </div>
                    <h3 className="font-semibold mb-1">{member.user.name}</h3>
                    <p className="text-sm text-[#B8A099] mb-3">
                      {member.user.ageGroup} · {member.user.city}
                    </p>
                    {member.user.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {member.user.interests.slice(0, 3).map((interest) => (
                          <Badge key={interest.interestId} variant="secondary">
                            {interest.interest.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Link href={`/events/new?matchId=${match.id}`}>
            <Button className="w-full" size="lg">
              基于此次匹配创建活动
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/match" className="text-[#FF2442] hover:text-[#FF2442] mb-6 inline-block">
          ← 返回匹配
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">你的匹配已就绪！</h1>
          <p className="text-[#B8A099]">
            {hoursLeft}小时 {minutesLeft}分钟后过期
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            {confirmedCount} / {totalMembers} 人已确认
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {match.members.map((member) => (
            <Card key={member.userId}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#FFF0F3] flex items-center justify-center text-2xl font-semibold text-[#FF2442] mb-3">
                    {member.user.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold mb-1">{member.user.name}</h3>
                  <p className="text-sm text-[#B8A099] mb-3">
                    {member.user.ageGroup} · {member.user.city}
                  </p>
                  {member.user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mb-3">
                      {member.user.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest.interestId} variant="secondary">
                          {interest.interest.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {member.confirmed && (
                    <Badge className="bg-green-100 text-green-700 border-0">
                      ✓ 已确认
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!currentUserMember?.confirmed && (
          <form
            action={async () => {
              "use server";
              const res = await fetch(
                `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/match/${match.id}/confirm`,
                {
                  method: "POST",
                }
              );

              if (res.ok) {
                redirect(`/match/${match.id}`);
              }
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              确认加入
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
