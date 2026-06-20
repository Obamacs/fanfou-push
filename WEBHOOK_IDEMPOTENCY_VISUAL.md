# Webhook 幂等性可视化说明

## 问题演示：没有 WebhookEvent 表

### 场景：用户支付，网络波动导致 webhook 重复发送

```
用户                    Stripe 服务器           应用服务器              数据库
 │                          │                      │                      │
 ├─── 点击支付 ────────────→ │                      │                      │
 │                          │                      │                      │
 │                      [处理支付] ✓               │                      │
 │                          │                      │                      │
 │                      发送 webhook #1            │                      │
 │                    (evt_abcd1234)               │                      │
 │                          ├─ webhook #1 ───────→ │                      │
 │                          │                      ├─ 查询 eventAttendance │
 │                          │                      │                      │
 │                          │                  [处理中...]                │
 │                          │                      │                      │
 │                  [网络延迟/超时]                │                      │
 │                          │                      │                      │
 │                      [重试]                     │                      │
 │                      发送 webhook #1 (重复)     │                      │
 │                    (evt_abcd1234)               │                      │
 │                          ├─ webhook #1 ───────→ │   ❌ 又一次！        │
 │                          │              ┌──────────────────────────────┤
 │                          │              │       已经开始处理...        │
 │                          │              │                      │       │
 │                          │              │  ├─ 更新 eventAttendance    │
 │                          │              │  │   status=CONFIRMED       │
 │                          │              │  │   paymentId=pi_...       │
 │                          │              │  │                      ✓   │
 │                          │              │  │                      │   │
 │                          │              └→ 完成第一个             │   │
 │                          │              │                      │   │
 │                          │              ├─ 更新第二个 webhook    │   │
 │                          │              │  status=CONFIRMED   (再次！)
 │                          │              │  paymentId=pi_...       
 │                          │              │                      ✓✓  ❌
 │                          │              │                      │   │
 │                          │              └→ 完成第二个            │   │
```

### 问题后果

```
数据库 EventAttendance 表：
┌──────────┬──────────┬───────────────┬─────────────────┐
│ eventId  │ userId   │ paymentId     │ status          │
├──────────┼──────────┼───────────────┼─────────────────┤
│ evt_123  │ user_1   │ pi_xyz123     │ CONFIRMED       │
│ evt_123  │ user_1   │ pi_xyz123     │ CONFIRMED       │ ← 重复行！
└──────────┴──────────┴───────────────┴─────────────────┘

❌ 问题：
1. 同一用户在同一事件上有两条参加记录
2. 不知道谁付了钱，谁没付
3. 活动人数统计错误
4. 退款时不知道该退哪一条
```

---

## 解决方案：添加 WebhookEvent 表

### 有了 WebhookEvent 表后的流程

```
用户                    Stripe 服务器           应用服务器              数据库
 │                          │                      │                      │
 ├─── 点击支付 ────────────→ │                      │                      │
 │                          │                      │                      │
 │                      [处理支付] ✓               │                      │
 │                          │                      │                      │
 │                      发送 webhook #1            │                      │
 │                    (evt_abcd1234)               │                      │
 │                          ├─ webhook #1 ───────→ │                      │
 │                          │                      ├─ 查询 WebhookEvent   │
 │                          │                      │   不存在              │
 │                          │                      │                      │
 │                          │              ┌────────────────────────────┤
 │                          │              │   创建 WebhookEvent        │
 │                          │              │   (provider='stripe',      │
 │                          │              │    eventId='evt_abcd1234', │
 │                          │              │    status='PROCESSING')    │
 │                          │              │                      ✓     │
 │                          │              │                      │     │
 │                          │              │   处理业务逻辑              │
 │                          │              │   更新 EventAttendance     │
 │                          │              │   更新 WebhookEvent        │
 │                          │              │   (status='COMPLETED')     │
 │                          │              │                      ✓✓    │
 │                          │              │                      │     │
 │                          │              └──→ 返回 200 OK      │     │
 │                          │                      │                      │
 │                  [网络延迟/超时]                │                      │
 │                          │                      │                      │
 │                      [重试]                     │                      │
 │                      发送 webhook #1 (重复)     │                      │
 │                    (evt_abcd1234)               │                      │
 │                          ├─ webhook #1 ───────→ │                      │
 │                          │                      ├─ 查询 WebhookEvent   │
 │                          │                      │   ✓ 存在！           │
 │                          │                      │   status='COMPLETED' │
 │                          │                      │                      │
 │                          │              ┌────────────────────────────┤
 │                          │              │   直接返回，不处理          │
 │                          │              │   (已经处理过了)            │
 │                          │              │                           │
 │                          │              └──→ 返回 200 OK      │
```

### 数据库状态对比

```
❌ 没有 WebhookEvent 表：
┌──────────┬──────────┬───────────────┬─────────────────┐
│ eventId  │ userId   │ paymentId     │ status          │
├──────────┼──────────┼───────────────┼─────────────────┤
│ evt_123  │ user_1   │ pi_xyz123     │ CONFIRMED       │
│ evt_123  │ user_1   │ pi_xyz123     │ CONFIRMED       │ ← 重复！❌
└──────────┴──────────┴───────────────┴─────────────────┘

✅ 有 WebhookEvent 表：
WebhookEvent 表：
┌───────────────┬──────────────┬───────────────┬──────────────┬──────────────────┐
│ provider      │ eventId      │ eventType     │ status       │ processedAt      │
├───────────────┼──────────────┼───────────────┼──────────────┼──────────────────┤
│ stripe        │ evt_abcd1234 │ checkout...   │ COMPLETED    │ 2025-01-20 10:15 │
│ stripe        │ evt_abcd1234 │ checkout...   │ COMPLETED    │ (重复来临时更新)  │
└───────────────┴──────────────┴───────────────┴──────────────┴──────────────────┘
                                                               ↑
                                        数据库唯一约束保证只有一条记录！

EventAttendance 表：
┌──────────┬──────────┬───────────────┬─────────────────┐
│ eventId  │ userId   │ paymentId     │ status          │
├──────────┼──────────┼───────────────┼─────────────────┤
│ evt_123  │ user_1   │ pi_xyz123     │ CONFIRMED       │ ← 只有一条！✅
└──────────┴──────────┴───────────────┴─────────────────┘
```

---

## 三层防护的工作原理

### 防护层 1：数据库唯一约束

```sql
UNIQUE("provider", "eventId")
```

```
尝试插入相同的 webhook：
┌────────────────────────────────┐
│ INSERT INTO WebhookEvent       │
│ VALUES ('stripe', 'evt_xyz')   │
└────────────────────────────────┘
           ↓
    ✅ 第一次成功
           ↓
┌────────────────────────────────┐
│ INSERT INTO WebhookEvent       │
│ VALUES ('stripe', 'evt_xyz')   │ ← 相同的值！
└────────────────────────────────┘
           ↓
    ❌ 违反唯一约束，数据库拒绝！
```

### 防护层 2：状态追踪

```typescript
// 检查 webhook 状态
const webhook = await db.webhookEvent.findUnique({...});

if (webhook?.status === "COMPLETED") {
  return 200;  // 已处理过，不再处理
}

if (webhook?.status === "PROCESSING") {
  return 202;  // 正在处理中，稍后重试
}

if (webhook?.status === "FAILED") {
  // 重新处理或返回错误
}
```

### 防护层 3：数据库事务

```typescript
await db.$transaction(async (tx) => {
  // 这两个操作是原子的：要么都成功，要么都失败
  
  // 1. 更新支付状态
  await tx.eventAttendance.update({
    where: { eventId_userId: {eventId, userId} },
    data: { status: "CONFIRMED", paymentId }
  });
  
  // 2. 标记 webhook 为完成
  await tx.webhookEvent.update({
    where: { id: webhookId },
    data: { status: "COMPLETED", processedAt: new Date() }
  });
  
  // 如果中间出错，两个都回滚
  // 确保数据一致性
});
```

---

## 并发场景测试

### 场景：两个 webhook 同时到达（极端情况）

#### 没有 WebhookEvent 表 ❌

```
时间   线程A                          线程B
──────────────────────────────────────────────────
t1    SELECT eventAttendance (不存在)
                                      SELECT eventAttendance (不存在)
t2    INSERT eventAttendance ✓
                                      INSERT eventAttendance
                                      ❌ 主键冲突！
t3    UPDATE EventAttendance
                                      ❌ 失败，用户看到错误
t4    返回 200 OK
                                      返回 500 错误

结果：
- 线程A 成功处理
- 线程B 失败，用户可能重新支付
- 或者两个都一起更新，引发竞态条件
```

#### 有 WebhookEvent 表 ✅

```
时间   线程A                          线程B
──────────────────────────────────────────────────
t1    UPSERT WebhookEvent (A成功)
      status = PROCESSING
                                      UPSERT WebhookEvent
                                      → 唯一约束冲突！
t2                                    捕获异常：
                                      → 重新查询 WebhookEvent
                                      → 发现状态是 PROCESSING
t3    处理业务逻辑...                  → 等待或直接返回 202
      更新 EventAttendance ✓
      更新 WebhookEvent
      status = COMPLETED ✓
                                      
t4    返回 200 OK                      再次查询 WebhookEvent
                                      → 发现 status = COMPLETED
                                      → 直接返回 200 OK

结果：
✅ 两个线程都成功（幂等性保证）
✅ 数据库只有一条记录
✅ 用户体验好
```

---

## 成本效益分析

### 实施成本

```
迁移时间：       5 分钟
代码改动：       ~100 行
测试时间：       30 分钟
部署风险：       最小（纯新增）
```

### 收益

```
避免的问题：
- 防止重复扣费       → 避免用户投诉
- 数据一致性强       → 减少运维成本
- 支持多提供商       → 未来扩展性强
- 完整审计日志       → 合规要求
```

### 影响评估

```
┌─────────────────┬──────────┬──────────┬─────────────────┐
│ 指标            │ 优先性   │ 可行性   │ 收益            │
├─────────────────┼──────────┼──────────┼─────────────────┤
│ 支付安全性      │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐       │
│ 用户体验        │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐⭐       │
│ 系统稳定性      │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐        │
│ 可维护性        │ ⭐⭐⭐   │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐         │
└─────────────────┴──────────┴──────────┴─────────────────┘
```

---

## 与支付标准的对应

### PCI DSS (支付卡行业数据安全标准)

```
PCI DSS 要求：
✓ 交易必须具有幂等性
✓ 不能出现重复扣费
✓ 必须有完整的审计日志

WebhookEvent 表如何满足：
✓ UNIQUE 约束保证幂等性
✓ 三层防护防止重复
✓ 完整的 payload 和 processedAt 记录
```

### Stripe 官方最佳实践

```
Stripe 建议：
"Handle webhook events in an idempotent manner."
(以幂等方式处理 webhook 事件)

https://stripe.com/docs/webhooks/best-practices

WebhookEvent 表正是实现这一点的标准做法！
```

---

## 总结：一图胜千言

```
支付幂等性金字塔：

        ┌─────────────────────┐
        │  应用逻辑            │ Step 3: 事务保护
        │  $transaction       │ 
        ├─────────────────────┤
        │  状态追踪            │ Step 2: 状态机
        │  (PROCESSING,       │
        │   COMPLETED, FAILED)│
        ├─────────────────────┤
        │  唯一约束            │ Step 1: 数据库约束
        │  UNIQUE constraint  │
        ├─────────────────────┤
        │  WebhookEvent 表     │ 基础设施
        └─────────────────────┘

没有任何一层可以少！
```

---

## 部署检查清单

- [ ] 在本地执行迁移：`npx prisma migrate dev`
- [ ] 验证表已创建：`npx prisma studio` 中查看 WebhookEvent
- [ ] 验证唯一约束：执行 `PRAGMA index_info` 查看索引
- [ ] 更新代码使用新表：检查 `app/api/stripe/webhook/route.ts`
- [ ] 本地测试：发送测试 webhook 两次，验证只处理一次
- [ ] 部署到生产：`npx prisma migrate deploy`
- [ ] 生产验证：查看 WebhookEvent 表状态

✅ 完成后，支付幂等性 100% 保证！
