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
      {/* 桌面导航栏 */}
      <nav className="hidden md:block bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex flex-col">
              <span className="gradient-text text-2xl font-bold">饭否</span>
              <span className="text-xs text-gray-500">遇见有趣的灵魂</span>
            </div>
          </Link>

          {/* 导航链接 */}
          <div className="flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-[#FF2D55] font-medium transition-colors relative group"
            >
              首页
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF2D55] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/match"
              className="text-gray-700 hover:text-[#FF2D55] font-medium transition-colors relative group"
            >
              匹配
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF2D55] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/messages"
              className="text-gray-700 hover:text-[#FF2D55] font-medium transition-colors relative group"
            >
              消息
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF2D55] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/events"
              className="text-gray-700 hover:text-[#FF2D55] font-medium transition-colors relative group"
            >
              活动
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF2D55] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/gallery"
              className="text-gray-700 hover:text-[#FF2D55] font-medium transition-colors relative group"
            >
              图库
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF2D55] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-[#FF2D55] font-medium transition-colors relative group"
            >
              关于
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF2D55] group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/profile"
              className="text-gray-700 hover:text-[#FF2D55] font-medium transition-colors relative group"
            >
              我的
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#FF2D55] group-hover:w-full transition-all duration-300"></span>
            </Link>
          </div>

          {/* 用户区域 */}
          <div className="flex items-center space-x-4 border-l border-gray-200 pl-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#FF6B35] flex items-center justify-center text-white font-semibold text-sm">
              {session.user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-gray-700 hover:text-[#FF2D55]">
                退出
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* 移动端底部 TabBar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40">
        <div className="flex justify-around items-center">
          <Link
            href="/dashboard"
            className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-[#FF2D55] transition-colors"
          >
            <Home size={24} />
            <span className="text-xs mt-1">首页</span>
          </Link>
          <Link
            href="/match"
            className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-[#FF2D55] transition-colors"
          >
            <Heart size={24} />
            <span className="text-xs mt-1">匹配</span>
          </Link>
          <Link
            href="/events"
            className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-[#FF2D55] transition-colors"
          >
            <Calendar size={24} />
            <span className="text-xs mt-1">活动</span>
          </Link>
          <Link
            href="/messages"
            className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-[#FF2D55] transition-colors"
          >
            <MessageCircle size={24} />
            <span className="text-xs mt-1">消息</span>
          </Link>
          <Link
            href="/profile"
            className="flex-1 flex flex-col items-center justify-center py-3 text-gray-600 hover:text-[#FF2D55] transition-colors"
          >
            <User size={24} />
            <span className="text-xs mt-1">我的</span>
          </Link>
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
    <div className="min-h-screen bg-white md:bg-gradient-to-br md:from-[#FFF8F6] md:to-white pb-20 md:pb-0">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
