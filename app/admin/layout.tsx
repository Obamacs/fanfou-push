import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function AdminNavbar() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-white">饭否 Admin</div>
        </Link>

        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="text-gray-300 hover:text-white font-medium"
          >
            仪表板
          </Link>
          <Link
            href="/admin/users"
            className="text-gray-300 hover:text-white font-medium"
          >
            用户
          </Link>
          <Link
            href="/admin/events"
            className="text-gray-300 hover:text-white font-medium"
          >
            活动
          </Link>
          <Link
            href="/admin/reports"
            className="text-gray-300 hover:text-white font-medium"
          >
            举报
          </Link>
          <Link
            href="/admin/statistics"
            className="text-gray-300 hover:text-white font-medium"
          >
            统计
          </Link>
          <Link
            href="/admin/settings"
            className="text-gray-300 hover:text-white font-medium"
          >
            设置
          </Link>
          <div className="flex items-center space-x-3 border-l border-gray-700 pl-4">
            <span className="text-sm text-gray-300">{session.user?.email}</span>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm" className="text-gray-300">
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
    <div className="min-h-screen bg-gray-950">
      <AdminNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
