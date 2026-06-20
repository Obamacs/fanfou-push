# 管理员路由批量更新指南

已完成的管理员路由：
- ✅ `/api/admin/orders/[id]/refund` - 完全升级
- ✅ `/api/admin/orders` - 完全升级

需要更新的管理员路由（按优先级）：

## 优先级 1：用户管理（HIGH）

### `/api/admin/users/[userId]/ban/route.ts`

**当前代码问题**：
- 使用旧的 `requireAdmin()` 从 `api-helpers`
- 缺少 Zod 输入验证
- 缺少详细的权限检查

**更新模板**：

```typescript
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAuditEvent } from "@/lib/permissions";
import { z } from "zod";

const banUserSchema = z.object({
  isBanned: z.boolean().describe("是否禁用用户"),
  reason: z.string().min(5).max(500).optional().describe("禁用原因"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Step 1: Admin auth
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.error;

    const { userId } = await params;

    // Step 2: Validate input
    const body = await req.json();
    const validation = banUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: "数据验证失败",
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { isBanned, reason } = validation.data;

    // Step 3: Update user with transaction
    const user = await db.$transaction(async (tx) => {
      return await tx.user.update({
        where: { id: userId },
        data: { isBanned },
      });
    });

    // Step 4: Audit log
    await logAuditEvent(
      authResult.auth.userId,
      isBanned ? "USER_BAN" : "USER_UNBAN",
      "User",
      userId,
      { isBanned, reason }
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json(
      { error: "更新用户状态失败" },
      { status: 500 }
    );
  }
}
```

### `/api/admin/users/[userId]/permissions/route.ts`

**需要添加**：
- `requireAdmin()` 权限检查
- Zod 验证权限字段
- 审计日志
- 事务保护

### `/api/admin/users/route.ts`

**需要添加**：
- 查询参数验证
- 权限检查
- 分页参数验证

---

## 优先级 2：事件管理（MEDIUM）

### `/api/admin/events/route.ts`

**需要添加**：
- `requireAdmin()` 检查
- 过滤条件验证
- 分页验证

### `/api/admin/events/[eventId]/route.ts`

**需要添加**：
- 权限检查
- 更新字段验证
- 审计日志

---

## 优先级 3：其他管理操作（MEDIUM）

### `/api/admin/reports/[reportId]/route.ts`

**需要添加**：
- 权限检查
- 审计日志
- 报告状态验证

### `/api/admin/coupons/route.ts`

**需要添加**：
- 权限检查
- 优惠券参数验证
- 审计日志

---

## 更新步骤（逐文件）

### 步骤 1：替换 import

```diff
- import { requireAdmin } from "@/lib/api-helpers";
- import { handleError } from "@/lib/api-helpers";
+ import { requireAdmin, logAuditEvent } from "@/lib/permissions";
+ import { z } from "zod";
```

### 步骤 2：定义 Zod Schema

```typescript
const yourSchema = z.object({
  field1: z.string().min(1).max(100),
  field2: z.number().positive().optional(),
});
```

### 步骤 3：更新处理函数开头

```typescript
export async function POST(req: NextRequest) {
  try {
    // 权限检查
    const authResult = await requireAdmin();
    if (!authResult.success) return authResult.error;

    // 输入验证
    const body = await req.json();
    const validation = yourSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: "数据验证失败",
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    // 业务逻辑...

    // 审计日志
    await logAuditEvent(
      authResult.auth.userId,
      "ACTION_NAME",
      "EntityType",
      entityId,
      { /* payload */ }
    );
  } catch (error) {
    // 错误处理
  }
}
```

---

## 自动化更新方式（可选）

如果您想批量应用这些更改，可以使用 Find & Replace：

### 1. 替换所有旧的 requireAdmin import

**Find**: `from "@/lib/api-helpers";`

**Replace**: `from "@/lib/permissions";`

### 2. 替换旧的 requireAdmin 检查

**Find**: 
```
const auth = await requireAdmin();
if (auth.error) return auth.error;
const userId = auth.userId;
```

**Replace**:
```
const authResult = await requireAdmin();
if (!authResult.success) return authResult.error;
const userId = authResult.auth.userId;
```

### 3. 删除旧的 logAdminAction 导入

**Find**: `import { logAdminAction } from "@/lib/admin-audit";`

**Replace**: （删除）

### 4. 替换 logAdminAction 调用

**Find**: 
```typescript
await logAdminAction({
  adminId: auth.userId,
  action: "...",
  targetType: "...",
  targetId: "...",
  payload: {...},
});
```

**Replace**:
```typescript
await logAuditEvent(
  authResult.auth.userId,
  "...",
  "...",
  "...",
  {...},
);
```

---

## 完整的需要更新的管理路由清单

```
📋 /api/admin/ 路由清单

✅ 已完成:
  ✅ orders/[id]/refund
  ✅ orders

⏳ 需要更新 (优先级 1):
  □ users/[userId]/ban
  □ users/[userId]/permissions
  □ users (GET)
  □ reports/[reportId]
  □ events/[eventId]
  □ events/[eventId]/update

⏳ 需要更新 (优先级 2):
  □ events (GET)
  □ events/create
  □ events/generate
  □ coupons
  □ reports (GET)
  □ invites
  □ interests
  □ questionnaire
  □ settings
  □ matchmaking/run

ℹ️ 无需更新 (auth 路由):
  • create-admin
  • create-test-accounts
  • init-seed
```

---

## 验证更新完成

对每个更新的路由：

```bash
# 1. TypeScript 检查
npm run type-check

# 2. 手动测试
curl -X POST http://localhost:3000/api/admin/users/123/ban \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isBanned": true}'

# 3. 检查审计日志是否记录
SELECT * FROM "AdminAuditLog" 
WHERE action = 'USER_BAN' 
ORDER BY "createdAt" DESC LIMIT 1;
```

---

## 时间估计

- 每个路由：5-10 分钟（使用模板）
- 总共 ~20 个路由：2-3 小时
- 测试和验证：1 小时

**总计**：3-4 小时可完成所有管理路由

---

## 需要帮助？

如果在更新某个特定路由时遇到问题：

1. 参考上面的模板
2. 查看已完成的 `/api/admin/orders/[id]/refund/route.ts` 作为范例
3. 确保：
   - ✅ 导入了 `requireAdmin` 和 `logAuditEvent`
   - ✅ 定义了 Zod schema
   - ✅ 检查了权限
   - ✅ 验证了输入
   - ✅ 使用了事务（如果涉及多个表更新）
   - ✅ 记录了审计日志

