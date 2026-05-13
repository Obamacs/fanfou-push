import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "未授权" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "未授权" }, { status: 401 }) };
  }
  // Re-verify role from database to prevent stale JWT role claims
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "未授权" }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

export function handleError(error: unknown, message: string = "操作失败") {
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}
