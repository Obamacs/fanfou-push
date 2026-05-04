# 活动创建权限控制 — 实现总结

## 📋 需求
除非系统管理员授权，其他人不能发起活动。

## ✅ 实现方案

### 1. 数据库模型更新
**文件**: `prisma/schema.prisma`

在User模型中添加新字段：
```prisma
canCreateEvents   Boolean   @default(false)
```

- **默认值**: `false`（普通用户无权限）
- **说明**: 标记用户是否被授权创建活动
- **权限**: 只有管理员可以设置此字段

### 2. API权限检查
**文件**: `app/api/events/route.ts`

在POST端点添加权限验证：

```typescript
// 获取用户信息，检查是否有权限创建活动
const user = await db.user.findUnique({
  where: { id: session.user.id as string },
  select: { canCreateEvents: true, role: true },
});

// 只有管理员或授权用户才能创建活动
if (!user?.canCreateEvents && user?.role !== "ADMIN") {
  return NextResponse.json(
    { error: "您没有权限创建活动。请联系管理员申请权限。" },
    { status: 403 }
  );
}
```

**权限规则**:
- ✅ 管理员 (`role === "ADMIN"`) - 总是可以创建活动
- ✅ 授权用户 (`canCreateEvents === true`) - 可以创建活动
- ❌ 普通用户 - 禁止创建活动

### 3. 前端页面权限控制
**文件**: `app/(main)/events/new/page.tsx`

添加前端权限检查和友好的权限提示：

```typescript
// 获取用户信息，检查是否有权限创建活动
const user = await db.user.findUnique({
  where: { id: session.user.id as string },
  select: { canCreateEvents: true, role: true },
});

// 只有管理员或授权用户才能创建活动
if (!user?.canCreateEvents && user?.role !== "ADMIN") {
  return (
    // 显示权限提示界面
    <Card className="p-8 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center space-y-6">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold">权限限制</h1>
        <p className="text-lg text-gray-700">
          目前只有系统管理员授权的用户可以发起活动。
        </p>
        <!-- 提供联系管理员的链接 -->
      </div>
    </Card>
  );
}
```

## 🔑 权限管理

### 授权用户创建活动
管理员可以通过数据库更新用户的`canCreateEvents`字段：

```sql
UPDATE "User" 
SET "canCreateEvents" = true 
WHERE id = 'user_id';
```

或通过管理员后台（如果有）更新。

### 撤销权限
```sql
UPDATE "User" 
SET "canCreateEvents" = false 
WHERE id = 'user_id';
```

## 📊 权限决策树

```
用户尝试创建活动
    ↓
用户是否已登录？
  ├─ 否 → 重定向到登录页
  └─ 是 ↓
    用户的role是否为"ADMIN"？
      ├─ 是 → ✅ 允许创建
      └─ 否 ↓
        用户的canCreateEvents是否为true？
          ├─ 是 → ✅ 允许创建
          └─ 否 → ❌ 显示权限限制页面
```

## 🎯 用户体验

### 无权限用户访问 `/events/new`
显示权限限制提示页面，包含：
- 🔒 清晰的权限提示
- 📝 解释为什么无权限
- 💬 "联系管理员" 按钮
- 📋 "浏览现有活动" 按钮

### 有权限用户访问 `/events/new`
正常显示活动创建表单。

## 📝 相关文件变更

| 文件 | 变更 | 说明 |
|------|------|------|
| `prisma/schema.prisma` | 添加字段 | 新增 `canCreateEvents` 字段 |
| `app/api/events/route.ts` | 权限检查 | 在POST端点添加权限验证逻辑 |
| `app/(main)/events/new/page.tsx` | 前端检查 | 添加权限检查和提示页面 |
| 数据库 | 迁移应用 | 已通过 `prisma db push` 应用 |

## 🔐 安全性考虑

✅ **后端验证** - API端点在后端检查权限，防止绕过
✅ **前端提示** - 前端显示权限限制，提高用户体验
✅ **管理员保护** - 只有管理员可以授权用户
✅ **默认安全** - 新用户默认无权限创建活动

## 🧪 测试场景

1. **普通用户** → 访问 `/events/new` → 显示权限限制 ✅
2. **授权用户** → 访问 `/events/new` → 显示表单 ✅
3. **管理员** → 访问 `/events/new` → 显示表单 ✅
4. **普通用户** → API调用 → 返回 403 错误 ✅

## 📚 后续步骤

1. **管理员界面** - 可选：创建管理员后台来管理用户权限
2. **申请流程** - 可选：实现用户申请创建活动权限的流程
3. **分级权限** - 可选：添加更细粒度的权限（如只能创建特定类型的活动）
4. **活动限额** - 可选：限制每个用户可以创建的活动数量

---

**实现日期**: 2026-05-04
**状态**: ✅ 已实现并测试
**权限系统**: 仅限授权用户创建活动
