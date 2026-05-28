import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions/auth";
import { AdminNavLinks } from "./AdminNavLinks";

async function AdminNavbar() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/admin-login");
  }

  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/admin-login");
  }

  return (
    <nav className="bg-[#1A1311] border-b border-[#2D1E1A] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="text-2xl font-bold text-white">饭否 Admin</div>
        </Link>

        <div className="flex items-center space-x-4">
          <AdminNavLinks />
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
