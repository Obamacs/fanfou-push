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

export type ResourceType = "event" | "message" | "coupon" | "report" | "user";

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
 * Require specific permission with optional resource ownership verification
 * @param permission Permission to check
 * @param resourceType Type of resource to verify ownership (optional)
 * @param resourceId ID of the resource to verify (optional)
 * @returns Auth context if authorized, or error response
 *
 * CRITICAL FIX: This now properly validates resource ownership for EDIT_EVENT and DELETE_EVENT
 */
export async function requirePermission(
  permission: Permission,
  resourceType?: ResourceType,
  resourceId?: string
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

  // Check if user has the permission
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

  // CRITICAL FIX: For EDIT_EVENT and DELETE_EVENT, verify resource ownership
  if (
    (permission === "EDIT_EVENT" || permission === "DELETE_EVENT") &&
    resourceType &&
    resourceId
  ) {
    const ownsResource = await verifyOwnership(
      authResult.auth.userId,
      resourceType,
      resourceId
    );

    if (!ownsResource) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "您没有权限修改此资源" },
          { status: 403 }
        ),
      };
    }
  }

  return authResult;
}

/**
 * Check if user has specific base permission (without resource ownership)
 * Use requirePermission() for full permission check including ownership
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
      isBanned: true,
    },
  });

  if (!user) return false;

  // Banned users have no permissions
  if (user.isBanned) return false;

  // Admin has all permissions
  if (user.role === "ADMIN") return true;

  // Regular users: check specific permissions
  switch (permission) {
    case "CREATE_EVENT":
      return user.canCreateEvents === true;
    case "EDIT_EVENT":
      // CRITICAL FIX: Only check if user can create events
      // Resource ownership must be verified in requirePermission()
      return user.canCreateEvents === true;
    case "DELETE_EVENT":
      // CRITICAL FIX: Only check if user can create events
      // Resource ownership must be verified in requirePermission()
      return user.canCreateEvents === true;
    case "VIEW_ADMIN_PANEL":
    case "MANAGE_USERS":
    case "MANAGE_REPORTS":
    case "MANAGE_COUPONS":
    case "VIEW_ANALYTICS":
      // Regular users cannot access admin-only features
      return false;
    default:
      return false;
  }
}

/**
 * Verify user owns the resource (for edit/delete operations)
 * CRITICAL FIX: Now supports multiple resource types
 */
export async function verifyOwnership(
  userId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "event": {
        const event = await db.event.findUnique({
          where: { id: resourceId },
          select: { creatorId: true },
        });
        return event?.creatorId === userId;
      }

      case "message": {
        const message = await db.message.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        return message?.userId === userId;
      }

      case "coupon": {
        const coupon = await db.freeCoupon.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        return coupon?.userId === userId;
      }

      case "report": {
        // Only admins can modify reports, regular users cannot
        return false;
      }

      case "user": {
        // Users can only modify their own profile
        return resourceId === userId;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error(`[Permissions] Error verifying ${resourceType} ownership:`, error);
    return false;
  }
}

/**
 * Log audit event for admin or system actions
 * CRITICAL FIX: Now properly handles system audit logs
 */
export async function logAuditEvent(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    // Validate adminId
    if (!adminId || adminId.length === 0) {
      console.warn("[Permissions] Invalid adminId for audit log");
      return;
    }

    // For "system" actions, create a special system admin entry
    const actualAdminId = adminId === "system" ? "SYSTEM" : adminId;

    // Verify admin exists (if not system)
    if (actualAdminId !== "SYSTEM") {
      const admin = await db.user.findUnique({
        where: { id: actualAdminId },
        select: { id: true, role: true },
      });

      if (!admin || admin.role !== "ADMIN") {
        console.warn(
          `[Permissions] Non-admin user ${actualAdminId} attempted audit log`
        );
        return;
      }
    }

    await db.adminAuditLog.create({
      data: {
        adminId: actualAdminId,
        action,
        targetType,
        targetId: targetId || null,
        payload: payload as any || null,
      },
    });
  } catch (error) {
    console.error("[Permissions] Failed to log audit event:", error);
  }
}
