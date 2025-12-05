#!/bin/bash

# NOFX API 测试脚本
# 使用方法: ./test-api.sh [API_URL]
# 示例: ./test-api.sh https://your-deployment.repl.co

# 默认使用本地开发环境
API_URL="${1:-http://localhost:8080}"

echo "=========================================="
echo "NOFX API 测试"
echo "API地址: $API_URL"
echo "=========================================="
echo

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -e "${YELLOW}测试: $name${NC}"
    echo "请求: $method $API_URL$endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ 成功 (HTTP $http_code)${NC}"
        echo "响应: $body" | head -c 500
        echo
    else
        echo -e "${RED}✗ 失败 (HTTP $http_code)${NC}"
        echo "响应: $body"
    fi
    
    echo
    echo "----------------------------------------"
    echo
}

# 1. 健康检查
echo "====== 健康检查 ======"
test_endpoint "根路径健康检查" "GET" "/"
test_endpoint "API健康检查" "GET" "/api/health"

# 2. 系统配置
echo "====== 系统配置 ======"
test_endpoint "获取系统配置" "GET" "/api/config"
test_endpoint "获取支持的AI模型" "GET" "/api/supported-models"
test_endpoint "获取支持的交易所" "GET" "/api/supported-exchanges"

# 3. 提示词模板
echo "====== 提示词模板 ======"
test_endpoint "获取提示词模板列表" "GET" "/api/prompt-templates"

# 4. 交易员管理（Admin模式下无需认证）
echo "====== 交易员管理 ======"
test_endpoint "获取我的交易员列表" "GET" "/api/my-traders"
test_endpoint "获取公开交易员排行榜" "GET" "/api/traders"
test_endpoint "获取Top5交易员" "GET" "/api/top-traders"

# 5. AI模型配置
echo "====== AI模型配置 ======"
test_endpoint "获取AI模型配置" "GET" "/api/models"

# 6. 交易所配置
echo "====== 交易所配置 ======"
test_endpoint "获取交易所配置" "GET" "/api/exchanges"

echo "=========================================="
echo "测试完成！"
echo "=========================================="
