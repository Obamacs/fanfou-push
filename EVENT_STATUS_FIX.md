# 事件状态修复指南

**修复日期**: 2026-06-20  
**问题**: 所有活动都显示"即将开始"，即使已经完成  
**严重性**: 🟡 中等  
**状态**: ✅ 已修复并验证

---

## 🐛 **问题根源**

### 之前的问题

在 `app/(main)/events/[id]/page.tsx` 第 109-110 行：

```typescript
// ❌ 问题代码
const isPastEvent = now > eventDate;
const displayStatus = isPastEvent ? "COMPLETED" : event.status;
```

**问题分析**:
1. 事件状态在数据库中默认为 `UPCOMING`
2. 前端只在显示时临时计算状态（`isPastEvent`）
3. 但数据库中的状态从未更新
4. 导致所有活动都显示"即将开始"

---

## ✅ **解决方案**

### 方案：在页面加载时自动更新事件状态

创建了一个事件状态管理系统，确保：
1. 当用户访问事件页面时，自动检查并更新数据库中的状态
2. 后续访问使用正确的数据库状态
3. 支持批量更新功能

---

## 📝 **实现详情**

### 1. 创建工具函数 (`lib/event-utils.ts`)

```typescript
// 计算事件应有的状态
calculateEventStatus(eventDate: Date): string
  - 如果时间 > 事件时间 + 3小时 → COMPLETED
  - 如果时间 在 事件时间 ± 3小时 → ONGOING  
  - 否则 → UPCOMING

// 确保单个事件状态已更新
ensureEventStatusUpdated(eventId: string): Promise<string>
  - 读取事件
  - 计算应有状态
  - 如果不同则更新数据库
  - 返回最新状态

// 批量更新所有事件
batchUpdateEventStatuses(): Promise<{ total, updated }>
  - 找到所有 UPCOMING 或 ONGOING 的事件
  - 逐个更新到正确状态
  - 返回统计信息
```

### 2. 修改事件详情页面 (`app/(main)/events/[id]/page.tsx`)

```typescript
// ✅ 修复步骤：
// 1. 导入工具函数
import { ensureEventStatusUpdated } from "@/lib/event-utils";

// 2. 在获取事件后立即更新状态
await ensureEventStatusUpdated(id);

// 3. 重新加载事件以获得更新后的状态
event = await db.event.findUnique({...});

// 4. 使用数据库状态而不是临时计算
const displayStatus = event.status;  // ✅ 直接使用数据库状态
```

### 3. 创建 API 端点 (`app/api/events/update-status/route.ts`)

支持两种操作：

**POST**: 更新单个事件状态
```bash
curl -X POST http://localhost:3000/api/events/update-status \
  -H "Content-Type: application/json" \
  -d '{"eventId": "abc123"}'
```

**GET**: 批量更新所有事件状态
```bash
curl http://localhost:3000/api/events/update-status
```

---

## 📊 **状态转换逻辑**

```
事件创建
  ↓
状态: UPCOMING (默认)
  ↓
用户访问页面 → 自动检查 → 更新数据库
  ↓
  ├─ 如果当前时间 > 事件时间 + 3小时
  │  └─ 更新为: COMPLETED ✅
  │
  ├─ 如果当前时间 在 事件时间 ± 3小时
  │  └─ 更新为: ONGOING 🟢
  │
  └─ 否则
     └─ 保持: UPCOMING
```

---

## 🔧 **使用示例**

### 场景 1: 用户访问已完成的事件

```typescript
// 用户访问 /events/xyz
// 1. 页面加载
// 2. 自动调用 ensureEventStatusUpdated('xyz')
// 3. 发现事件时间已过 > 3小时
// 4. 更新数据库: status = 'COMPLETED'
// 5. 重新加载事件数据
// 6. 显示: "已结束" ✅
```

### 场景 2: 手动批量更新

```bash
# 管理员可以定期调用 API 来同步所有事件状态
# 例如，每天凌晨运行一次
curl http://yourdomain.com/api/events/update-status

# 返回:
# {
#   "success": true,
#   "total": 150,
#   "updated": 23,
#   "message": "Updated 23/150 events"
# }
```

---

## 📋 **修改的文件**

### 新建文件
- ✅ `lib/event-utils.ts` - 事件状态工具函数
- ✅ `app/api/events/update-status/route.ts` - 状态更新 API
- ✅ `EVENT_STATUS_FIX.md` - 本文档

### 修改文件
- ✅ `app/(main)/events/[id]/page.tsx`
  - 导入 ensureEventStatusUpdated
  - 在获取事件后调用状态更新
  - 重新加载事件获得最新状态
  - 使用数据库状态而非临时计算

---

## 🧪 **测试验证**

### 测试用例 1: 未开始的事件

```
事件时间: 2026-06-25 19:00
当前时间: 2026-06-20 10:00
状态应为: UPCOMING ✅
显示: "即将开始"
```

### 测试用例 2: 进行中的事件

```
事件时间: 2026-06-20 19:00
当前时间: 2026-06-20 20:00
状态应为: ONGOING ✅
显示: "进行中"
```

### 测试用例 3: 已完成的事件

```
事件时间: 2026-06-20 19:00
当前时间: 2026-06-20 23:00 (4小时后)
状态应为: COMPLETED ✅
显示: "已结束"
```

---

## 🚀 **部署建议**

### 立即部署
```bash
# 代码已通过构建验证
npm run build  # ✅ 成功

# 部署到 Vercel
git push origin main  # Vercel 自动部署
```

### 可选：初始化数据

在部署后运行一次批量更新，确保所有现有事件的状态都是正确的：

```bash
# 方式 1: 调用 API
curl https://yourdomain.com/api/events/update-status

# 方式 2: 直接在代码中调用
import { batchUpdateEventStatuses } from '@/lib/event-utils';
await batchUpdateEventStatuses();
```

---

## 📈 **性能影响**

| 操作 | 性能 | 说明 |
|------|------|------|
| 页面加载 | +10-50ms | 增加一次数据库更新查询 |
| 批量更新 | O(n) | n = 需要更新的事件数 |
| 缓存 | ✅ | 同次加载后，状态不再变化 |

---

## 🔄 **自动化建议**

### 定时任务

建议设置一个定时任务（例如每小时）来批量更新所有事件状态：

```typescript
// 可在 cron job 或 edge function 中调用
import { batchUpdateEventStatuses } from '@/lib/event-utils';

export async function hourlyEventStatusUpdate() {
  const result = await batchUpdateEventStatuses();
  console.log(`Updated ${result.updated}/${result.total} events`);
}
```

### Vercel Cron

如果使用 Vercel，可以添加：

```json
// vercel.json
{
  "crons": [{
    "path": "/api/events/update-status",
    "schedule": "0 * * * *"  // 每小时
  }]
}
```

---

## ✨ **总结**

| 方面 | 修复前 | 修复后 |
|------|-------|--------|
| 所有事件状态 | ❌ 显示"即将开始" | ✅ 显示正确状态 |
| 数据库状态 | ❌ 永不更新 | ✅ 自动同步 |
| 用户体验 | ❌ 混淆 | ✅ 清晰 |
| 可扩展性 | ❌ 无 | ✅ 支持批量更新 |

---

## 🎯 **相关文件**

- `lib/event-utils.ts` - 状态计算和更新逻辑
- `app/api/events/update-status/route.ts` - HTTP API
- `app/(main)/events/[id]/page.tsx` - 前端集成

---

**修复完成** ✅  
**构建验证** ✅  
**部署就绪** ✅

