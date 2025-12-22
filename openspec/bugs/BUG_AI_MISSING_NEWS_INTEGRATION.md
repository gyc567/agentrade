# Bug Fix: AI决策缺失Mlion新闻信息集成

## 问题描述

AI在做交易决策时，**未能获取和利用Mlion的新闻数据**进行基本面分析。决策思维链（CoT）完全基于技术面数据（价格、成交量、指标），缺少市场情绪和新闻事件信息。

**症状**：
- AI思维链中只包含：价格、MACD、RSI、账户状态等技术数据
- 完全缺少：新闻情绪、热点事件、币种相关新闻等基本面信息
- 新闻系统已完全实现（`NewsEnricher`、`MlionAPI`、`PromptSanitizer`等）但未被激活

---

## 根本原因分析 - 三个层级

### 原因 1️⃣: **runCycle() 未调用 NewsEnricher 激活新闻上下文**

**关键代码位置** (`trader/auto_trader.go:392-433`):

```go
// 第1步：构建交易上下文
ctx, err := at.buildTradingContext()  // ← 返回原始context，没有enrichment
if err != nil {
    return err
}

// 第2步：保存快照...

// 第3步：构建Market数据...

// 第4步：直接调用AI（没有enrichment）
decision, err := decision.GetFullDecisionWithCustomPrompt(
    ctx,  // ← 这个context缺少新闻信息
    at.mcpClient,
    at.customPrompt,
    at.overrideBasePrompt,
    at.systemPromptTemplate
)
```

**问题**：
- `buildTradingContext()` 只收集市场数据、账户数据、持仓数据
- 返回的 Context 中没有 NewsContext 字段
- 没有任何代码调用 `NewsEnricher.Enrich(ctx)`

**根源**：
```
新闻系统完整实现
    ↓
但 runCycle() 不知道如何激活它
    ↓
Context 被直接传给 AI，缺少新闻字段
    ↓
buildUserPrompt() 因为没有新闻数据，就不包含新闻部分
```

---

### 原因 2️⃣: **buildUserPrompt() 函数不包含新闻部分**

**关键代码位置** (`decision/engine.go:115`):

```go
userPrompt := buildUserPrompt(ctx)  // ← 这个函数没有检查ctx中的新闻数据
```

**buildUserPrompt() 的逻辑**：

它检查以下字段：
- ✅ `ctx.Account` (账户数据)
- ✅ `ctx.Positions` (持仓数据)
- ✅ `ctx.CandidateCoins` (候选币种)
- ✅ `ctx.Performance` (历史表现)
- ❌ `ctx.NewsContext` (新闻数据) ← **未被使用！**

```go
// 伪代码：buildUserPrompt() 的构建流程
func buildUserPrompt(ctx *Context) string {
    prompt := ""

    prompt += "## 账户状态\n" + formatAccount(ctx.Account)
    prompt += "## 当前持仓\n" + formatPositions(ctx.Positions)
    prompt += "## 候选币种\n" + formatCandidateCoins(ctx.CandidateCoins)
    prompt += "## 历史表现\n" + formatPerformance(ctx.Performance)

    // ❌ 缺失：
    // if ctx.NewsContext != nil {
    //     prompt += "## 市场新闻\n" + formatNews(ctx.NewsContext)
    // }

    return prompt
}
```

**问题**：
- 即使 Context 中有 NewsContext，buildUserPrompt() 也不会使用它
- 必须修改 buildUserPrompt() 来添加新闻部分

---

### 原因 3️⃣: **GetFullDecisionWithCustomPrompt 未激活 Enrichment Chain**

**关键代码位置** (`decision/engine.go:102-115`):

```go
func GetFullDecisionWithCustomPrompt(ctx *Context, ...) (*FullDecision, error) {
    // ✅ 第1步：获取市场数据
    if err := fetchMarketDataForContext(ctx); err != nil {
        return nil, err
    }

    // ❌ 第2步缺失：Enrich context with news
    // enricher := NewNewsEnricher(mlionAPI)
    // chain := InitializeEnricherChain(enricher)
    // EnrichContextWithAllSources(ctx, chain)  // ← 这行代码不存在！

    // ✅ 第3步：构建Prompt（但缺少新闻数据）
    systemPrompt := buildSystemPromptWithCustom(...)
    userPrompt := buildUserPrompt(ctx)  // ← buildUserPrompt不知道新闻在哪里

    // ✅ 第4步：调用AI
    aiResponse, err := mcpClient.CallWithMessages(systemPrompt, userPrompt)

    // ...
}
```

**问题**：
- `GetFullDecisionWithCustomPrompt` 有 3 个步骤，但缺少关键的 "Enrichment" 步骤
- 应该在"获取市场数据"之后、"构建Prompt"之前进行 enrichment
- 但这一步完全缺失

---

## 架构洞察

### 现象层（表面事实）
AI决策不考虑新闻信息，只基于技术面决策。

### 本质层（设计问题）
新闻系统已完全实现，但**集成点断裂**：

```
新闻API (Mlion)
    ↓ ✅ 工作
新闻缓存
    ↓ ✅ 工作
NewsEnricher
    ↓ ❌ 从未被调用
ContextEnricher Chain
    ↓ ❌ 从未被初始化
Context.NewsContext
    ↓ ❌ 未被填充
buildUserPrompt()
    ↓ ❌ 不知道新闻在哪
AI思维链
    ↓ 缺少基本面信息
交易决策
```

### 哲学层（设计美学）
这是典型的"**后加功能未集成**"问题：

```
设计缺陷：功能模块化过度
- 新闻模块独立完善
- 但与决策循环脱节
- 导致"孤岛"现象

应该的设计：
- Context 作为统一的"数据总线"
- Enricher Chain 自动激活所有扩展
- buildUserPrompt() 自动检测所有数据源
- 无需手动激活
```

---

## 解决方案

### 修复 1️⃣: 在 GetFullDecisionWithCustomPrompt 中激活 Enrichment

**文件**: `decision/engine.go`

```go
func GetFullDecisionWithCustomPrompt(ctx *Context, mcpClient *mcp.Client, customPrompt string, overrideBase bool, templateName string) (*FullDecision, error) {
    // 1. 获取市场数据
    if err := fetchMarketDataForContext(ctx); err != nil {
        return nil, fmt.Errorf("获取市场数据失败: %w", err)
    }

    // 【P0修复】: 新增 - Enrich context with news and other sources
    enricher := NewNewsEnricher(mlionAPI)  // 需要传入mlionAPI实例
    chain := InitializeEnricherChain(enricher)
    if err := EnrichContextWithAllSources(ctx, chain); err != nil {
        log.Printf("⚠️ Context enrichment failed: %v (continuing without news)", err)
        // Fail-safe: 继续执行，不影响决策流程
    } else {
        log.Printf("✅ Context enriched with news data")
    }

    // 2. 验证市场数据
    if len(ctx.MarketDataMap) == 0 {
        return nil, fmt.Errorf("没有提供具体的价格数据和指标数据，无法进行技术分析")
    }

    // 3. 构建Prompt
    systemPrompt := buildSystemPromptWithCustom(...)
    userPrompt := buildUserPrompt(ctx)  // 现在可以访问enriched news data

    // 4. 调用AI
    aiResponse, err := mcpClient.CallWithMessages(systemPrompt, userPrompt)

    // ...
}
```

### 修复 2️⃣: 更新 buildUserPrompt 包含新闻部分

**文件**: `decision/prompt_builder.go` 或相关文件

```go
func buildUserPrompt(ctx *Context) string {
    prompt := ""

    // 已有的部分 ✅
    prompt += "## 账户状态\n" + formatAccount(ctx.Account) + "\n\n"
    prompt += "## 当前持仓\n" + formatPositions(ctx.Positions) + "\n\n"
    prompt += "## 候选币种\n" + formatCandidateCoins(ctx.CandidateCoins) + "\n\n"
    prompt += "## 历史表现\n" + formatPerformance(ctx.Performance) + "\n\n"

    // 【P0修复】: 新增 - 添加新闻部分
    if ctx.NewsContext != nil && len(ctx.NewsContext.Articles) > 0 {
        prompt += "## 市场新闻与情绪\n"
        prompt += fmt.Sprintf("平均情绪: %+.2f (-1.0 负面 ~ +1.0 正面)\n", ctx.NewsContext.SentimentAvg)
        prompt += "最新新闻 (Top 5):\n"

        for i, article := range ctx.NewsContext.Articles {
            if i >= 5 { break }
            sentimentLabel := "➡️ 中性"
            if article.Sentiment > 0 {
                sentimentLabel = "✅ 正面"
            } else if article.Sentiment < 0 {
                sentimentLabel = "⚠️ 负面"
            }
            prompt += fmt.Sprintf("  %d. [%s] %s (币种: %s)\n",
                i+1, sentimentLabel, article.Headline, article.Symbol)
        }
        prompt += "\n"
    }

    return prompt
}
```

### 修复 3️⃣: 在 auto_trader.go 中确保 MlionAPI 初始化

**文件**: `trader/auto_trader.go`

```go
// 在 AutoTrader 结构体中添加
type AutoTrader struct {
    // ... 已有字段 ...
    mlionNewsAPI news.MlionAPI  // 【新增】
}

// 在 NewAutoTrader 中初始化
func NewAutoTrader(config AutoTraderConfig) (*AutoTrader, error) {
    // ... 已有初始化 ...

    // 【新增】初始化 Mlion 新闻API
    mlionAPI := news.NewMlionAPI()  // 或从配置中读取

    return &AutoTrader{
        // ... 已有字段赋值 ...
        mlionNewsAPI: mlionAPI,
    }, nil
}

// 在 GetFullDecisionWithCustomPrompt 调用时传入
decision, err := decision.GetFullDecisionWithCustomPrompt(
    ctx,
    at.mcpClient,
    at.customPrompt,
    at.overrideBasePrompt,
    at.systemPromptTemplate,
    at.mlionNewsAPI,  // 【新增】传入API实例
)
```

---

## 验证清单

修复后应观察到：

### 日志输出
```
✅ Context enriched with news data
## 市场新闻与情绪
平均情绪: +0.35
最新新闻:
  1. [✅ 正面] Bitcoin hits new ATH amid institutional adoption
  2. [➡️ 中性] Ethereum upgrade scheduled for Q2
  3. [⚠️ 负面] Regulatory concerns in Asia region
```

### AI思维链变化
```
原：完全基于技术面
    - BTC价格 $47,230
    - MACD处于上升趋势
    - RSI 65 (偏强)
    → 建议开多仓

修复后：融合基本面
    - 技术面：BTC价格 $47,230，MACD上升，RSI 65
    - 基本面：市场情绪正面 (+0.35)，新闻积极（机构采纳、升级预期）
    - 综合评估：看涨信号强烈，建议开多仓，仓位可加大
```

---

## 文件修改清单

| 文件 | 修改 | 优先级 |
|------|------|--------|
| `decision/engine.go` | 在GetFullDecisionWithCustomPrompt中添加enrichment调用 | P0 |
| `decision/prompt_builder.go` | buildUserPrompt中添加新闻部分 | P0 |
| `trader/auto_trader.go` | 初始化mlionNewsAPI，传入到决策函数 | P0 |
| `decision/context.go` | 确保Context结构体有NewsContext字段 | P0 |

---

## 风险评估

### 低风险修改
- ✅ 仅在现有数据基础上添加新字段
- ✅ Fail-safe 设计（新闻获取失败不影响交易）
- ✅ 向后兼容（没有新闻时仍能交易）

### 测试建议
1. 单元测试：NewsEnricher 能正确填充 Context
2. 集成测试：buildUserPrompt 能正确格式化新闻
3. 端到端测试：AI思维链包含新闻分析和情绪判断
4. 故障注入：Mlion API 失败时，系统仍能交易

---

## 关键洞察

**本质问题**：
```
组件完美 ≠ 系统完美

✅ NewsAPI 完善
✅ NewsEnricher 完善
✅ PromptSanitizer 完善
❌ 但都没被连接到决策流程

就像一个健身房：
- 有完美的跑步机 ✅
- 有完美的重量训练 ✅
- 但没有主教练来组织训练计划 ❌
```

修复后，AI决策将从**单一维度（技术面）**升级为**多维度（技术面+基本面）**，大幅提升决策质量。

