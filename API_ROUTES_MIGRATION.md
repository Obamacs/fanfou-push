# API 路由迁移检查清单

## 🎯 目标
将所有 API 路由升级为使用新的验证和权限系统

---

## 📊 优先级分类

### 🔴 高优先级 (关键路由，必须立即更新)

| 路由 | 方法 | 功能 | 风险等级 | 状态 |
|------|------|------|---------|------|
| `/api/events` | POST | 创建事件 | 🔴 高 | ✅ 已更新 |
| `/api/events/[id]/reserve` | POST | 预订事件 | 🔴 高 | ⏳ 待更新 |
| `/api/match/find` | POST | 发起匹配 | 🟡 中 | ✅ 已更新 |
| `/api/stripe/checkout` | POST | 创建支付 | 🔴 高 | ⏳ 待更新 |
| `/api/messages` | POST | 发送消息 | 🟡 中 | ⏳ 待更新 |
| `/api/admin/*` | ALL | 管理操作 | 🔴 高 | ⏳ 待更新 |

### 🟡 中优先级 (常用路由)

| 路由 | 方法 | 功能 | 风险等级 | 状态 |
|------|------|------|---------|------|
| `/api/events/[id]/attend` | POST | 参加事件 | 🟡 中 | ⏳ 待更新 |
| `/api/events/[id]/attendance` | GET | 获取参与者 | 🟢 低 | ⏳ 待更新 |
| `/api/match/[id]/confirm` | POST | 确认匹配 | 🟡 中 | ⏳ 待更新 |
| `/api/ratings` | POST | 评分用户 | 🟢 低 | ⏳ 待更新 |
| `/api/reports` | POST | 举报用户 | 🟡 中 | ⏳ 待更新 |
| `/api/coupons/validate` | POST | 验证优惠券 | 🟡 中 | ⏳ 待更新 |

### 🟢 低优先级 (查询路由)

| 路由 | 方法 | 功能 | 风险等级 | 状态 |
|------|------|------|---------|------|
| `/api/events` | GET | 获取事件列表 | 🟢 低 | ✅ 已验证 |
| `/api/match` | GET | 获取匹配列表 | 🟢 低 | ⏳ 待审计 |
| `/api/messages` | GET | 获取消息 | 🟢 低 | ⏳ 待审计 |
| `/api/profile` | GET | 获取用户档案 | 🟢 低 | ⏳ 待审计 |

---

## 📝 更新模板

### 通用更新步骤

```typescript
// ❌ 之前
import { auth } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  const body = await req.json();
  // 业务逻辑...
}

// ✅ 之后
import { validateAuth, logAuditEvent } from "@/lib/permissions";
import { yourSchema, formatValidationErrors } from "@/lib/validation";

export async function POST(req: NextRequest) {
  // Step 1: 权限验证
  const authResult = await validateAuth();
  if (!authResult.success) return authResult.error;

  // Step 2: 请求体解析和验证
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "请求体格式无效" },
      { status: 400 }
    );
  }

  const validation = yourSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "数据验证失败",
        details: formatValidationErrors(validation.error),
      },
      { status: 400 }
    );
  }

  // Step 3: 业务逻辑
  const result = await db.table.create({ /* ... */ });

  // Step 4: 审计日志
  if (authResult.auth.role === "ADMIN") {
    await logAuditEvent(
      authResult.auth.userId,
      "ACTION_NAME",
      "EntityType",
      result.id
    );
  }

  return NextResponse.json(result, { status: 201 });
}
```

---

## 🔧 按路由的具体更新

### 1. `/api/events/[id]/reserve` (支付路由)

**需要处理**:
- ✅ 权限：需要验证用户已参加事件
- ✅ 输入：eventId, amount 验证
- ✅ 事务：与 Stripe 集成
- ✅ 审计：记录支付请求

**关键代码片段**:
```typescript
const validation = z.object({
  eventId: z.string().min(1),
  amount: z.number().positive().max(10000),
}).safeParse(body);

// 验证用户已参加事件
const attendance = await db.eventAttendance.findUnique({
  where: { eventId_userId: { eventId, userId } },
});

if (!attendance) {
  return NextResponse.json(
    { error: "您还未参加此活动" },
    { status: 403 }
  );
}
```

### 2. `/api/stripe/checkout` (支付创建)

**需要处理**:
- ✅ 权限：基本身份验证
- ✅ 输入：eventId, priceAmount 验证
- ✅ 事务：创建 Stripe session
- ✅ 审计：记录支付创建

**关键代码片段**:
```typescript
const validation = z.object({
  eventId: z.string().min(1),
  priceAmount: z.number().positive().max(10000),
}).safeParse(body);

// 创建 session，与 webhook 配合
const session = await stripe.checkout.sessions.create({
  metadata: {
    eventId,
    userId,
    // 添加请求 ID 用于去重
    requestId: req.headers.get("x-request-id") || cuid(),
  },
});
```

### 3. `/api/messages` (聊天)

**需要处理**:
- ✅ 权限：验证用户已参加事件
- ✅ 输入：content (不超过5000字), eventId
- ✅ 事务：创建消息
- ✅ 速率限制：防止刷屏

**关键代码片段**:
```typescript
const validation = createMessageSchema.safeParse(body);

// 验证用户是否在这个事件中
const isParticipant = await db.eventAttendance.findUnique({
  where: { eventId_userId: { eventId: validation.data.eventId, userId } },
});

if (!isParticipant) {
  return NextResponse.json(
    { error: "您不是此活动的参与者" },
    { status: 403 }
  );
}
```

### 4. `/api/admin/*` (管理端点)

**需要处理**:
- ✅ 权限：requireAdmin()
- ✅ 输入：完整验证所有字段
- ✅ 审计：详细的操作日志
- ✅ 操作追踪：谁做了什么

**关键代码片段**:
```typescript
// 所有管理端点都需要
const authResult = await requireAdmin();
if (!authResult.success) return authResult.error;

// 操作前后都要审计
await logAuditEvent(
  authResult.auth.userId,
  "UPDATE_USER",
  "User",
  targetUserId,
  {
    changes: {
      before: oldUser,
      after: updatedUser,
    },
  }
);
```

---

## ✅ 验证检查清单

对于每个更新的路由，确保：

- [ ] 导入了正确的验证和权限函数
- [ ] 添加了 Zod schema 验证（或使用现有的）
- [ ] 权限检查（`validateAuth` 或 `requireAdmin`）
- [ ] 输入验证错误返回了详细信息
- [ ] 关键操作添加了审计日志
- [ ] 数据库操作使用了事务
- [ ] 错误处理清晰且用户友好
- [ ] 没有 N+1 查询问题
- [ ] 返回的错误状态码正确（401/403/400/500）

---

## 📋 更新进度

### 第 1 周
- [x] 实现基础验证和权限库
- [x] 更新 `/api/events` (POST)
- [x] 更新 `/api/match/find` (POST)
- [ ] 添加 Webhook 表和迁移
- [ ] 更新支付相关路由

### 第 2 周
- [ ] 更新所有高优先级路由
- [ ] 添加单元测试
- [ ] 性能测试和基准

### 第 3 周
- [ ] 更新所有中优先级路由
- [ ] E2E 测试
- [ ] 部署和验证

---

## 🆘 常见问题

**Q: 如何测试更新后的路由？**

```bash
# 1. 单元测试
npm run test -- api/events

# 2. 集成测试（使用 curl）
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "type": "MEAL", "city": "Beijing", "date": "2025-12-31"}'

# 3. E2E 测试（使用 Playwright）
npm run test:e2e
```

**Q: 如何处理向后兼容性？**

- 旧的 API 客户端仍能工作，因为我们只添加了验证层
- 返回的错误格式有所改变，但客户端可以轻松适应
- 建议在 README 中更新 API 文档

**Q: 如何批量更新所有路由？**

使用脚本自动化：
```bash
# 使用 sed 替换所有路由中的认证检查
find app/api -name "route.ts" -type f -exec sed -i 's/const session = await auth()/const authResult = await validateAuth()/' {} \;
```

---

## 📚 相关文件

- `lib/validation.ts` - Zod schemas
- `lib/permissions.ts` - 权限函数
- `PHASE1_FIX_GUIDE.md` - 部署指南
- `prisma/schema.prisma` - 数据库 schema

