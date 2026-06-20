# 第一阶段修复指南 (Phase 1 Fix)

本指南说明如何部署第一阶段的三大安全和稳定性修复。

## 📋 修复清单

### ✅ 已完成的修改

#### 1. **支付幂等性修复** (Payment Idempotency)
**文件**: `app/api/stripe/webhook/route.ts`

**改进**:
- ✅ 新增 `WebhookEvent` 表用于 webhook 去重
- ✅ 使用数据库唯一约束防止重复处理
- ✅ 添加事务（`$transaction`）确保原子性更新
- ✅ webhook 状态追踪（PROCESSING → COMPLETED/FAILED）

**关键变化**:
```typescript
// 之前：仅检查 paymentId 一致性
if (existingAttendance?.paymentId === session.payment_intent) { ... }

// 之后：三层防护
// 1. 数据库唯一约束 (provider, eventId)
// 2. webhook 状态检查
// 3. 事务包装的原子更新
```

#### 2. **输入验证框架** (Input Validation)
**文件**: `lib/validation.ts` (新建)

**改进**:
- ✅ Zod schema 定义所有 API 输入
- ✅ 统一的验证错误格式化
- ✅ 类型安全的请求处理

**支持的 schema**:
- `createEventSchema`
- `findMatchSchema`
- `attendEventSchema`
- `createMessageSchema`
- `createDirectMessageSchema`
- `createRatingSchema`
- `createReportSchema`
- `validateCouponSchema`

#### 3. **权限验证系统** (Permission System)
**文件**: `lib/permissions.ts` (新建)

**改进**:
- ✅ 统一的 `requireAdmin()` 和 `requirePermission()` 函数
- ✅ 数据库权限检查（防止 JWT 权限过期）
- ✅ 审计日志记录（`logAuditEvent`）
- ✅ 资源所有权验证（`verifyOwnership`）

**权限类型**:
```typescript
"CREATE_EVENT" | "EDIT_EVENT" | "DELETE_EVENT" |
"VIEW_ADMIN_PANEL" | "MANAGE_USERS" | "MANAGE_REPORTS" |
"MANAGE_COUPONS" | "VIEW_ANALYTICS"
```

#### 4. **API 路由升级** (API Route Update)
**文件**: `app/api/events/route.ts` (已更新)

**改进**:
- ✅ 使用 `requirePermission("CREATE_EVENT")`
- ✅ Zod 验证：`createEventSchema.safeParse(body)`
- ✅ 详细的验证错误返回
- ✅ 审计日志记录

---

## 🚀 部署步骤

### Step 1: 数据库迁移

```bash
# 生成迁移文件
npx prisma migrate dev --name add_webhook_event_table

# 应用迁移到生产数据库
npx prisma migrate deploy --skip-generate
```

迁移会创建以下新表：
```sql
CREATE TABLE "WebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" TEXT DEFAULT 'PROCESSING',
  "payload" JSONB NOT NULL,
  "error" TEXT,
  "processedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("provider", "eventId")
);
```

### Step 2: 更新 API 端点

已在 `/events` 路由中更新。其他需要更新的端点：

**优先级高的端点** (立即更新):
- [ ] `app/api/events/[id]/attend/route.ts`
- [ ] `app/api/events/[id]/reserve/route.ts`
- [ ] `app/api/match/find/route.ts`
- [ ] `app/api/messages/route.ts`
- [ ] `app/api/stripe/checkout/route.ts`

**更新模板**:
```typescript
import { requirePermission, logAuditEvent, formatValidationErrors } from "@/lib/permissions";
import { yourSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  // Step 1: 权限检查
  const authResult = await requirePermission("PERMISSION_NAME");
  if (!authResult.success) return authResult.error;

  // Step 2: 解析并验证
  const body = await req.json();
  const validation = yourSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "验证失败", details: formatValidationErrors(validation.error) },
      { status: 400 }
    );
  }

  // Step 3: 业务逻辑
  const result = await db.table.create({ ... });

  // Step 4: 审计日志
  await logAuditEvent(userId, "ACTION", "Entity", result.id);

  return NextResponse.json(result, { status: 201 });
}
```

### Step 3: 测试修复

```bash
# 运行现有的单元测试
npm run test

# 手动测试 webhook（使用 Stripe CLI）
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 在另一个终端触发测试事件
stripe trigger payment_intent.succeeded
```

### Step 4: 部署到生产

```bash
# 推送更改
git add .
git commit -m "fix: phase 1 - payment idempotency, input validation, permissions"

# 部署到 Vercel
git push origin main

# 验证部署
vercel logs
```

---

## 📊 验证修复是否生效

### 支付幂等性测试

```bash
# 发送相同的 webhook 两次
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "stripe-signature: test" \
  -d '{"id": "evt_123", ...}'

# 预期结果：
# 第一次：{ "received": true }
# 第二次：{ "received": true } (不重复处理)

# 验证数据库：
SELECT * FROM "WebhookEvent" WHERE "provider" = 'stripe' AND "eventId" = 'evt_123';
# 应该只有一条记录，status = 'COMPLETED'
```

### 权限验证测试

```bash
# 未登录创建事件 → 401
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
# { "error": "未授权" }

# 普通用户创建事件（无权限）→ 403
# 需要先赋予 canCreateEvents = true

# 管理员创建事件 → 201
# 应该生成审计日志
```

### 输入验证测试

```bash
# 无效标题（>100字）
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{"title": "x".repeat(101), "type": "MEAL", "city": "Beijing", "date": "2025-12-31"}'
# { "error": "数据验证失败", "details": { "title": ["...不能超过100字"] } }

# 过去的日期
# { "error": "数据验证失败", "details": { "date": ["...必须是未来的时间"] } }
```

---

## 🔍 常见问题

### Q1: 迁移失败怎么办？

```bash
# 检查迁移状态
npx prisma migrate status

# 如果卡住了，重置为上一个成功的迁移
npx prisma migrate resolve --rolled-back migration_name

# 重新创建迁移
npx prisma migrate dev --name fix_migration
```

### Q2: 旧的 webhook 记录怎么处理？

已处理的 webhook 不会重新处理。新的 webhook 会通过唯一约束和状态检查防止重复。

### Q3: 如何监控 webhook 失败？

```sql
-- 查看失败的 webhook
SELECT * FROM "WebhookEvent" WHERE "status" = 'FAILED' ORDER BY "createdAt" DESC;

-- 重试失败的 webhook（手动）
UPDATE "WebhookEvent" SET "status" = 'PROCESSING' WHERE "id" = '...';
```

### Q4: 性能影响？

- **支付幂等性**：增加 1 次数据库查询（使用唯一约束，非常快）
- **输入验证**：Zod 验证 < 1ms，对性能无影响
- **权限检查**：增加 1 次数据库查询（有权限缓存优化空间）

---

## 📈 后续优化

- [ ] **缓存权限检查** (30s TTL)
- [ ] **权限中间件** (NextAuth.js 集成)
- [ ] **速率限制** (按用户/IP 限制)
- [ ] **Webhook 重试机制** (指数退避)
- [ ] **自动审计日志清理** (保留 90 天)

---

## 🆘 支持和反馈

如遇到问题：
1. 检查 TypeScript 类型错误：`npm run type-check`
2. 查看数据库迁移日志：`npx prisma migrate status`
3. 检查 Stripe webhook 签名：`stripe listen --help`
