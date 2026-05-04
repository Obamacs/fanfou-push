# 🗄️ 饭否数据库部署报告

**部署日期**: 2026-05-04  
**数据库**: Supabase PostgreSQL  
**地址**: `aws-0-eu-west-1.pooler.supabase.com:5432`  
**数据库**: `postgres`  
**Schema**: `public`

---

## ✅ 部署状态

- ✅ **Prisma Schema** - 完全同步
- ✅ **所有表** - 已创建
- ✅ **索引** - 已创建
- ✅ **关系** - 已配置
- ✅ **测试数据** - 已初始化

---

## 📊 数据库表清单

### 核心认证与用户 (Core Auth & Users)
| 表名 | 说明 | 记录数 |
|------|------|--------|
| `User` | 用户信息 | ~10 |
| `Account` | OAuth 账号关联 | - |
| `Session` | 登录会话 | - |

### 用户档案 (User Profile)
| 表名 | 说明 |
|------|------|
| `Interest` | 兴趣标签库 |
| `UserInterest` | 用户-兴趣关联 |
| `QuestionnaireQuestion` | 问卷问题库 |
| `QuestionnaireAnswer` | 用户问卷回答 |

### 活动 (Events)
| 表名 | 说明 |
|------|------|
| `Event` | 活动信息 |
| `EventAttendance` | 活动参加记录 |

### 匹配 (Matching)
| 表名 | 说明 |
|------|------|
| `Match` | 匹配组 |
| `MatchMember` | 匹配成员 |

### 互动 (Interactions)
| 表名 | 说明 |
|------|------|
| `Rating` | 用户评分 |
| `Report` | 举报记录 |
| `Block` | 黑名单 |
| `Message` | 聊天消息 |
| `DirectMessage` | 私信记录 |

---

## 🔑 关键字段配置

### User 表
```sql
-- 主要字段
id (CUID)
email (UNIQUE)
name
city
ageGroup
gender
isOnboarded (默认: false)
isActive (默认: true)
isBanned (默认: false)
role (USER/ADMIN)
canCreateEvents (默认: false)

-- 位置字段
latitude
longitude
lastLocationUpdate

-- 个人信息
relationshipGoal
smokingHabit
drinkingHabit
wantsChildren
avatarUrl
bio

-- 时间戳
createdAt
updatedAt
```

### Event 表
```sql
id (CUID)
title
type
city
address
date
maxAttendees
priceAmount
description
imageUrl
status (UPCOMING/ONGOING/COMPLETED/CANCELLED)
creatorId (FK -> User)
createdAt
updatedAt
```

### Match 表
```sql
id (CUID)
status (PENDING/CONFIRMED/EXPIRED/CANCELLED)
city
ageGroup
expiresAt
createdAt
updatedAt
```

---

## 🔐 索引配置

```sql
-- User 表索引
CREATE INDEX "User_email_idx" ON "User"(email)
CREATE INDEX "User_city_idx" ON "User"(city)
CREATE INDEX "User_isActive_idx" ON "User"(isActive)
CREATE INDEX "User_isBanned_idx" ON "User"(isBanned)

-- Event 表索引
CREATE INDEX "Event_creatorId_idx" ON "Event"(creatorId)
CREATE INDEX "Event_city_idx" ON "Event"(city)
CREATE INDEX "Event_status_idx" ON "Event"(status)

-- MatchMember 表索引
CREATE INDEX "MatchMember_userId_idx" ON "MatchMember"(userId)
CREATE INDEX "MatchMember_matchId_idx" ON "MatchMember"(matchId)

-- QuestionnaireQuestion 表索引
CREATE INDEX "QuestionnaireQuestion_order_idx" ON "QuestionnaireQuestion"("order")
```

---

## 📈 初始化数据

### 已创建的账号
```
1. 管理员账号
   邮箱: admin@fanfou.com
   密码: Admin123456
   角色: ADMIN
   权限: 完全管理权限

2. 测试账号 (演示用户)
   邮箱: demo@fanfou.com
   密码: Test123456
   角色: USER
   状态: 未完成onboarding

3. 演示账号 (已完成onboarding)
   邮箱: test@example.com
   密码: Test123456
   角色: USER
   状态: 已完成onboarding
```

### 初始化数据
- ✅ 3 个测试用户
- ✅ 3 个问卷问题（含菜系、口味、饮食）
- ✅ 示例兴趣标签（需完整初始化）
- ✅ Supabase Storage Bucket (avatars)

---

## 🔗 连接信息

### Supabase 项目
- **项目 ID**: lwercdnrvxrsnjjvojfx
- **地区**: 欧洲（eu-west-1）
- **主机**: aws-0-eu-west-1.pooler.supabase.com
- **端口**: 5432
- **数据库**: postgres

### 环境变量
```bash
DATABASE_URL="postgresql://postgres.[project-id]:password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_[anon-key]
SUPABASE_SERVICE_ROLE_KEY=sb_secret_[service-role-key]
```

---

## ✅ 验证清单

- [x] Prisma Schema 已同步
- [x] 所有表已创建
- [x] 索引已创建
- [x] 外键约束已配置
- [x] 管理员账户已创建
- [x] 测试账户已创建
- [x] 问卷数据已初始化
- [x] Storage Bucket 已创建
- [x] 环境变量已配置
- [x] 连接已验证

---

## 🚀 后续步骤

1. **完整兴趣标签初始化** - 导入完整的兴趣类别库
2. **示例数据创建** - 创建示例活动和匹配
3. **备份配置** - 设置 Supabase 自动备份
4. **性能监控** - 配置数据库查询日志和监控
5. **容量规划** - 根据预期用户数调整连接池大小

---

**状态**: ✅ 数据库部署完成

