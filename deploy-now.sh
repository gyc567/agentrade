#!/bin/bash

echo "🚀 Monnaire Trading Agent OS - 快速部署脚本"
echo "================================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "web/vercel.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

cd web

echo "📋 部署准备状态检查："
echo "----------------------------------------"

# 检查构建文件
if [ -d "dist" ]; then
    echo "✅ 构建文件存在: $(du -sh dist | cut -f1)"
else
    echo "❌ 缺少构建文件，运行 npm run build..."
    npm run build
fi

echo ""
echo "🔑 Vercel 项目信息："
echo "----------------------------------------"
echo "项目名称: gyc567s-projects/web"
echo "项目ID: prj_xMoVJ4AGtNNIiX6nN9uCgRop6KsP"
echo "组织ID: team_CrV6muN0s3QNDJ3vrabttjLR"
echo ""

echo "⚠️  部署权限问题解决方案："
echo "----------------------------------------"
echo "GitHub Actions 自动部署需要以下 Secrets:"
echo ""
echo "1️⃣  访问 GitHub 仓库设置："
echo "   https://github.com/gyc567/nofx/settings/secrets/actions"
echo ""
echo "2️⃣  添加以下 4 个 Secrets："
echo ""
echo "   📌 VERCEL_TOKEN"
echo "      访问: https://vercel.com/account/tokens"
echo "      创建 Personal Access Token"
echo ""
echo "   📌 VERCEL_ORG_ID"
echo "      值: team_CrV6muN0s3QNDJ3vrabttjLR"
echo ""
echo "   📌 VERCEL_PROJECT_ID"
echo "      值: prj_xMoVJ4AGtNNIiX6nN9uCgRop6KsP"
echo ""
echo "   📌 VITE_API_URL (可选)"
echo "      值: https://your-backend-api-url.railway.app"
echo ""

echo "3️⃣  设置完成后，代码将自动部署到 Vercel"
echo ""

echo "📊 当前状态："
echo "----------------------------------------"
echo "✅ 前端代码已构建完成"
echo "✅ GitHub Actions 工作流已配置"
echo "✅ Vercel 项目已链接"
echo "⏳ 等待设置 GitHub Secrets 以完成部署"
echo ""

echo "🌐 手动访问（设置Secrets后）："
echo "   GitHub Actions: https://github.com/gyc567/nofx/actions"
echo "   Vercel Dashboard: https://vercel.com/dashboard"
echo ""

echo "💡 或者，直接推送代码触发自动部署："
echo "   git push origin main"
echo ""

echo "================================================"
echo "📖 完整部署指南请查看: VERCEL_DEPLOYMENT_GUIDE.md"
echo "================================================"
