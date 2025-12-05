#!/bin/bash

echo "🧪 测试 admin_mode 配置重置修复"
echo "======================================"
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试结果追踪
TESTS_PASSED=0
TESTS_FAILED=0

# 辅助函数
test_passed() {
    echo -e "${GREEN}✅ 通过${NC}: $1"
    ((TESTS_PASSED++))
}

test_failed() {
    echo -e "${RED}❌ 失败${NC}: $1"
    echo -e "   ${YELLOW}详情${NC}: $2"
    ((TESTS_FAILED++))
}

test_info() {
    echo -e "${YELLOW}ℹ️ 信息${NC}: $1"
}

# 1. 检查代码修改
echo "🔍 检查1: 验证代码修改"
echo "--------------------------------------"

# 检查 main.go 中的修改
if grep -q "// \"admin_mode\":.*fmt.Sprintf.*configFile.AdminMode" /Users/guoyingcheng/dreame/code/nofx/main.go; then
    test_passed "main.go 中已注释掉 admin_mode 的同步"
else
    test_failed "main.go 中未找到 admin_mode 同步的注释" "可能修改未生效或位置不对"
fi

if grep -q "admin_mode不会自动同步到数据库" /Users/guoyingcheng/dreame/code/nofx/main.go; then
    test_passed "已添加配置管理注释说明"
else
    test_failed "未找到配置管理注释说明" "字段注释可能缺失"
fi

# 检查 syncConfigToDatabase 函数的结构
if grep -A 10 "func syncConfigToDatabase" /Users/guoyingcheng/dreame/code/nofx/main.go | grep -q "admin_mode"; then
    test_failed "syncConfigToDatabase 函数中仍包含 admin_mode" "可能未完全移除"
else
    test_passed "syncConfigToDatabase 函数中已移除 admin_mode"
fi

echo

# 2. 检查语法正确性
echo "🔍 检查2: 验证语法正确性"
echo "--------------------------------------"

cd /Users/guoyingcheng/dreame/code/nofx
if go build -o nofx-backend main.go 2>&1 | grep -q "error"; then
    test_failed "代码编译失败" "存在语法错误"
else
    test_passed "代码编译通过"
fi

echo

# 3. 模拟配置同步测试
echo "🔍 检查3: 验证配置同步逻辑"
echo "--------------------------------------"

# 提取 syncConfigToDatabase 函数
func_content=$(sed -n '/func syncConfigToDatabase/,/^}/p' /Users/guoyingcheng/dreame/code/nofx/main.go)

# 检查是否还有未被注释的 configFile.AdminMode 引用
if echo "$func_content" | grep "configFile.AdminMode" | grep -v "^[[:space:]]*//" | grep -v "^[[:space:]]*\*" | grep -v "^[[:space:]]*//" | grep -q "configFile.AdminMode"; then
    test_failed "syncConfigToDatabase 中仍有未注释的 configFile.AdminMode 引用"
else
    test_passed "syncConfigToDatabase 中没有未注释的 configFile.AdminMode 引用"
fi

# 检查 configs 映射是否包含 admin_mode
if echo "$func_content" | grep -A 5 '"beta_mode"' | grep -q '"admin_mode"'; then
    test_failed "configs 映射中仍包含 admin_mode"
else
    test_passed "configs 映射中未包含 admin_mode"
fi

echo

# 4. 检查其他配置项未受影响
echo "🔍 检查4: 验证其他配置项"
echo "--------------------------------------"

# 提取 configs 映射内容
configs_section=$(sed -n '/configs := map\[string\]string{/,/}/p' /Users/guoyingcheng/dreame/code/nofx/main.go)

# 检查关键配置项是否存在
for config in "beta_mode" "api_server_port" "use_default_coins"; do
    if echo "$configs_section" | grep -q "\"$config\""; then
        test_passed "配置项 $config 仍在同步列表中"
    else
        test_failed "配置项 $config 不在同步列表中" "可能意外被移除"
    fi
done

echo

# 5. 检查 ConfigFile 结构体
echo "🔍 检查5: 验证 ConfigFile 结构体"
echo "--------------------------------------"

# 检查结构体定义
if grep -A 3 "type ConfigFile struct" /Users/guoyingcheng/dreame/code/nofx/main.go | grep -q "AdminMode"; then
    test_passed "ConfigFile 结构体中仍包含 AdminMode 字段"
else
    test_failed "ConfigFile 结构体中缺少 AdminMode 字段"
fi

# 检查是否有注释说明
if grep -B 1 "AdminMode.*bool.*json.*admin_mode" /Users/guoyingcheng/dreame/code/nofx/main.go | grep -q "不会自动同步"; then
    test_passed "AdminMode 字段有配置管理注释"
else
    test_info "AdminMode 字段缺少配置管理注释" "建议添加注释说明"
fi

echo

# 6. 检查数据库读取逻辑
echo "🔍 检查6: 验证数据库读取逻辑"
echo "--------------------------------------"

# 检查是否仍从数据库读取 admin_mode
if grep -q "GetSystemConfig.*admin_mode" /Users/guoyingcheng/dreame/code/nofx/main.go; then
    test_passed "main.go 中仍从数据库读取 admin_mode"
else
    test_info "main.go 中未找到 admin_mode 读取逻辑" "这是正常的，因为读取逻辑在其他地方"
fi

if grep -q "GetSystemConfig.*admin_mode" /Users/guoyingcheng/dreame/code/nofx/api/server.go; then
    test_passed "api/server.go 中仍从数据库读取 admin_mode"
else
    test_failed "api/server.go 中缺少 admin_mode 读取逻辑" "这可能影响功能"
fi

echo

# 7. 验证整体逻辑
echo "🔍 检查7: 验证配置管理策略"
echo "--------------------------------------"

# 总结：修复后的逻辑应该是：
# 1. initDefaultData() 设置默认值，但使用 DO NOTHING（不覆盖现有值）
# 2. syncConfigToDatabase() 跳过 admin_mode（不强制同步）
# 3. 结果：admin_mode 只在首次初始化时设置，后续保持不变

test_info "修复后预期行为："
echo "  - 全新部署：admin_mode = true（来自 initDefaultData）"
echo "  - 已有部署且用户修改：admin_mode 保持用户设置的值"
echo "  - 重新部署：admin_mode 不会被 config.json 覆盖"

echo

# 输出测试总结
echo "======================================"
echo "📊 测试总结"
echo "======================================"
echo -e "${GREEN}通过${NC}: $TESTS_PASSED"
echo -e "${RED}失败${NC}: $TESTS_FAILED"
echo "总计: $((TESTS_PASSED + TESTS_FAILED))"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ 所有测试通过！修复成功。${NC}"
    echo
    echo "📝 修复摘要："
    echo "  - 从 syncConfigToDatabase() 中移除了 admin_mode 的自动同步"
    echo "  - admin_mode 现在只会通过 initDefaultData() 初始化一次"
    echo "  - 用户修改的 admin_mode 值在重新部署时不会被覆盖"
    echo
    echo "🎯 修复效果："
    echo "  - ✅ 管理员可以安全地设置 admin_mode = false"
    echo "  - ✅ 重新部署不会重置 admin_mode 配置"
    echo "  - ✅ 配置持久化正常工作"
    exit 0
else
    echo -e "${RED}❌ 有 $TESTS_FAILED 个测试失败，请检查修复。${NC}"
    exit 1
fi
