import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { Home, Heart, Calendar, MessageCircle, User, LogOut } from "lucide-react";

async function Navbar() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.user?.id },
    select: { isOnboarded: true },
  });

  if (user && !user.isOnboarded) {
    redirect("/onboarding");
  }

  return (
    <>
      <nav className="sticky top-0 z-40 hidden border-b border-white/70 bg-white/75 shadow-[0_8px_30px_rgba(90,35,30,0.05)] backdrop-blur-xl md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#271f1d] text-sm font-semibold text-white">饭</span>
            <span className="text-xl font-semibold tracking-tight text-[#271f1d]">饭否</span>
          </Link>

          <div className="flex items-center rounded-full border border-[#f0dfda] bg-[#fff7f5]/80 p-1">
            {[
              { href: "/dashboard", label: "首页" },
              { href: "/events", label: "活动" },
              { href: "/match", label: "匹配" },
              { href: "/messages", label: "消息" },
              { href: "/profile", label: "我的" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#8f7772] transition-colors hover:bg-white hover:text-[#ff2442]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff2442]/10 text-xs font-semibold text-[#ff2442] ring-1 ring-[#ff2442]/10">
              {session.user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="rounded-full text-[13px] text-[#8f7772] hover:text-[#271f1d]">
                <LogOut className="mr-1.5 h-4 w-4" />
                退出
              </Button>
            </form>
          </div>
        </div>
      </nav>

      <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-white/70 bg-white/85 shadow-[0_-10px_30px_rgba(90,35,30,0.08)] backdrop-blur-xl md:hidden">
        <div className="flex justify-around items-center">
          {[
            { href: "/dashboard", icon: Home, label: "首页" },
            { href: "/events", icon: Calendar, label: "活动" },
            { href: "/match", icon: Heart, label: "匹配" },
            { href: "/messages", icon: MessageCircle, label: "消息" },
            { href: "/profile", icon: User, label: "我的" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 text-[#9d8580] hover:text-[#ff2442] transition-colors"
            >
              <Icon size={22} />
              <span className="text-[10px] mt-0.5">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-0">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
