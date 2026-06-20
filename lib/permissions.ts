import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export type Permission =
  | "CREATE_EVENT"
  | "EDIT_EVENT"
  | "DELETE_EVENT"
  | "VIEW_ADMIN_PANEL"
  | "MANAGE_USERS"
  | "MANAGE_REPORTS"
  | "MANAGE_COUPONS"
  | "VIEW_ANALYTICS";

export interface AuthContext {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
}

/**
 * Validate user authentication and return auth context
 * @returns Auth context or error response
 */
export async function validateAuth(): Promise<
  { success: true; auth: AuthContext } | { success: false; error: NextResponse }
> {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    return {
      success: false,
      error: NextResponse.json({ error: "未授权" }, { status: 401 }),
    };
  }

  // Get user role from database for strict validation
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return {
      success: false,
      error: NextResponse.json({ error: "用户不存在" }, { status: 401 }),
    };
  }

  return {
    success: true,
    auth: {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Require admin permission
 * @returns Auth context if authorized, or error response
 */
export async function requireAdmin(): Promise<
  { success: true; auth: AuthContext } | { success: false; error: NextResponse }
> {
  const authResult = await validateAuth();

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.auth.role !== "ADMIN") {
    return {
      success: false,
      error: NextResponse.json(
        { error: "您没有权限访问此资源" },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Require specific permission
 * @param permission Permission to check
 * @returns Auth context if authorized, or error response
 */
export async function requirePermission(
  permission: Permission
): Promise<
  { success: true; auth: AuthContext } | { success: false; error: NextResponse }
> {
  const authResult = await validateAuth();

  if (!authResult.success) {
    return authResult;
  }

  // Admin users have all permissions
  if (authResult.auth.role === "ADMIN") {
    return authResult;
  }

  // Check specific permissions for regular users
  const hasPermission = await checkUserPermission(
    authResult.auth.userId,
    permission
  );

  if (!hasPermission) {
    return {
      success: false,
      error: NextResponse.json(
        { error: `您没有权限执行此操作: ${permission}` },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

/**
 * Check if user has specific permission
 */
async function checkUserPermission(
  userId: string,
  permission: Permission
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      canCreateEvents: true,
    },
  });

  if (!user) return false;

  // Admin has all permissions
  if (user.role === "ADMIN") return true;

  // Check specific permissions
  switch (permission) {
    case "CREATE_EVENT":
      return user.canCreateEvents || false;
    case "EDIT_EVENT":
      return user.canCreateEvents || false;
    case "DELETE_EVENT":
      return user.canCreateEvents || false;
    case "VIEW_ADMIN_PANEL":
    case "MANAGE_USERS":
    case "MANAGE_REPORTS":
    case "MANAGE_COUPONS":
    case "VIEW_ANALYTICS":
      return false; // Regular users can't do these
    default:
      return false;
  }
}

/**
 * Verify user owns the resource (for edit/delete operations)
 */
export async function verifyOwnership(
  userId: string,
  resourceType: "event",
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case "event": {
      const event = await db.event.findUnique({
        where: { id: resourceId },
        select: { creatorId: true },
      });
      return event?.creatorId === userId;
    }
    default:
      return false;
  }
}

/**
 * Log audit event for admin actions
 */
export async function logAuditEvent(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: targetId || null,
        payload: payload as any || null,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
