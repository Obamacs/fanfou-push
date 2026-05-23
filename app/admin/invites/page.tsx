import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InviteManager } from "@/components/admin/InviteManager";

export default async function AdminInvitesPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }
  return <InviteManager />;
}
