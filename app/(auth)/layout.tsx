import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
