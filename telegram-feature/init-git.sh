#!/bin/bash

# 初始化Git工作树脚本
# 这个脚本会将当前目录设置为git worktree

set -e

echo "🔧 Git工作树初始化脚本"
echo "=============================="
echo ""

# 检查是否在telegram-feature目录
if [[ ! "$PWD" =~ "telegram-feature" ]]; then
    echo "⚠️  警告: 当前不在telegram-feature目录"
    echo "请确保你在 /Users/guoyingcheng/dreame/code/nofx/telegram-feature 目录中运行此脚本"
    echo ""
fi

# 检查主项目git目录
MAIN_GIT_DIR="/Users/guoyingcheng/dreame/code/nofx/.git"
if [ ! -d "$MAIN_GIT_DIR" ]; then
    echo "❌ 错误: 找不到主项目git目录: $MAIN_GIT_DIR"
    echo "请确保从主项目目录运行此脚本"
    exit 1
fi

echo "📍 主项目git目录: $MAIN_GIT_DIR"
echo ""

# 获取主项目的当前分支和commit
cd /Users/guoyingcheng/dreame/code/nofx
MAIN_BRANCH=$(git rev-parse --abbrev-ref HEAD)
MAIN_COMMIT=$(git rev-parse HEAD)

echo "📋 主项目信息:"
echo "  分支: $MAIN_BRANCH"
echo "  提交: $MAIN_COMMIT"
echo ""

# 检查是否已经是worktree
if [ -f ".git" ]; then
    if [ -L ".git" ]; then
        echo "✅ 检测到这是一个git worktree"
        WORKTREE_DIR=$(readlink .git)
        echo "   指向: $WORKTREE_DIR"
    else
        echo "⚠️  警告: 这是一个完整的git仓库，不是worktree"
        echo "   这可能会导致提交冲突"
    fi
fi

echo ""
echo "🔄 正在创建worktree配置..."

# 创建.git文件（如果不存在）
if [ ! -e ".git" ]; then
    # 创建.git文件指向主仓库
    echo "gitdir: $MAIN_GIT_DIR/worktrees/telegram-feature" > .git
    echo "✅ 创建.git文件"
fi

# 创建worktree配置目录
WORKTREE_CONFIG_DIR="$MAIN_GIT_DIR/worktrees/telegram-feature"
mkdir -p "$WORKTREE_CONFIG_DIR"

# 创建worktree配置
cat > "$WORKTREE_CONFIG_DIR/config" << EOF
[core]
	worktree = /Users/guoyingcheng/dreame/code/nofx/telegram-feature
[extensions]
	worktree = true
EOF

# 创建HEAD文件指向新分支
HEAD_FILE="$WORKTREE_CONFIG_DIR/HEAD"
if [ ! -f "$HEAD_FILE" ]; then
    cat > "$HEAD_FILE" << EOF
ref: refs/heads/feature/telegram-integration
EOF
    echo "✅ 创建HEAD文件"
fi

echo ""
echo "🔀 设置Git分支..."

# 切换到主项目目录设置分支
cd /Users/guoyingcheng/dreame/code/nofx

# 检查分支是否已存在
if git show-ref --verify --quiet refs/heads/feature/telegram-integration; then
    echo "ℹ️  分支 feature/telegram-integration 已存在"
else
    echo "📝 创建新分支 feature/telegram-integration"
    git checkout -b feature/telegram-integration
fi

# 切换回telegram-feature目录
cd /Users/guoyingcheng/dreame/code/nofx/telegram-feature

# 检出到当前目录
echo "📦 检出文件到当前目录..."
git --git-dir=/Users/guoyingcheng/dreame/code/nofx/.git --work-tree=. checkout feature/telegram-integration -- . 2>/dev/null || true

echo ""
echo "✅ Git工作树初始化完成!"
echo ""
echo "📊 工作树信息:"
echo "  主项目: /Users/guoyingcheng/dreame/code/nofx"
echo "  工作树: /Users/guoyingcheng/dreame/code/nofx/telegram-feature"
echo "  分支: feature/telegram-integration"
echo "  提交: $MAIN_COMMIT"
echo ""
echo "📝 接下来的操作:"
echo "1. cd /Users/guoyingcheng/dreame/code/nofx/telegram-feature"
echo "2. git status   # 查看文件状态"
echo "3. git branch   # 查看当前分支"
echo "4. 开始开发你的Telegram功能! 🚀"
echo ""

# 可选：复制web项目文件
echo "🤔 是否要复制web项目文件到当前目录？ (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "📋 复制web文件..."
    cp -r /Users/guoyingcheng/dreame/code/nofx/web/* . 2>/dev/null || echo "部分文件可能已存在"
    echo "✅ 文件复制完成"
fi

echo ""
echo "🎉 准备就绪! 开始开发吧!"
