# Telegram功能开发指南

## 🎯 项目概述

本目录用于开发Telegram相关功能，包括Telegram Bot、Web界面等。

## 🏗️ 架构设计

### 目录结构

```
telegram-feature/
├── bot/                    # Telegram Bot核心
│   ├── handlers/           # 命令处理器
│   │   ├── start.js        # /start命令
│   │   ├── help.js         # /help命令
│   │   └── ...
│   ├── middleware/         # 中间件
│   ├── config/             # 配置文件
│   └── index.js            # Bot入口文件
├── web/                    # Web界面（可选）
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/                   # 文档
├── tests/                  # 测试
├── setup.sh                # 环境设置脚本
├── README.md               # 项目说明
└── DEVELOPMENT.md          # 本文件
```

## 🚀 快速开始

### 1. 环境设置

```bash
# 进入项目目录
cd /Users/guoyingcheng/dreame/code/nofx/telegram-feature

# 运行设置脚本
bash setup.sh
```

### 2. 创建Telegram Bot

1. 在Telegram中搜索 [@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 命令
3. 按照指示创建Bot并获取Token
4. 将Token添加到 `bot/config/bot.config.js`

### 3. 开发Bot功能

#### 创建命令处理器

**bot/handlers/start.js**
```javascript
const { Telegraf } = require('telegraf');

const startHandler = (ctx) => {
  ctx.reply('欢迎使用Telegram Bot! 👋');
};

module.exports = startHandler;
```

#### 集成到Bot

**bot/index.js**
```javascript
const { Telegraf } = require('telegraf');
const config = require('./config/bot.config');
const startHandler = require('./handlers/start');

const bot = new Telegraf(config.token);

bot.start(startHandler);
bot.launch();

// 优雅关闭
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

### 4. Web界面开发（可选）

如果你需要Web界面：

```bash
# 安装依赖
npm install express telegraf

# 或使用现有的web项目
cp -r /Users/guoyingcheng/dreame/code/nofx/web/* web/
```

## 📚 功能示例

### 基础命令

```javascript
// /start 命令
bot.start((ctx) => {
  ctx.reply('欢迎! 🎉');
});

// /help 命令
bot.help((ctx) => {
  ctx.reply('可用的命令:\n/start - 开始\n/help - 帮助');
});

// 文本消息处理
bot.on('text', (ctx) => {
  ctx.reply(`你说了: ${ctx.message.text}`);
});
```

### 键盘按钮

```javascript
bot.hears('hi', (ctx) => {
  ctx.reply(
    '选择操作:',
    {
      reply_markup: {
        keyboard: [
          ['📊 查看数据'],
          ['⚙️ 设置']
        ],
        resize_keyboard: true
      }
    }
  );
});
```

### 文件处理

```javascript
bot.on('document', async (ctx) => {
  const file = await ctx.telegram.getFile(ctx.message.document.file_id);
  console.log('文件下载链接:', file.link);
  ctx.reply('文件已接收! 📁');
});
```

## 🔧 配置

### 环境变量

创建 `.env` 文件：

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEBHOOK_URL=https://your-domain.com/webhook
PORT=3000
DATABASE_URL=your_database_url
```

### Webhook配置

```javascript
const bot = new Telegraf(config.token);

// 设置Webhook
bot.telegram.setWebhook(config.webhook.url);

// 处理Webhook
bot.webhookCallback('/webhook');

// 启动Web服务器
const express = require('express');
const app = express();
app.use(bot.webhookCallback('/webhook'));
app.listen(config.webhook.port);
```

## 🧪 测试

### 单元测试

```javascript
// tests/bot.test.js
const { Telegraf } = require('telegraf');
const test = require('ava');

test('start command', async (t) => {
  const bot = new Telegraf('TOKEN');
  bot.start((ctx) => {
    t.is(ctx.message.text, '/start');
  });

  await bot.handleUpdate({
    message: { text: '/start', from: {} },
    update_id: 1
  });
});
```

### 运行测试

```bash
npm test
# 或
ava tests/
```

## 📤 部署

### 本地部署

```bash
node bot/index.js
```

### 服务器部署

```bash
# 使用PM2
pm2 start bot/index.js --name telegram-bot

# 使用Docker
docker build -t telegram-bot .
docker run -d telegram-bot
```

### Vercel部署

```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 🔍 调试

### 启用调试模式

```javascript
const bot = new Telegraf(config.token, {
  telegram: { agent: false },
  channelMode: true
});

// 启用详细日志
bot.use(Telegraf.log());
```

### 常见问题

**Q: Bot无法接收消息**
A: 检查Token是否正确，Bot是否已启动

**Q: Webhook不工作**
A: 确保URL可访问，使用HTTPS协议

**Q: 消息发送失败**
A: 检查API限制，添加错误处理

```javascript
bot.catch((err, ctx) => {
  console.error('Bot错误:', err);
  ctx.reply('抱歉，出现了一些问题 😞');
});
```

## 📚 参考资源

- [Telegram Bot API文档](https://core.telegram.org/bots/api)
- [Telegraf文档](https://telegraf.js.org/)
- [BotFather](https://t.me/BotFather)
- [示例Bot代码](https://github.com/telegraf/telegraf/tree/develop/examples)

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**祝你开发愉快! 🎉**
