import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";

async function AdminNavbar() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <nav className="bg-[#1A1311] border-b border-[#2D1E1A] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-white">饭否 Admin</div>
        </Link>

        <div className="flex items-center space-x-4">
          <Link href="/admin" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            仪表板
          </Link>
          <Link href="/admin/users" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            用户
          </Link>
          <Link href="/admin/events" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            活动
          </Link>
          <Link href="/admin/questionnaire" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            问卷管理
          </Link>
          <Link href="/admin/interests" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            兴趣管理
          </Link>
          <Link href="/admin/reports" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            举报
          </Link>
          <Link href="/admin/statistics" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            统计
          </Link>
          <Link href="/admin/settings" className="text-[#B8A099] hover:text-white transition-colors font-medium">
            设置
          </Link>
          <div className="flex items-center space-x-3 border-l border-[#2D1E1A] pl-4">
            <span className="text-sm text-[#B8A099]">{session.user?.email}</span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-[#B8A099] hover:text-white">
                退出
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0F0A09]">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
