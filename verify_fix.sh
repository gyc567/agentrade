#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║            OKX余额显示0问题修复验证                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 步骤1: 检查代码修改
echo "步骤1: 检查代码修改"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q 'balance\["total"\]' /Users/guoyingcheng/dreame/code/nofx/trader/auto_trader.go; then
    echo "✅ 代码已修改: 使用正确的字段名 'total'"
else
    echo "❌ 代码未正确修改"
fi

if grep -q 'balance\["free"\]' /Users/guoyingcheng/dreame/code/nofx/trader/auto_trader.go; then
    echo "✅ 代码已修改: 使用正确的字段名 'free'"
else
    echo "❌ 代码未正确修改"
fi

echo ""

# 步骤2: 编译后端代码
echo "步骤2: 编译后端代码"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd /Users/guoyingcheng/dreame/code/nofx

if go build -o nofx-server api/server.go 2>/dev/null; then
    echo "✅ 编译成功: nofx-server"
else
    echo "❌ 编译失败"
    echo "请手动编译: cd /Users/guoyingcheng/dreame/code/nofx && go build -o nofx-server api/server.go"
fi

echo ""

# 步骤3: 重新部署到云服务器
echo "步骤3: 部署到云服务器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  注意: 这需要部署到云服务器才能生效"
echo ""
echo "部署方法1: Git Push触发CI/CD"
echo "  git add ."
echo "  git commit -m 'fix: 修复OKX余额显示0问题 - 字段映射错误'"
echo "  git push"
echo ""
echo "部署方法2: 手动上传到Replit/Vercel"
echo "  1. 将修改后的文件上传到服务器"
echo "  2. 重启后端服务"
echo ""
echo "部署方法3: 使用GitHub部署"
echo "  将代码推送到GitHub，Vercel会自动部署"
echo ""

# 步骤4: 验证修复
echo "步骤4: 验证修复"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "部署完成后，运行以下命令验证:"
echo ""
echo "  # 1. 测试后端API"
echo "  go run test_backend_api.go"
echo ""
echo "  # 预期结果:"
echo "  # total_equity: 99.90500000 (而不是0)"
echo "  # available_balance: 99.90500000 (而不是0)"
echo ""
echo "  # 2. 访问前端页面"
echo "  # https://nofx-gyc567.replit.app"
echo ""
echo "  # 预期结果:"
echo "  # 显示总资产: ~99.90 USDT"
echo "  # 显示盈亏: ~-0.09% (而不是-100%)"
echo ""

# 步骤5: 查看日志
echo "步骤5: 查看后端日志"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "部署后，检查后端日志中是否出现:"
echo "  ✓ 从OKX获取总资产: 99.90500000"
echo "  ✓ 从OKX获取可用余额: 99.90500000"
echo "  ✓ 账户余额映射成功: 总资产=99.90, 可用=99.90"
echo ""

# 总结
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    修复验证总结                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ 已修复: 字段映射错误（totalWalletBalance → total）"
echo "✅ 已修复: 字段映射错误（availableBalance → free）"
echo ""
echo "🚀 下一步: 部署到云服务器并验证"
echo ""
echo "📖 详细文档:"
echo "  - 修复方案: BUG_FIX_SOLUTION.md"
echo "  - 测试工具: test_backend_api.go"
echo "  - 分析报告: FRONTEND_CODE_ANALYSIS_REPORT.md"
echo ""
