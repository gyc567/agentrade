#!/bin/bash

# 用户列表API测试脚本
# 使用说明:
# 1. 首先使用管理员账户登录获取token
# 2. 然后使用token调用用户列表API

API_URL="https://nofx-gyc567.replit.app/api"

echo "========================================="
echo "用户列表API测试脚本"
echo "========================================="

# 步骤1: 管理员登录
echo -e "\n📝 步骤1: 管理员登录..."
echo "请输入管理员邮箱: (默认: gyc567@gmail.com)"
read -p "邮箱: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-gyc567@gmail.com}

echo "请输入密码: (默认: eric8577HH)"
read -s ADMIN_PASSWORD
ADMIN_PASSWORD=${ADMIN_PASSWORD:-eric8577HH}

LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 登录失败!"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ 登录成功!"
echo "Token: ${TOKEN:0:50}..."

# 步骤2: 测试用户列表API
echo -e "\n📝 步骤2: 获取用户列表..."

# 测试2.1: 基本查询
echo -e "\n2.1 基本查询..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_URL}/users" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 测试2.2: 分页查询
echo -e "\n2.2 分页查询 (page=1, limit=10)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_URL}/users?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 测试2.3: 搜索查询
echo -e "\n2.3 搜索查询 (search=gmail)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_URL}/users?search=gmail" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 测试2.4: 排序查询
echo -e "\n2.4 排序查询 (sort=email, order=asc)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_URL}/users?sort=email&order=asc" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 步骤3: 错误情况测试
echo -e "\n📝 步骤3: 错误情况测试..."

# 测试3.1: 未认证访问
echo -e "\n3.1 未认证访问 (期望401)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_URL}/users" | jq '.'

# 测试3.2: 无效token
echo -e "\n3.2 无效token (期望401)..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_URL}/users" \
  -H "Authorization: Bearer invalid_token" | jq '.'

echo -e "\n========================================="
echo "测试完成!"
echo "========================================="

# 显示用户总数
echo -e "\n📊 当前系统用户总数:"
curl -s "${API_URL}/users?limit=1" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.pagination.total'
