#!/bin/bash

# 测试注册和登录流程

BASE_URL="https://timelefts.vercel.app"

echo "🧪 开始测试注册和登录流程..."
echo ""

# 测试账户信息
TEST_EMAIL="testuser_$(date +%s)@fanfou.com"
TEST_PASSWORD="TestPassword123"
TEST_NAME="测试用户"

echo "📝 测试账户信息："
echo "  邮箱: $TEST_EMAIL"
echo "  密码: $TEST_PASSWORD"
echo "  名字: $TEST_NAME"
echo ""

# 1. 测试注册
echo "1️⃣ 测试注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"name\": \"$TEST_NAME\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "   响应: $REGISTER_RESPONSE"
echo ""

# 2. 测试登录
echo "2️⃣ 测试登录..."
echo "   访问登录页面: $BASE_URL/login"
echo "   使用邮箱: $TEST_EMAIL"
echo "   使用密码: $TEST_PASSWORD"
echo ""

echo "✅ 测试完成！"
echo ""
echo "📌 注意："
echo "   - 如果注册成功，应该看到 'message': '注册成功'"
echo "   - 然后在登录页面用上面的邮箱和密码登录"
echo "   - 登录成功后应该跳转到 onboarding 页面"
