#!/bin/bash

# Telegram功能开发环境设置脚本
# 使用方法: bash setup.sh

echo "🚀 Telegram功能开发环境设置"
echo "================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "README.md" ]; then
    echo "❌ 错误: 请在telegram-feature目录中运行此脚本"
    exit 1
fi

echo "📁 当前目录: $(pwd)"
echo ""

# 创建项目结构
echo "📦 创建项目目录结构..."
mkdir -p bot/{handlers,middleware,config}
mkdir -p web/{src,public}
mkdir -p docs tests

# 创建git仓库（如果不存在）
if [ ! -d ".git" ]; then
    echo "🔧 初始化Git仓库..."
    git init
    git remote add origin https://github.com/gyc567/nofx.git 2>/dev/null || echo "远程仓库已存在"
    git checkout -b feature/telegram-integration 2>/dev/null || echo "分支已存在"
fi

# 创建基础文件
echo "📝 创建基础文件..."

# Bot配置示例
cat > bot/config/bot.config.js << 'EOF'
// Telegram Bot配置
module.exports = {
  token: process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN',
  webhook: {
    url: process.env.WEBHOOK_URL || 'https://your-domain.com/webhook',
    port: process.env.PORT || 3000
  },
  admins: [
    // 添加管理员用户ID
  ]
};
EOF

# Web配置示例
cat > web/.env.example << 'EOF'
# Telegram Bot配置
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEBHOOK_URL=https://your-domain.com/webhook
PORT=3000

# 数据库配置（如果需要）
DATABASE_URL=your_database_url
EOF

# Git忽略文件
cat > .gitignore << 'EOF'
# 依赖
node_modules/
__pycache__/
*.pyc

# 环境变量
.env
.env.local
.env.*.local

# 日志
logs/
*.log
npm-debug.log*

# 操作系统
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# 部署
dist/
build/
EOF

echo ""
echo "✅ 设置完成!"
echo ""
echo "📋 接下来的步骤:"
echo "1. 编辑 bot/config/bot.config.js 添加你的Bot Token"
echo "2. 运行 'npm init -y' 初始化Node.js项目（如果开发Node.js）"
echo "3. 安装依赖: 'npm install telegraf' 或 'pip install python-telegram-bot'"
echo "4. 开始开发你的Telegram功能!"
echo ""
echo "📚 更多信息请查看 README.md"
