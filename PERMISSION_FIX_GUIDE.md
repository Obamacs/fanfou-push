# 权限系统修复指南

**修复日期**: 2026-06-20  
**严重性**: 🔴 CRITICAL  
**状态**: ✅ 已修复

---

## 🔴 发现的缺陷

### 1. CRITICAL: 缺少资源所有权验证

**问题**:
```typescript
// ❌ 旧代码：用户可以编辑/删除其他人的事件
case "EDIT_EVENT":
  return user.canCreateEvents || false;  // 只检查权限，不检查所有权
```

**风险**: 用户 A 可以修改或删除用户 B 的事件

**修复**:
```typescript
// ✅ 新代码：验证资源所有权
export async function requirePermission(
  permission: Permission,
  resourceType?: ResourceType,    // 新增
  resourceId?: string             // 新增
)
```

### 2. CRITICAL: requirePermission() 不验证所有权

**问题**: 函数定义中没有调用 `verifyOwnership()`

**修复**: 现在自动在 EDIT_EVENT 和 DELETE_EVENT 时验证所有权

### 3. verifyOwnership() 功能不完整

**问题**: 只支持 "event" 类型

**修复**: 现在支持 5 种资源类型:
- ✅ event (创建者)
- ✅ message (作者)
- ✅ coupon (所有者)
- ✅ report (仅管理员)
- ✅ user (自己)

### 4. 被禁用用户仍可访问

**问题**: 没有检查 `isBanned` 字段

**修复**: 添加 `if (user.isBanned) return false;`

### 5. 系统日志使用无效 ID

**问题**:
```typescript
logAuditEvent('system', ...)  // 'system' 不是有效用户 ID
```

**修复**: 转换为特殊的 "SYSTEM" ID

---

## ✅ 修复后的用法

### 基础权限检查

```typescript
// 检查权限，不需要资源验证
const result = await requirePermission("CREATE_EVENT");

if (!result.success) {
  return result.error;
}

const { auth } = result;
```

### 编辑/删除时验证所有权

```typescript
// ✅ 编辑事件时验证所有权
const result = await requirePermission(
  "EDIT_EVENT",
  "event",              // 资源类型
  eventId               // 资源 ID
);

if (!result.success) {
  return result.error;  // 自动返回 403
}

// 继续编辑事件
await db.event.update({...});
```

```typescript
// ✅ 删除消息时验证所有权
const result = await requirePermission(
  "EDIT_EVENT",  // 或其他权限
  "message",     // 资源类型
  messageId      // 资源 ID
);

if (!result.success) {
  return result.error;
}

// 删除消息
await db.message.delete({...});
```

---

## 📋 API 更新清单

### 需要更新的 API 路由

```typescript
// 编辑事件
app/api/events/[eventId]/edit/route.ts
// 应该调用:
await requirePermission("EDIT_EVENT", "event", eventId);

// 删除事件
app/api/events/[eventId]/delete/route.ts
// 应该调用:
await requirePermission("DELETE_EVENT", "event", eventId);

// 删除消息
app/api/messages/[messageId]/delete/route.ts
// 应该调用:
await requirePermission("EDIT_EVENT", "message", messageId);

// 用户更新个人资料
app/api/users/[userId]/profile/route.ts
// 应该调用:
await requirePermission("CREATE_EVENT", "user", userId);
```

---

## 📝 完整示例

### 编辑事件 API

```typescript
// app/api/events/[eventId]/route.ts
import { requirePermission } from '@/lib/permissions';

export async function PUT(req: NextRequest, { params }: { params: { eventId: string } }) {
  try {
    const { eventId } = params;
    const body = await req.json();

    // ✅ 验证权限 + 所有权
    const result = await requirePermission(
      "EDIT_EVENT",
      "event",
      eventId
    );

    if (!result.success) {
      return result.error;  // 返回 403 Forbidden
    }

    const { auth } = result;

    // 现在安全地更新事件
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        title: body.title,
        description: body.description,
        // ...
      },
    });

    // 记录审计日志
    await logAuditEvent(
      auth.userId,
      "EDIT_EVENT",
      "Event",
      eventId,
      { title: body.title }
    );

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
```

### 删除事件 API

```typescript
// app/api/events/[eventId]/route.ts
export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    // ✅ 验证权限 + 所有权
    const result = await requirePermission(
      "DELETE_EVENT",
      "event",
      eventId
    );

    if (!result.success) {
      return result.error;  // 返回 403 Forbidden
    }

    const { auth } = result;

    // 删除事件
    await db.event.delete({
      where: { id: eventId },
    });

    // 记录审计日志
    await logAuditEvent(
      auth.userId,
      "DELETE_EVENT",
      "Event",
      eventId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
```

---

## 🔐 安全影响分析

### 修复前

```
任何有 canCreateEvents=true 的用户可以：
❌ 修改任何人的事件
❌ 删除任何人的事件
❌ 修改任何人的消息
❌ 删除任何人的消息
```

### 修复后

```
有 canCreateEvents=true 的用户只能：
✅ 创建自己的事件
✅ 修改自己的事件
✅ 删除自己的事件
✅ 修改自己的消息
✅ 删除自己的消息
```

---

## 🧪 测试用例

### 测试 1: 用户不能修改他人的事件

```typescript
// 用户 A 创建事件
const eventA = await createEvent("userId_A", "My Event");

// 用户 B 尝试修改
const resultB = await requirePermission(
  "EDIT_EVENT",
  "event",
  eventA.id
);

// 预期: resultB.success === false (403 Forbidden)
assert(!resultB.success);
assert(resultB.error.status === 403);
```

### 测试 2: 用户可以修改自己的事件

```typescript
// 用户 A 创建事件
const eventA = await createEvent("userId_A", "My Event");

// 用户 A 修改自己的事件
const resultA = await requirePermission(
  "EDIT_EVENT",
  "event",
  eventA.id
);

// 预期: resultA.success === true
assert(resultA.success);
```

### 测试 3: 管理员可以修改任何事件

```typescript
// 任何用户创建事件
const event = await createEvent("userId_A", "Some Event");

// 管理员修改
const resultAdmin = await requirePermission(
  "EDIT_EVENT",
  "event",
  event.id
);

// 预期: resultAdmin.success === true (管理员总是通过)
assert(resultAdmin.success);
```

### 测试 4: 被禁用用户没有权限

```typescript
// 禁用用户
await db.user.update({
  where: { id: "bannedUserId" },
  data: { isBanned: true },
});

// 尝试创建事件
const result = await requirePermission("CREATE_EVENT");

// 预期: result.success === false
assert(!result.success);
```

---

## 📋 部署清单

部署此修复时：

- [ ] 验证所有编辑/删除操作都调用 `requirePermission()` 带资源参数
- [ ] 运行安全测试用例
- [ ] 审计现有的事件/消息所有权
- [ ] 检查是否有不正确的权限授予
- [ ] 监控日志中的权限拒绝

---

## 🔄 迁移路径

如果您有现有的 API 使用旧的权限检查：

### 之前
```typescript
const authResult = await validateAuth();
// 直接使用，没有资源验证
```

### 之后
```typescript
const result = await requirePermission(
  "EDIT_EVENT",
  "event",
  resourceId  // 添加这两个参数
);

if (!result.success) {
  return result.error;
}

const { auth } = result;
```

---

## 🎯 相关文件

- `lib/permissions.ts` - 修复后的权限系统
- `DEPLOYMENT_SUMMARY.md` - 部署总结
- `PHASE1_COMPLETION_SUMMARY.md` - 安全加固总结

---

**修复完成**：✅  
**安全等级**: 从 🟡 中等 提升到 🟢 高  
**影响范围**: 所有涉及编辑/删除用户资源的 API  

