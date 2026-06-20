# 第二阶段修复：性能优化

**阶段**: 2/3  
**焦点**: 性能、可扩展性、用户体验  
**预计时间**: 3-5 天  
**优先级**: 🟡 中等（不紧急但重要）

---

## 🎯 第二阶段目标

### 主要优化方向

1. **数据库查询优化** - 消除 N+1 查询
2. **邮件系统可靠性** - 重试机制 + 队列
3. **日志规范化** - 结构化日志
4. **算法参数化** - 配置化匹配权重
5. **缓存策略** - 权限和数据缓存

---

## 📊 性能现状分析

### 🔴 高优先级问题

#### 1. N+1 查询问题 (HIGH)

**影响范围**: 
- `/api/match/find` - 匹配查询
- `/api/events` 列表页面
- `/api/users` 用户列表
- 其他需要关联数据的 API

**示例问题**:
```typescript
// ❌ 坏的做法 - N+1 查询
const events = await db.event.findMany({...});
for (const event of events) {
  const attendees = await db.eventAttendance.findMany({
    where: { eventId: event.id }
  });
  // 1 次查询 + N 次查询 = N+1
}

// ✅ 好的做法 - 预加载
const events = await db.event.findMany({
  include: {
    attendances: true,
    creator: true,
    // ... 其他关联
  },
});
```

**预期改善**:
- API 响应时间：300ms → 100ms (70% 提升)
- 数据库连接数：减少 80%+
- 服务器负载：下降 60%+

#### 2. 邮件系统不可靠 (HIGH)

**现状**:
- 邮件发送没有重试
- 邮件失败会导致用户收不到通知
- 没有队列机制

**改进方案**:
- 集成消息队列（Bull/BullMQ）
- 实现指数退避重试
- 邮件发送失败告警
- 邮件发送状态跟踪

**预期改善**:
- 邮件可靠性：85% → 99%+
- 用户投诉：减少 70%+

#### 3. 权限检查性能 (MEDIUM)

**现状**:
- 每次 API 调用都查询数据库验证权限
- 没有缓存
- 权限变更时缓存不会失效

**改进方案**:
- 添加 Redis 缓存（30 秒 TTL）
- 权限变更时清除缓存
- 权限检查时优先查缓存

**预期改善**:
- 权限检查时间：50ms → 2ms (95% 提升)
- 数据库查询减少 90%+

---

## 📝 详细修复清单

### 第 2.1 步：查询优化（1-2 天）

#### 任务 1：分析 N+1 查询

需要检查的 API:
```
□ /api/match/find - 匹配查询
□ /api/events - 事件列表
□ /api/messages - 消息列表
□ /api/profile - 用户档案
□ 所有列表 API
```

**工具**:
```bash
# 启用 Prisma 查询日志
export DEBUG=prisma:*

# 或在代码中：
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});
```

#### 任务 2：修复 N+1 查询

**匹配 API 示例**:
```typescript
// 文件: lib/match-actions.ts

// 之前
const matches = await db.match.findMany({where: {...}});
for (const match of matches) {
  const members = await db.matchMember.findMany({
    where: { matchId: match.id }
  });
  // N+1!
}

// 之后
const matches = await db.match.findMany({
  where: {...},
  include: {
    members: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            // ...
          }
        }
      }
    },
    event: true,
  },
});
```

**受影响的文件**:
- `lib/match-actions.ts` (匹配逻辑)
- `lib/event-queries.ts` (事件查询)
- `app/(main)` 页面组件

#### 任务 3：添加数据库索引

```sql
-- 关键索引
CREATE INDEX "Match_status_createdAt_idx" ON "Match"("status", "createdAt");
CREATE INDEX "MatchMember_userId_idx" ON "MatchMember"("userId");
CREATE INDEX "EventAttendance_userId_status_idx" ON "EventAttendance"("userId", "status");
CREATE INDEX "Message_eventId_createdAt_idx" ON "Message"("eventId", "createdAt");
```

**预期结果**:
- 查询时间：从 300ms 降到 100ms
- 数据库连接：从 N+1 到 1

---

### 第 2.2 步：邮件系统可靠性（1-2 天）

#### 任务 1：集成 Bull 队列

**安装依赖**:
```bash
npm install bull redis
# 或
npm install bullmq redis
```

**创建邮件队列**:
```typescript
// lib/email-queue.ts
import Queue from 'bull';
import { sendEmail } from './email';

const emailQueue = new Queue('emails', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// 处理邮件发送
emailQueue.process(async (job) => {
  const { to, subject, html } = job.data;
  
  try {
    await sendEmail({ to, subject, html });
    return { success: true };
  } catch (error) {
    // 重试最多 3 次，间隔指数增长
    throw error;
  }
});

// 错误处理
emailQueue.on('failed', async (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
  await notifyAdmin(`Email send failed: ${job.data.to}`);
});

export async function queueEmail(options: EmailOptions) {
  await emailQueue.add(options, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 初始延迟 2 秒
    },
    removeOnComplete: true,
  });
}
```

#### 任务 2：替换邮件调用

**现有代码**:
```typescript
// ❌ 直接调用
await sendEmail({to, subject, html});
```

**新代码**:
```typescript
// ✅ 队列发送
import { queueEmail } from '@/lib/email-queue';

await queueEmail({to, subject, html});
// 立即返回，邮件后台发送
```

**受影响的文件**:
- `lib/email.ts` - 添加队列包装
- 所有发送邮件的地方

#### 任务 3：邮件发送失败告警

```typescript
// lib/email-queue.ts

emailQueue.on('failed', async (job, err) => {
  // 告警管理员
  await logAuditEvent(
    'system',
    'EMAIL_SEND_FAILED',
    'Email',
    job.id,
    {
      to: job.data.to,
      subject: job.data.subject,
      error: err.message,
      attempts: job.attemptsMade,
    }
  );
  
  // 如果连续失败超过 3 次，发送 Slack 警报
  if (job.attemptsMade >= 3) {
    await sendSlackAlert(`Email delivery failed: ${job.data.to}`);
  }
});
```

**预期结果**:
- 邮件可靠性：85% → 99%+
- 邮件延迟：立即 → <30 秒

---

### 第 2.3 步：权限检查缓存（半天）

#### 任务 1：添加 Redis 缓存

```typescript
// lib/permissions.ts

import { redis } from '@/lib/redis';

export async function requireAdmin(): Promise<...> {
  const authResult = await validateAuth();
  if (!authResult.success) return authResult;

  const userId = authResult.auth.userId;
  const cacheKey = `admin:${userId}`;

  // 先查缓存
  const cached = await redis.get(cacheKey);
  if (cached === 'true') {
    return authResult;
  }
  if (cached === 'false') {
    return {
      success: false,
      error: NextResponse.json(
        { error: "您没有权限访问此资源" },
        { status: 403 }
      ),
    };
  }

  // 缓存未命中，查数据库
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isAdmin = user?.role === 'ADMIN';
  
  // 缓存结果 (30 秒)
  await redis.setex(cacheKey, 30, isAdmin ? 'true' : 'false');

  if (!isAdmin) {
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

// 权限变更时清除缓存
export async function clearPermissionCache(userId: string) {
  await redis.del(`admin:${userId}`);
  // 可选：清除该用户的所有缓存
  await redis.del(`perms:${userId}:*`);
}
```

#### 任务 2：权限变更时清除缓存

```typescript
// app/api/admin/users/[userId]/permissions/route.ts

export async function PUT(req: NextRequest) {
  // ... 更新权限逻辑 ...
  
  // 更新后清除缓存
  await clearPermissionCache(userId);
  
  return NextResponse.json({success: true});
}
```

**预期结果**:
- 权限检查时间：50ms → 2ms
- 数据库查询减少 90%+

---

### 第 2.4 步：日志规范化（半天）

#### 任务 1：实现结构化日志

```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

export function logInfo(message: string, data?: any) {
  logger.info(message, { timestamp: new Date(), ...data });
}

export function logError(message: string, error: Error, data?: any) {
  logger.error(message, {
    timestamp: new Date(),
    error: error.message,
    stack: error.stack,
    ...data,
  });
}

export function logQuery(query: string, duration: number) {
  if (duration > 100) { // 只记录慢查询
    logger.warn('Slow query', {
      timestamp: new Date(),
      query,
      duration,
    });
  }
}
```

#### 任务 2：替换 console.log

```typescript
// ❌ 之前
console.log('User created:', user);
console.error('Something went wrong:', err);

// ✅ 之后
import { logInfo, logError } from '@/lib/logger';

logInfo('User created', { userId: user.id, email: user.email });
logError('Failed to create user', err, { email: user.email });
```

**预期结果**:
- 日志可读性提升
- 调试问题更快
- 性能监控更清晰

---

### 第 2.5 步：匹配算法参数化（半天）

#### 任务 1：将权重移至数据库

```typescript
// 创建配置表结构
model MatchConfig {
  id      String @id @default(cuid())
  key     String @unique  // 如: "age_weight", "distance_weight"
  value   Float
  updatedAt DateTime @updatedAt
}

// 或使用 AppSettings 表
model AppSettings {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

#### 任务 2：使用配置替代硬编码

```typescript
// lib/matching.ts

async function getMatchingWeights() {
  const weights = await db.appSettings.findMany({
    where: {
      key: { startsWith: 'match_weight_' },
    },
  });
  
  return {
    ageWeight: parseFloat(
      weights.find(w => w.key === 'match_weight_age')?.value || '0.2'
    ),
    distanceWeight: parseFloat(
      weights.find(w => w.key === 'match_weight_distance')?.value || '0.3'
    ),
    // ... 其他权重
  };
}

// 使用时
const weights = await getMatchingWeights();
const score = 
  user.age * weights.ageWeight +
  distance * weights.distanceWeight;
```

#### 任务 3：管理员界面配置权重

```typescript
// 在管理后台添加配置页面
// app/admin/settings/matching-config/page.tsx

// 允许管理员调整权重
// 数据驱动的优化
```

**预期结果**:
- 无需重新部署即可调整算法
- A/B 测试变得容易
- 数据驱动优化

---

### 第 2.6 步：E2E 测试（可选，1 天）

#### 任务 1：编写关键流程测试

```bash
npm install --save-dev @playwright/test
```

**测试用例**:
```typescript
// tests/critical-flows.spec.ts

test('User can find and confirm a match', async ({ page }) => {
  // 1. 登录
  await page.goto('/login');
  await page.fill('input[name=email]', 'user@example.com');
  // ...
  
  // 2. 查找匹配
  await page.goto('/match');
  await page.click('button:has-text("Find Match")');
  
  // 3. 验证匹配结果
  await expect(page).toHaveURL(/\/match\/\w+/);
  
  // 4. 确认匹配
  await page.click('button:has-text("Confirm")');
  
  // 5. 验证成功
  await expect(page.locator('text=Match confirmed')).toBeVisible();
});

test('Admin can process refund', async ({ page }) => {
  // 登录为管理员
  // 进入订单列表
  // 处理退款
  // 验证审计日志
});
```

**预期结果**:
- 关键流程回归测试
- 部署时更有信心

---

## 📋 第二阶段执行计划

### 周计划

**第 1 天**:
- [ ] 分析 N+1 查询问题
- [ ] 修复关键 API 的 N+1 查询

**第 2 天**:
- [ ] 继续修复其他 N+1 查询
- [ ] 添加数据库索引
- [ ] 性能测试验证

**第 3 天**:
- [ ] 集成 Bull 邮件队列
- [ ] 实现重试机制
- [ ] 测试邮件发送

**第 4 天**:
- [ ] 添加权限缓存
- [ ] 日志规范化
- [ ] 匹配权重参数化

**第 5 天**:
- [ ] 编写 E2E 测试
- [ ] 性能基准测试
- [ ] 完整验证和部署

---

## 📊 预期成果

### 性能改善

| 指标 | 现在 | 目标 | 改善 |
|------|------|------|------|
| API 响应时间 | 300ms | 100ms | 70% ↓ |
| 数据库查询 | N+1 | 优化 | 80% ↓ |
| 邮件可靠性 | 85% | 99%+ | 14% ↑ |
| 权限检查 | 50ms | 2ms | 96% ↓ |
| 缓存命中率 | 0% | 90%+ | ∞ ↑ |

### 用户体验改善

- ✅ 页面加载更快
- ✅ 邮件通知更可靠
- ✅ 系统更稳定
- ✅ 错误更少

### 运维改善

- ✅ 日志更清晰
- ✅ 问题诊断更快
- ✅ 性能监控完整
- ✅ 告警更及时

---

## 🔧 需要的工具和依赖

```bash
# 邮件队列
npm install bull redis

# 日志
npm install winston

# 性能测试
npm install --save-dev @playwright/test autocannon

# 可选：性能分析
npm install clinic
```

---

## ✅ 成功标准

第二阶段完成时：

- ✅ 所有 API 响应时间 < 200ms
- ✅ 邮件可靠性 > 99%
- ✅ 数据库查询优化 (无 N+1)
- ✅ 权限缓存实现
- ✅ 日志规范化
- ✅ 匹配算法可配置
- ✅ 关键流程 E2E 测试
- ✅ 性能基准测试通过
- ✅ 零回归

---

## 🎯 下一步

准备开始？让我知道您想从哪个任务开始！

**建议顺序**:
1. 🟢 **查询优化** (影响最大)
2. 🟡 **邮件系统** (用户体验)
3. 🟡 **缓存** (性能)
4. 🟢 **日志** (可维护性)
5. 🟢 **参数化** (灵活性)
6. 🔵 **E2E 测试** (可选但推荐)

---

**状态**: 准备开始  
**预计耗时**: 3-5 天  
**复杂度**: 🟡 中等

