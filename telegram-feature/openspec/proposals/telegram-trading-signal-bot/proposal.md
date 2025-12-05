# Telegram 交易信号机器人提案

## 提案概述

**提案标题**: 实时交易竞赛冠军信号 Telegram 推送机器人  
**提案类型**: 新功能 / 信号源集成  
**优先级**: P1 (高优先级)  
**预计工作量**: 3-5天  

## 背景与动机

### 当前状况

Monnaire Trading Agent OS 已经集成了多个交易竞赛数据源（如 Binance Leaderboard、OKX Trading Competition 等），可以实时获取顶级交易员的持仓和交易数据。然而，这些数据目前仅在系统内部使用，用户无法便捷地接收实时交易信号通知。

### 业务需求

用户希望能够：
1. 实时接收交易竞赛第一名交易员的开仓和平仓信号
2. 通过 Telegram 群组接收格式化的交易信号
3. 信号包含完整的技术分析和风险管理信息
4. 支持多个交易竞赛源的信号推送

### 使用场景

- **跟单交易**: 用户可以根据顶级交易员的信号进行跟单
- **市场洞察**: 了解顶级交易员的交易逻辑和市场判断
- **学习参考**: 学习专业交易员的风险管理和仓位管理策略
- **社群运营**: 为 Telegram 社群提供高价值的交易信号内容

## 目标

### 主要目标

1. **实时监控交易竞赛冠军的交易动作**
   - 监控开仓信号
   - 监控平仓信号
   - 识别仓位变化

2. **生成专业的交易信号消息**
   - 包含技术分析理由
   - 包含风险管理参数（入场价、止损价、止盈价）
   - 包含盈亏比计算
   - 包含潜在风险提示

3. **推送到指定 Telegram 群组**
   - 支持多个群组配置
   - 支持消息格式自定义
   - 支持推送频率控制

4. **不影响现有系统功能**
   - 作为独立模块运行
   - 不修改现有交易逻辑
   - 可独立启停

## 功能需求

### 1. 交易信号监控模块

#### 1.1 数据源集成

- **支持的竞赛源**:
  - AgenTrade Competition (https://www.agentrade.xyz/competition)
    - 实时交易竞赛排行榜
    - 提供交易员排名、持仓、收益率等数据
    - API 端点：需要通过前端页面分析或 API 抓取

- **监控策略**:
  - 实时轮询 AgenTrade 竞赛排行榜（可配置轮询间隔，默认 30 秒）
  - 识别第一名交易员的 UID 和持仓信息
  - 获取该交易员的详细持仓数据（代币、方向、数量、入场价等）
  - 对比历史持仓快照，识别变化（新开仓、加仓、减仓、平仓）

#### 1.2 信号识别逻辑

- **开仓信号识别**:
  - 新增持仓（之前无持仓，现在有持仓）
  - 加仓（现有持仓数量增加）
  - 识别方向：做多 (LONG) / 做空 (SHORT)

- **平仓信号识别**:
  - 完全平仓（持仓归零）
  - 减仓（持仓数量减少）
  - 计算盈亏情况

- **去重机制**:
  - 避免重复推送相同信号
  - 使用信号指纹（交易员 UID + 代币 + 方向 + 时间戳）
  - 缓存最近 1 小时的已推送信号

### 2. 技术分析生成模块

#### 2.1 AI 分析引擎集成

- **调用 AI 模型生成分析**:
  - 输入：代币名称、当前价格、持仓方向、市场数据
  - 输出：技术分析理由、入场价、止损价、止盈价、风险提示

- **分析维度**:
  - 技术指标分析（RSI、MACD、成交量等）
  - 链上数据分析（活跃地址、大额转账等）
  - 市场情绪分析（社交媒体热度、资金流向等）
  - 关联性分析（BTC 联动、板块轮动等）

#### 2.2 风险管理参数计算

- **入场价计算**:
  - 基于当前价格和技术位（如斐波那契回撤位）
  - 考虑滑点和缓冲（默认 +0.5%）

- **止损价计算**:
  - 基于 ATR（平均真实波幅）
  - 固定风险金额（如 200 美元/仓位）
  - 计算公式：止损距离 = 风险金额 / 仓位大小 + 0.5x ATR

- **止盈价计算**:
  - 基于盈亏比（默认 1:2.5）
  - 基于技术目标位（如斐波那契扩展位 161.8%）

### 3. Telegram 推送模块

#### 3.1 消息格式化

**开仓信号格式**:
```
🚀 合约策略分析

代币：[代币名称，如 BTC]
日期：[当前日期，如 2025-11-26]

📊 理由：
[AI 生成的分析理由，如：
积累：RSI 48（超卖），MACD 金叉，成交量 +15%
催化剂：链上活跃度提升，巨鲸地址增持]

📈 方向：做多 / 做空 / 持仓观望

💰 入场价：$[价格]
理由：基于斐波 38.2% 回撤 + 0.5% 缓冲，1h 图动量确认

🛡️ 止损价：$[价格]
风险计算：200 美元 / 仓位大小 = 距离 + 0.5x ATR 缓冲

🎯 止盈价：$[价格]
目标：盈亏比 1:2.5，基于斐波 161.8% 扩展

⚠️ 潜在风险：
[1 句风险提示，如：BTC 联动回调或监管新闻]

---
📌 信号来源：[竞赛名称] 第一名
⏰ 信号时间：[时间戳]
```

**平仓信号格式**:
```
✅ 平仓信号

代币：[代币名称]
方向：平多 / 平空
平仓价：$[价格]
盈亏：+[百分比]% / -[百分比]%

---
📌 信号来源：[竞赛名称] 第一名
⏰ 信号时间：[时间戳]
```

#### 3.2 Telegram Bot 配置

- **Bot Token 配置**:
  - 通过环境变量或配置文件设置
  - 支持多个 Bot（不同群组使用不同 Bot）

- **群组 ID 配置**:
  - 支持配置多个目标群组
  - 支持群组白名单机制
  - 支持不同群组推送不同竞赛源

- **推送控制**:
  - 支持启用/禁用推送
  - 支持推送频率限制（如每小时最多 10 条）
  - 支持静默时段设置（如凌晨 2-6 点不推送）

#### 3.3 消息发送机制

- **发送策略**:
  - 异步发送，不阻塞主流程
  - 失败重试机制（最多 3 次）
  - 发送队列管理（避免 Telegram API 限流）

- **错误处理**:
  - Bot 被踢出群组
  - API 限流
  - 网络错误
  - 记录错误日志

### 4. 配置管理模块

#### 4.1 配置文件结构

```json
{
  "telegram_bot": {
    "enabled": true,
    "bot_token": "YOUR_BOT_TOKEN",
    "target_groups": [
      {
        "group_id": "-1001234567890",
        "name": "主交易群",
        "enabled": true,
        "competition_sources": ["agentrade_competition"]
      }
    ],
    "rate_limit": {
      "max_messages_per_hour": 10,
      "silent_hours": [2, 3, 4, 5, 6]
    }
  },
  "signal_monitor": {
    "enabled": true,
    "poll_interval_seconds": 30,
    "competition_sources": [
      {
        "name": "agentrade_competition",
        "enabled": true,
        "monitor_rank": 1,
        "api_endpoint": "https://www.agentrade.xyz/competition"
      }
    ],
    "deduplication_window_minutes": 60
  },
  "ai_analysis": {
    "enabled": true,
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

#### 4.2 数据库表设计

**信号记录表** (`telegram_signals`):
```sql
CREATE TABLE telegram_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_fingerprint TEXT UNIQUE NOT NULL,  -- 信号指纹（去重用）
    competition_source TEXT NOT NULL,         -- 竞赛来源
    trader_uid TEXT NOT NULL,                 -- 交易员 UID
    symbol TEXT NOT NULL,                     -- 代币符号
    direction TEXT NOT NULL,                  -- 方向（LONG/SHORT/CLOSE）
    entry_price REAL,                         -- 入场价
    stop_loss REAL,                           -- 止损价
    take_profit REAL,                         -- 止盈价
    analysis_reason TEXT,                     -- 分析理由
    risk_warning TEXT,                        -- 风险提示
    sent_to_groups TEXT,                      -- 已发送的群组 ID（JSON 数组）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fingerprint (signal_fingerprint),
    INDEX idx_created_at (created_at)
);
```

**推送日志表** (`telegram_push_logs`):
```sql
CREATE TABLE telegram_push_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    signal_id INTEGER NOT NULL,               -- 关联信号 ID
    group_id TEXT NOT NULL,                   -- 群组 ID
    message_id TEXT,                          -- Telegram 消息 ID
    status TEXT NOT NULL,                     -- 状态（success/failed）
    error_message TEXT,                       -- 错误信息
    retry_count INTEGER DEFAULT 0,            -- 重试次数
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (signal_id) REFERENCES telegram_signals(id),
    INDEX idx_signal_id (signal_id),
    INDEX idx_created_at (created_at)
);
```

### 5. 监控与日志模块

#### 5.1 运行状态监控

- **健康检查**:
  - Bot 连接状态
  - 竞赛数据源可用性
  - AI 模型响应时间
  - 推送成功率

- **性能指标**:
  - 信号识别延迟
  - 消息推送延迟
  - 每小时推送数量
  - 错误率

#### 5.2 日志记录

- **信号日志**:
  - 记录所有识别的信号
  - 记录信号生成过程
  - 记录 AI 分析结果

- **推送日志**:
  - 记录所有推送操作
  - 记录成功/失败状态
  - 记录错误详情

- **系统日志**:
  - 记录模块启停
  - 记录配置变更
  - 记录异常情况

## 技术架构

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Signal Bot                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│ Signal Monitor│    │  AI Analysis   │    │   Telegram   │
│    Module     │───▶│     Engine     │───▶│ Push Module  │
└───────────────┘    └────────────────┘    └──────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│  Competition  │    │   AI Model     │    │  Telegram    │
│  Data Source  │    │   (GPT-4)      │    │     API      │
└───────────────┘    └────────────────┘    └──────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│                      Database                              │
│  - telegram_signals                                        │
│  - telegram_push_logs                                      │
└───────────────────────────────────────────────────────────┘
```

### 模块划分

#### 1. Signal Monitor Module (`telegram/signal_monitor.go`)
- 职责：监控竞赛数据，识别交易信号
- 接口：
  - `Start()` - 启动监控
  - `Stop()` - 停止监控
  - `GetLatestSignals()` - 获取最新信号

#### 2. AI Analysis Engine (`telegram/ai_analyzer.go`)
- 职责：生成技术分析和风险管理参数
- 接口：
  - `AnalyzeSignal(signal Signal) (*Analysis, error)` - 分析信号
  - `CalculateRiskParams(signal Signal) (*RiskParams, error)` - 计算风险参数

#### 3. Telegram Push Module (`telegram/telegram_bot.go`)
- 职责：格式化消息并推送到 Telegram
- 接口：
  - `SendSignal(signal Signal, analysis Analysis) error` - 发送信号
  - `FormatMessage(signal Signal, analysis Analysis) string` - 格式化消息

#### 4. Config Manager (`telegram/config.go`)
- 职责：管理配置和数据库操作
- 接口：
  - `LoadConfig() (*Config, error)` - 加载配置
  - `SaveSignal(signal Signal) error` - 保存信号
  - `IsDuplicate(fingerprint string) bool` - 检查重复

### 数据流

```
1. Signal Monitor 轮询竞赛数据
   ↓
2. 识别持仓变化（开仓/平仓）
   ↓
3. 生成信号指纹，检查去重
   ↓
4. 调用 AI Analysis Engine 生成分析
   ↓
5. 计算风险管理参数
   ↓
6. 格式化 Telegram 消息
   ↓
7. 推送到目标群组
   ↓
8. 记录推送日志
```

## 实施计划

### 阶段 1: 基础设施搭建（0.5 天）

- [ ] 1.1 创建 `telegram/` 目录结构
- [ ] 1.2 设计数据库表结构
- [ ] 1.3 创建配置文件模板
- [ ] 1.4 引入 Telegram Bot SDK 依赖

### 阶段 2: Signal Monitor 模块（1 天）

- [ ] 2.1 实现竞赛数据轮询逻辑
- [ ] 2.2 实现持仓变化识别
- [ ] 2.3 实现信号去重机制
- [ ] 2.4 实现信号指纹生成
- [ ] 2.5 单元测试

### 阶段 3: AI Analysis Engine（1 天）

- [ ] 3.1 设计 AI 分析 Prompt
- [ ] 3.2 实现技术分析生成
- [ ] 3.3 实现风险参数计算
- [ ] 3.4 实现分析结果解析
- [ ] 3.5 单元测试

### 阶段 4: Telegram Push Module（1 天）

- [ ] 4.1 集成 Telegram Bot SDK
- [ ] 4.2 实现消息格式化
- [ ] 4.3 实现消息发送逻辑
- [ ] 4.4 实现重试机制
- [ ] 4.5 实现推送日志记录
- [ ] 4.6 单元测试

### 阶段 5: Config Manager（0.5 天）

- [ ] 5.1 实现配置加载
- [ ] 5.2 实现数据库操作
- [ ] 5.3 实现配置热更新
- [ ] 5.4 单元测试

### 阶段 6: 集成与测试（1 天）

- [ ] 6.1 模块集成
- [ ] 6.2 端到端测试
- [ ] 6.3 性能测试
- [ ] 6.4 错误处理测试
- [ ] 6.5 文档编写

## 配置示例

### 环境变量

```bash
# Telegram Bot 配置
TELEGRAM_BOT_ENABLED=true
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_TARGET_GROUPS=-1001234567890,-1009876543210

# 信号监控配置
SIGNAL_MONITOR_ENABLED=true
SIGNAL_MONITOR_POLL_INTERVAL=30
SIGNAL_MONITOR_DEDUP_WINDOW=60

# AI 分析配置
AI_ANALYSIS_ENABLED=true
AI_ANALYSIS_MODEL=gpt-4
AI_ANALYSIS_TEMPERATURE=0.7
```

### 配置文件 (`config/telegram_bot.json`)

```json
{
  "telegram_bot": {
    "enabled": true,
    "bot_token": "${TELEGRAM_BOT_TOKEN}",
    "target_groups": [
      {
        "group_id": "-1001234567890",
        "name": "主交易群",
        "enabled": true,
        "competition_sources": ["agentrade_competition"]
      }
    ],
    "rate_limit": {
      "max_messages_per_hour": 10,
      "silent_hours": [2, 3, 4, 5, 6]
    }
  },
  "signal_monitor": {
    "enabled": true,
    "poll_interval_seconds": 30,
    "competition_sources": [
      {
        "name": "agentrade_competition",
        "enabled": true,
        "monitor_rank": 1,
        "api_endpoint": "https://www.agentrade.xyz/competition",
        "data_fetch_method": "api_or_scraping"
      }
    ],
    "deduplication_window_minutes": 60
  },
  "ai_analysis": {
    "enabled": true,
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 500,
    "prompt_template": "prompts/telegram_signal_analysis.txt"
  }
}
```

## 使用指南

### 1. 创建 Telegram Bot

```bash
# 1. 在 Telegram 中找到 @BotFather
# 2. 发送 /newbot 创建新 Bot
# 3. 按提示设置 Bot 名称和用户名
# 4. 获取 Bot Token
# 5. 将 Bot 添加到目标群组
# 6. 获取群组 ID（可使用 @userinfobot）
```

### 2. 配置 Bot

```bash
# 编辑配置文件
vim config/telegram_bot.json

# 或设置环境变量
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_TARGET_GROUPS="-1001234567890"
```

### 3. 启动 Bot

```bash
# 启动整个系统（包含 Telegram Bot）
./start.sh

# 或单独启动 Telegram Bot 模块
go run main.go --enable-telegram-bot
```

### 4. 监控运行状态

```bash
# 查看日志
tail -f logs/telegram_bot.log

# 查看推送统计
curl http://localhost:8080/api/telegram/stats
```

## 成功标准

### 功能性标准

1. ✅ 能够实时监控竞赛第一名的交易动作
2. ✅ 能够准确识别开仓和平仓信号
3. ✅ 能够生成完整的技术分析和风险参数
4. ✅ 能够成功推送消息到 Telegram 群组
5. ✅ 信号去重机制有效，无重复推送
6. ✅ 推送延迟 < 60 秒

### 质量标准

1. ✅ 代码覆盖率 > 80%
2. ✅ 无内存泄漏
3. ✅ 错误处理完善
4. ✅ 日志记录完整

### 性能标准

1. ✅ 信号识别延迟 < 30 秒
2. ✅ 消息推送延迟 < 10 秒
3. ✅ 推送成功率 > 99%
4. ✅ CPU 占用 < 5%
5. ✅ 内存占用 < 100MB

## 风险与挑战

### 技术风险

1. **Telegram API 限流**
   - 风险：频繁推送可能触发限流
   - 缓解：实现推送队列和频率控制

2. **竞赛数据源不稳定**
   - 风险：API 可能变更或不可用
   - 缓解：实现多数据源备份和错误重试

3. **AI 分析质量**
   - 风险：AI 生成的分析可能不准确
   - 缓解：使用高质量 Prompt，人工审核机制

### 业务风险

1. **信号延迟**
   - 风险：信号推送延迟可能导致价格变化
   - 缓解：优化轮询频率，减少处理时间

2. **误导性信号**
   - 风险：错误信号可能导致用户损失
   - 缓解：添加免责声明，强调仅供参考

3. **Bot 被封禁**
   - 风险：违反 Telegram 使用条款
   - 缓解：遵守 API 使用规范，避免垃圾信息

## 后续优化

### 短期（1-2 周）

1. 支持更多竞赛数据源
2. 优化 AI 分析 Prompt
3. 添加信号统计和回测功能
4. 支持用户订阅特定代币信号

### 中期（1-2 月）

1. 实现信号评分系统
2. 添加历史信号查询功能
3. 支持多语言推送（中文/英文）
4. 实现信号推送 Web 管理界面

### 长期（3-6 月）

1. 实现信号跟单功能（自动下单）
2. 添加信号绩效追踪
3. 实现用户反馈机制
4. 支持自定义信号策略

## 附录

### A. Telegram Bot SDK

推荐使用 `github.com/go-telegram-bot-api/telegram-bot-api/v5`

```go
import tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

// 创建 Bot
bot, err := tgbotapi.NewBotAPI(botToken)

// 发送消息
msg := tgbotapi.NewMessage(chatID, messageText)
msg.ParseMode = "Markdown"
bot.Send(msg)
```

### B. AI 分析 Prompt 模板

```
你是一位专业的加密货币交易分析师。请根据以下信息生成交易信号分析：

代币：{symbol}
当前价格：{current_price}
方向：{direction}
交易员排名：第 1 名
数据来源：{competition_source}

请提供：
1. 技术分析理由（包含 RSI、MACD、成交量等指标）
2. 入场价建议（基于技术位和缓冲）
3. 止损价建议（基于 ATR 和风险金额 200 美元）
4. 止盈价建议（盈亏比 1:2.5）
5. 潜在风险提示（1 句话）

输出格式为 JSON：
{
  "reason": "积累：RSI 48（超卖），MACD 金叉，成交量 +15%。催化剂：链上活跃度提升",
  "entry_price": 50000,
  "entry_reason": "基于斐波 38.2% 回撤 + 0.5% 缓冲，1h 图动量确认",
  "stop_loss": 49000,
  "stop_loss_reason": "风险计算：200 美元 / 仓位大小 = 距离 + 0.5x ATR 缓冲",
  "take_profit": 52500,
  "take_profit_reason": "目标：盈亏比 1:2.5，基于斐波 161.8% 扩展",
  "risk_warning": "BTC 联动回调或监管新闻"
}
```

### C. 免责声明模板

```
⚠️ 免责声明：
本信号仅供参考，不构成投资建议。
加密货币交易存在高风险，请谨慎决策。
过往表现不代表未来收益。
请根据自身风险承受能力进行交易。
```

## 总结

本提案旨在为 Monnaire Trading Agent OS 添加 Telegram 交易信号推送功能，实时监控交易竞赛冠军的交易动作，并通过 AI 生成专业的技术分析和风险管理参数，推送到指定的 Telegram 群组。

通过该功能，用户可以：
- 实时接收顶级交易员的交易信号
- 获得专业的技术分析和风险管理建议
- 学习专业交易员的交易策略
- 提升交易决策质量

预计投入 3-5 天的开发时间，可以实现完整的 Telegram 信号推送功能，为用户提供高价值的交易信号服务。

---

**提案状态**: 待审批  
**提案作者**: Kiro AI  
**创建日期**: 2025-11-26  
**最后更新**: 2025-11-26
