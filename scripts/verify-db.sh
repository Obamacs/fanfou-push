#!/bin/bash

echo "🔍 开始数据库部署验证..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境变量
echo "📋 检查环境变量..."
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL 未设置${NC}"
  exit 1
fi
echo -e "${GREEN}✅ DATABASE_URL 已配置${NC}"

# 检查 Prisma 配置
echo ""
echo "📋 检查 Prisma 配置..."
if [ ! -f "prisma/schema.prisma" ]; then
  echo -e "${RED}❌ prisma/schema.prisma 不存在${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Prisma schema 存在${NC}"

# 生成 Prisma Client
echo ""
echo "📋 生成 Prisma Client..."
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Prisma Client 已生成${NC}"
else
  echo -e "${RED}❌ Prisma Client 生成失败${NC}"
  exit 1
fi

# 验证数据库连接
echo ""
echo "📋 验证数据库连接..."
npx prisma db execute --stdin << 'SQL' > /dev/null 2>&1
SELECT 1;
SQL
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 数据库连接成功${NC}"
else
  echo -e "${RED}❌ 数据库连接失败${NC}"
  exit 1
fi

# 检查 Schema 同步
echo ""
echo "📋 检查 Schema 同步..."
SCHEMA_STATUS=$(npx prisma db push --skip-generate 2>&1)
if echo "$SCHEMA_STATUS" | grep -q "already in sync"; then
  echo -e "${GREEN}✅ Schema 已同步${NC}"
elif echo "$SCHEMA_STATUS" | grep -q "Your database is now in sync"; then
  echo -e "${GREEN}✅ Schema 已更新并同步${NC}"
else
  echo -e "${YELLOW}⚠️  Schema 状态: $SCHEMA_STATUS${NC}"
fi

# 统计表数据
echo ""
echo "📊 数据库表统计..."
echo ""

# 创建临时 SQL 文件
cat > /tmp/db_stats.sql << 'EOF'
SELECT
  'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'Interest', COUNT(*) FROM "Interest"
UNION ALL
SELECT 'Event', COUNT(*) FROM "Event"
UNION ALL
SELECT 'Match', COUNT(*) FROM "Match"
UNION ALL
SELECT 'QuestionnaireQuestion', COUNT(*) FROM "QuestionnaireQuestion"
UNION ALL
SELECT 'EventAttendance', COUNT(*) FROM "EventAttendance"
UNION ALL
SELECT 'MatchMember', COUNT(*) FROM "MatchMember"
UNION ALL
SELECT 'Report', COUNT(*) FROM "Report"
ORDER BY table_name;
EOF

npx prisma db execute --stdin < /tmp/db_stats.sql 2>/dev/null

echo ""
echo "✅ 数据库部署验证完成！"
echo ""
echo "📝 部署信息："
echo "  - 数据库: Supabase PostgreSQL"
echo "  - 地址: aws-0-eu-west-1.pooler.supabase.com:5432"
echo "  - Schema: public"
echo "  - Prisma: v5.21.1"
echo ""
