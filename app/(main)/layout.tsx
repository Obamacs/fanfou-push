import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { Home, Heart, Calendar, MessageCircle, User } from "lucide-react";

async function Navbar() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      {/* Desktop navbar — Apple-style translucent */}
      <nav className="hidden md:block bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#1d1d1f] tracking-tight">饭否</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-8">
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
                className="text-[13px] text-[#86868b] hover:text-[#1d1d1f] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User area */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#0071e3]/10 flex items-center justify-center text-xs font-semibold text-[#0071e3]">
              {session.user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-[13px] text-[#86868b] hover:text-[#1d1d1f] rounded-full">
                退出
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile bottom TabBar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/60 z-40 safe-area-bottom">
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
              className="flex-1 flex flex-col items-center justify-center py-2.5 text-[#86868b] hover:text-[#0071e3] transition-colors"
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
    <div className="min-h-screen bg-[#f5f5f7] pb-20 md:pb-0">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
