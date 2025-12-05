# 🚀 Telegram功能开发 - 快速开始指南

## ✅ 环境已准备就绪!

您的Telegram功能开发工作区已成功创建在:
```
/Users/guoyingcheng/dreame/code/nofx/telegram-feature
```

## 📂 已创建的文件

```
telegram-feature/
├── 📄 README.md              # 项目总体说明
├── 📄 DEVELOPMENT.md         # 详细开发指南
├── 📄 GETTING_STARTED.md     # 本文件 - 快速开始
├── 🔧 setup.sh               # 环境设置脚本
├── 🔄 init-git.sh            # Git工作树初始化脚本
├── .git/info.txt             # Git工作树信息
├── bot/                      # (待创建) Telegram Bot目录
│   ├── handlers/             # 命令处理器目录
│   ├── middleware/           # 中间件目录
│   └── config/               # 配置文件目录
├── web/                      # (待创建) Web界面目录
│   ├── src/
│   └── public/
├── docs/                     # (待创建) 文档目录
└── tests/                    # (待创建) 测试目录
```

## 🎯 接下来要做什么

### 方法1: 使用Git分支（推荐）

```bash
# 1. 进入项目根目录
cd /Users/guoyingcheng/dreame/code/nofx

# 2. 创建并切换到telegram功能分支
git checkout -b feature/telegram-integration

# 3. 进入telegram-feature目录
cd telegram-feature

# 4. 运行初始化脚本（可选）
bash init-git.sh

# 5. 复制web项目文件（如果你需要Web界面）
# cp -r /Users/guoyingcheng/dreame/code/nofx/web/* .

# 6. 开始开发!
```

### 方法2: 独立开发

```bash
# 1. 直接在telegram-feature目录工作
cd /Users/guoyingcheng/dreame/code/nofx/telegram-feature

# 2. 运行设置脚本
bash setup.sh

# 3. 创建Telegram Bot
# 编辑 bot/config/bot.config.js

# 4. 安装依赖
npm init -y
npm install telegraf express

# 5. 开始开发
```

## 🛠️ 快速开发步骤

### 步骤1: 创建Telegram Bot

1. 在Telegram中找到 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 命令
3. 按照提示创建Bot并获取 **Token**
4. 将Token保存到安全的地方

### 步骤2: 配置Bot

编辑 `bot/config/bot.config.js`:

```javascript
module.exports = {
  token: '你的_bot_token_在这里',
  webhook: {
    url: 'https://你的域名.com/webhook',
    port: 3000
  },
  admins: [
    // 添加管理员用户ID
  ]
};
```

### 步骤3: 开发Bot功能

创建 `bot/index.js`:

```javascript
const { Telegraf } = require('telegraf');
const config = require('./config/bot.config');

const bot = new Telegraf(config.token);

bot.start((ctx) => {
  ctx.reply('欢迎使用Telegram Bot! 🎉');
});

bot.help((ctx) => {
  ctx.reply('可用的命令:\n/start - 开始\n/help - 帮助');
});

bot.launch();

// 优雅关闭
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

### 步骤4: 运行Bot

```bash
node bot/index.js
```

## 📚 学习资源

### 📖 文档
- [README.md](README.md) - 项目概览
- [DEVELOPMENT.md](DEVELOPMENT.md) - 详细开发指南
- [Telegram Bot API](https://core.telegram.org/bots/api) - 官方文档
- [Telegraf.js](https://telegraf.js.org/) - Node.js Bot框架

### 💡 示例代码

**基础命令**:
```javascript
bot.command('start', (ctx) => ctx.reply('Hello!'));
```

**键盘按钮**:
```javascript
bot.hears('hi', (ctx) => {
  ctx.reply('选择操作:', {
    reply_markup: {
      keyboard: [['📊 数据'], ['⚙️ 设置']]
    }
  });
});
```

**文件处理**:
```javascript
bot.on('document', (ctx) => ctx.reply('文件已接收! 📁'));
```

## 🎨 项目结构建议

```
telegram-feature/
├── bot/
│   ├── index.js              # Bot入口
│   ├── config/
│   │   └── bot.config.js     # Bot配置
│   ├── handlers/
│   │   ├── start.js          # /start命令
│   │   ├── help.js           # /help命令
│   │   └── data.js           # 数据查询命令
│   └── middleware/
│       └── auth.js           # 认证中间件
├── web/                      # Web界面（可选）
│   ├── src/
│   └── public/
└── database/                 # 数据库（如果需要）
    └── models/
```

## 🔧 常用命令

```bash
# 查看文件状态
git status

# 添加文件
git add .

# 提交更改
git commit -m "feat: 添加新的bot功能"

# 推送到远程
git push origin feature/telegram-integration

# 切换回main分支
git checkout main

# 合并telegram功能
git merge feature/telegram-integration
```

## 🐛 故障排除

**Q: Bot无法启动**
```
A: 检查：
   1. Token是否正确
   2. 网络连接是否正常
   3. 依赖是否安装 (npm install)
```

**Q: 消息发送失败**
```
A: 检查：
   1. Bot是否有发送消息的权限
   2. API限制（发送太频繁）
   3. 添加错误处理
```

**Q: Git冲突**
```
A: 解决：
   1. git status 查看冲突
   2. 手动合并冲突文件
   3. git add . 标记已解决
   4. git commit -m "resolve conflicts"
```

## 🎉 祝你开发愉快!

有任何问题，请查看：
- [DEVELOPMENT.md](DEVELOPMENT.md) - 详细开发指南
- 主项目文档: `/Users/guoyingcheng/dreame/code/nofx/README.md`
- OpenSpec目录: `/Users/guoyingcheng/dreame/code/nofx/openspec/`

---

**下一步**: 选择一种方法开始开发，然后运行你的第一个Telegram Bot! 🤖
