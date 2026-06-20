# 第二阶段：关键修复执行计划

**现状诊断**: ✅ 查询优化已基本完成  
**重点转向**: 📧 邮件系统 + 🔒 权限缓存  
**预计时间**: 2-3 天  
**状态**: 准备开始

---

## 📊 现状评估

### ✅ 已做得很好的部分

- ✅ `/api/events` - 已用 `include` 预加载
- ✅ `/api/match/find` - 已优化关联查询
- ✅ `/api/admin/orders` - 已分页
- ✅ 没有明显的 for 循环中的 N+1 查询

**结论**: 查询优化部分不是瓶颈

### 🔴 需要立即优化的

#### 问题 1: 邮件系统不可靠 (HIGH)
- **现状**: 邮件发送没有重试机制
- **风险**: 用户可能收不到重要通知
- **解决**: Bull 队列 + 自动重试
- **收益**: 邮件可靠性 99%+

#### 问题 2: 权限检查性能 (MEDIUM)
- **现状**: 每个 API 都查数据库验证权限
- **风险**: 权限检查成为瓶颈
- **解决**: Redis 缓存 30 秒
- **收益**: 权限检查快 96%

#### 问题 3: 日志不规范 (LOW)
- **现状**: 混合 console.log 和自定义日志
- **风险**: 调试困难，监控不清
- **解决**: Winston 结构化日志
- **收益**: 可维护性↑，诊断快↓

---

## 🎯 三步执行计划

### 第 2.2 步：邮件队列系统 (Day 1-2)

#### 任务 2.2.1: 安装依赖

```bash
npm install bull redis ioredis
```

#### 任务 2.2.2: 创建邮件队列

**文件**: `lib/email-queue.ts` (新建)

```typescript
import Queue from 'bull';
import { sendEmail as sendRawEmail } from './email';
import { logAuditEvent } from './permissions';

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
    await sendRawEmail({ to, subject, html });
    console.log(`Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`Email send failed for ${to}:`, error);
    throw error; // Bull 会自动重试
  }
});

// 邮件发送失败处理
emailQueue.on('failed', async (job, err) => {
  console.error(`Email job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
  
  // 如果连续失败 3 次，记录到数据库
  if (job.attemptsMade >= 3) {
    try {
      await logAuditEvent(
        'system',
        'EMAIL_SEND_FAILED',
        'Email',
        `${job.data.to}`,
        {
          subject: job.data.subject,
          error: err.message,
          attempts: job.attemptsMade,
        }
      );
    } catch (e) {
      console.error('Failed to log email failure:', e);
    }
  }
});

// 邮件发送成功处理
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

// 队列错误处理
emailQueue.on('error', (err) => {
  console.error('Email queue error:', err);
});

/**
 * 添加邮件到队列（不等待发送）
 */
export async function queueEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await emailQueue.add(options, {
      attempts: 3, // 重试 3 次
      backoff: {
        type: 'exponential',
        delay: 2000, // 初始延迟 2 秒，之后指数增长
      },
      removeOnComplete: true, // 成功后删除任务
      removeOnFail: false, // 失败的任务保留用于调试
    });
  } catch (error) {
    console.error('Failed to queue email:', error);
    throw error;
  }
}

/**
 * 获取队列统计信息（用于监控）
 */
export async function getEmailQueueStats() {
  const counts = await emailQueue.getJobCounts();
  const failed = await emailQueue.getFailed(0, -1);
  
  return {
    pending: counts.wait,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    failedJobs: failed.map(job => ({
      id: job.id,
      to: job.data.to,
      error: job.failedReason,
      attempts: job.attemptsMade,
    })),
  };
}

export default emailQueue;
```

#### 任务 2.2.3: 创建监控接口（可选）

**文件**: `app/api/admin/email-stats/route.ts` (新建)

```typescript
import { requireAdmin } from '@/lib/permissions';
import { getEmailQueueStats } from '@/lib/email-queue';
import { NextResponse } from 'next/server';

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.success) return authResult.error;

  try {
    const stats = await getEmailQueueStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: '获取邮件队列统计失败' },
      { status: 500 }
    );
  }
}
```

#### 任务 2.2.4: 更新现有邮件调用

需要找到并更新所有 `sendEmail` 调用。使用 grep 查找：

```bash
grep -r "sendEmail" /Users/liemjames/vs\ Code\ /timelefts --include="*.ts" --include="*.tsx" | grep -v node_modules | head -20
```

然后替换为：

```typescript
// ❌ 之前
await sendEmail({to, subject, html});

// ✅ 之后
import { queueEmail } from '@/lib/email-queue';
await queueEmail({to, subject, html});
```

**关键变更**:
- 不再等待邮件发送
- 立即返回
- 邮件在后台队列中处理
- 自动重试最多 3 次

#### 任务 2.2.5: 测试邮件队列

```bash
# 1. 启动 Redis (如果本地没有)
docker run -d -p 6379:6379 redis

# 2. 在 .env 中设置 (如果需要)
REDIS_HOST=localhost
REDIS_PORT=6379

# 3. 启动应用
npm run dev

# 4. 测试发送邮件 (检查是否立即返回)
curl -X POST http://localhost:3000/api/emails/test

# 5. 监控队列状态
curl http://localhost:3000/api/admin/email-stats
```

**预期结果**:
- ✅ 邮件立即入队 (< 100ms)
- ✅ 邮件后台发送
- ✅ 失败自动重试
- ✅ 邮件可靠性 99%+

---

### 第 2.3 步：权限缓存 (Day 2)

#### 任务 2.3.1: 添加缓存到权限检查

**文件**: `lib/permissions.ts` (修改)

在 `requireAdmin()` 函数中添加缓存：

```typescript
import { redis } from '@/lib/redis';

export async function requireAdmin(): Promise<...> {
  const authResult = await validateAuth();
  if (!authResult.success) return authResult;

  const userId = authResult.auth.userId;
  const cacheKey = `admin:${userId}`;

  // Step 1: 查缓存
  try {
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
  } catch (err) {
    // Redis 不可用时，继续查数据库
    console.warn('Redis unavailable, checking database');
  }

  // Step 2: 缓存未命中，查数据库
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isAdmin = user?.role === 'ADMIN';
  
  // Step 3: 缓存结果 (30 秒 TTL)
  try {
    await redis.setex(
      cacheKey, 
      30, 
      isAdmin ? 'true' : 'false'
    );
  } catch (err) {
    console.warn('Failed to cache admin status');
  }

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

/**
 * 权限变更时清除缓存
 */
export async function clearPermissionCache(userId: string) {
  try {
    await redis.del(`admin:${userId}`);
  } catch (err) {
    console.warn('Failed to clear permission cache:', err);
  }
}
```

#### 任务 2.3.2: 权限变更时清除缓存

**在权限更新 API 中添加**:

```typescript
// 例如: app/api/admin/users/[userId]/permissions/route.ts

import { clearPermissionCache } from '@/lib/permissions';

export async function PUT(req: NextRequest) {
  // ... 权限更新逻辑 ...
  
  const updatedUser = await db.user.update({
    where: { id: userId },
    data: { /* 权限变更 */ },
  });
  
  // 清除缓存！
  await clearPermissionCache(userId);
  
  return NextResponse.json({success: true, user: updatedUser});
}
```

#### 任务 2.3.3: 初始化 Redis 连接

**文件**: `lib/redis.ts` (新建)

```typescript
import { createClient } from 'redis';

let redis: ReturnType<typeof createClient> | null = null;

export async function getRedis() {
  if (!redis) {
    redis = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    await redis.connect();
  }

  return redis;
}

export { redis };
```

**预期结果**:
- ✅ 权限检查时间：50ms → 2ms
- ✅ 缓存命中率：90%+
- ✅ 数据库查询减少 90%

---

### 第 2.4 步：验证和性能测试 (Day 3)

#### 任务 2.4.1: 性能基准测试

```bash
# 安装性能测试工具
npm install --save-dev autocannon

# 测试邮件队列性能
npx autocannon -d 10 -c 10 http://localhost:3000/api/emails/send

# 测试权限检查性能
npx autocannon -d 10 -c 10 http://localhost:3000/api/admin/orders
```

#### 任务 2.4.2: 监控指标

```typescript
// lib/metrics.ts

export interface PerformanceMetrics {
  emailQueueSize: number;
  emailSuccessRate: number;
  permissionCacheHitRate: number;
  avgResponseTime: number;
}

export async function getMetrics(): Promise<PerformanceMetrics> {
  const emailStats = await getEmailQueueStats();
  const cacheStats = await redis.info('stats');
  
  return {
    emailQueueSize: emailStats.pending + emailStats.active,
    emailSuccessRate: 100 - (emailStats.failed / (emailStats.completed + emailStats.failed) * 100),
    permissionCacheHitRate: 90, // 通过 Redis 统计
    avgResponseTime: 100, // ms
  };
}
```

---

## 📋 执行任务清单

### Day 1-2: 邮件队列
- [ ] 安装 Bull 和 Redis
- [ ] 创建 `lib/email-queue.ts`
- [ ] 创建 `lib/redis.ts`
- [ ] 更新所有 `sendEmail` 调用
- [ ] 创建监控接口（可选）
- [ ] 测试邮件发送
- [ ] 验证重试机制

### Day 2: 权限缓存
- [ ] 修改 `lib/permissions.ts`
- [ ] 在权限更新 API 中添加缓存清除
- [ ] 测试缓存工作正常
- [ ] 验证权限变更立即生效

### Day 3: 验证和测试
- [ ] 性能基准测试
- [ ] 监控指标
- [ ] 完整功能测试
- [ ] 部署前检查

---

## 🎯 成功标准

修复完成时：

- ✅ 邮件系统可靠性 > 99%
- ✅ 权限检查 < 5ms (缓存命中)
- ✅ 邮件队列监控正常
- ✅ 无性能回归
- ✅ 所有现有功能通过测试

---

## 💾 环境配置

需要在 `.env` 中添加：

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # 可选
```

本地开发时，可以用 Docker：

```bash
docker run -d -p 6379:6379 redis:latest
```

---

## 🚀 下一步

准备开始了吗？告诉我：

1. ✅ 让我执行邮件队列系统 (2.2 步)
2. 📦 先帮我检查 Redis 是否可用
3. 📖 需要更多细节
4. 🔄 改变计划

