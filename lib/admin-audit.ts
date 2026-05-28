import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type AdminAuditInput = {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  payload?: Prisma.InputJsonValue;
};

export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId = null,
  payload,
}: AdminAuditInput) {
  try {
    await db.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        payload: payload ?? undefined,
      },
    });
  } catch (error) {
    console.error("Admin audit log write failed:", error);
  }
}
