#!/bin/bash

# 密码重置功能测试脚本
# 用于测试Resend邮件集成

echo "🧪 密码重置功能测试"
echo "===================="
echo ""

# 配置
API_URL="http://localhost:8080"
TEST_EMAIL="test@example.com"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📋 测试配置:"
echo "  API URL: $API_URL"
echo "  测试邮箱: $TEST_EMAIL"
echo ""

# 测试1: 请求密码重置
echo "📧 测试1: 请求密码重置"
echo "------------------------"
echo "发送请求到: POST $API_URL/api/request-password-reset"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/request-password-reset" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP状态码: $HTTP_CODE"
echo "响应内容: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 测试1通过: API返回200 OK${NC}"
else
    echo -e "${RED}❌ 测试1失败: 期望200，实际$HTTP_CODE${NC}"
fi

echo ""
echo "📝 检查项:"
echo "  1. 检查服务器日志，应该看到:"
echo "     ✅ 密码重置邮件已发送 - 收件人: $TEST_EMAIL"
echo ""
echo "  2. 检查邮箱 $TEST_EMAIL"
echo "     - 查看收件箱"
echo "     - 查看垃圾邮件文件夹"
echo ""
echo "  3. 邮件内容应包含:"
echo "     - 重置密码按钮"
echo "     - 重置链接"
echo "     - 过期时间提示（1小时）"
echo "     - 安全提示"
echo ""

# 测试2: 无效邮箱格式
echo "📧 测试2: 无效邮箱格式"
echo "------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/request-password-reset" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✅ 测试2通过: 正确拒绝无效邮箱${NC}"
else
    echo -e "${YELLOW}⚠️  测试2: HTTP $HTTP_CODE (期望400)${NC}"
fi

echo ""
echo "🎯 测试完成"
echo "===================="
echo ""
echo "📊 下一步:"
echo "  1. 查看服务器日志确认邮件发送状态"
echo "  2. 检查邮箱收到的邮件"
echo "  3. 点击邮件中的重置链接测试完整流程"
echo "  4. 在Resend Dashboard查看发送记录: https://resend.com/emails"
echo ""
