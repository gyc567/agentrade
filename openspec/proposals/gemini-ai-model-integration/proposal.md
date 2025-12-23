# OpenSpec 提案：Gemini AI模型配置集成

**提案ID**: GEMINI-CONFIG-001
**日期**: 2025-12-23
**状态**: 待实现
**优先级**: P1（高）
**作者**: Architecture Team

---

## 📋 概述

### 问题陈述
当前系统仅支持DeepSeek等少数AI模型，缺乏对Google Gemini的原生支持。提供的Gemini测试配置需要纳入系统配置管理，实现多模型并行支持的架构。

### 解决方案概述
- 在 `system_config` 表中添加13项Gemini配置参数
- 创建数据库迁移脚本
- 扩展Go配置加载模块以支持Gemini
- 建立与现有Mem0/DeepSeek配置的一致性

---

## 🎯 需求分析

### 功能需求

#### FR-1: 配置参数管理
在system_config中添加以下参数分类：

| 分类 | 参数 | 说明 | 默认值 |
|------|------|------|--------|
| **核心开关** | `gemini_enabled` | 是否启用Gemini | `false` |
| **API认证** | `gemini_api_key` | Google API密钥 | (环境变量) |
| | `gemini_api_url` | API基础URL | `https://gemini-proxy-iota-weld.vercel.app` |
| | `gemini_api_version` | API版本 | `v1beta` |
| **模型配置** | `gemini_model` | 使用的模型 | `gemini-3-flash-preview` |
| | `gemini_temperature` | 温度参数 | `0.7` |
| | `gemini_max_tokens` | 最大输出长度 | `2000` |
| **高级参数** | `gemini_top_p` | Nucleus采样 | `0.95` |
| | `gemini_top_k` | Top-K采样 | `40` |
| **缓存策略** | `gemini_cache_enabled` | 是否启用缓存 | `true` |
| | `gemini_cache_ttl_minutes` | 缓存过期时间(分钟) | `30` |
| **容错机制** | `gemini_circuit_breaker_enabled` | 断路器开关 | `true` |
| **监控** | `gemini_metrics_enabled` | 监控开关 | `true` |

#### FR-2: 配置加载
- 支持从system_config动态加载Gemini配置
- 支持环境变量覆盖敏感信息（API Key）
- 配置变更时自动重新加载（无需重启）

#### FR-3: 安全性
- API Key不存储在代码中，从环境变量注入
- 支持多个API Key轮换（灾备）
- 敏感配置项标记为只读

### 非功能需求

| 需求 | 标准 |
|------|------|
| **一致性** | 与Mem0配置方式100%一致 |
| **可维护性** | 配置项清晰分类，代码注释完善 |
| **性能** | 配置加载延迟 <100ms |
| **安全性** | API Key绝不在日志中出现 |
| **可测试性** | 单元测试覆盖率 ≥90% |

---

## 🏗️ 架构设计

### 三层架构（Linus原则）

```
┌─────────────────────────────────────────┐
│  现象层 (User-Facing)                   │
│  ├─ system_config表中的13项参数          │
│  └─ 环境变量覆盖机制                    │
├─────────────────────────────────────────┤
│  本质层 (Core Logic)                    │
│  ├─ GeminiConfig结构体                  │
│  ├─ LoadGeminiConfig()函数              │
│  ├─ ValidateGeminiConfig()验证          │
│  └─ 与Mem0/CircuitBreaker集成          │
├─────────────────────────────────────────┤
│  哲学层 (Design Principles)             │
│  ├─ "配置即代码"：可版本控制            │
│  ├─ "安全第一"：密钥绝不hardcode       │
│  └─ "一致性"：各模型配置结构相同        │
└─────────────────────────────────────────┘
```

### 关键设计决策

#### 1. 为什么选择Vercel代理而非官方API？
```
官方Google Gemini API:
  ✗ 跨域限制严格
  ✗ 前端无法直接调用
  ✓ 100%官方支持

Vercel代理:
  ✓ 支持跨域
  ✓ 前端友好
  ⚠️ 依赖第三方服务
  ⚠️ 未经Google官方认证

推荐：生产环境使用官方API + 后端路由
      测试环境可使用Vercel代理
```

#### 2. 为什么用gemini-3-flash-preview不推荐用于生产？
```
Preview版本特性:
  ✓ 最新AI能力
  ✗ 可能有breaking changes
  ✗ 模型权重可能经常更新
  ✗ 性能指标不稳定

建议升级路径:
  测试: gemini-3-flash-preview (当前)
  生产: gemini-2.0-flash (稳定版)
  未来: gemini-1.5-pro (高质量)
```

---

## 📊 数据库迁移方案

### 迁移脚本：`20251223_gemini_config_integration.sql`

```sql
INSERT INTO system_config (key, value) VALUES
    -- 1. 核心开关
    ('gemini_enabled', 'false'),

    -- 2. API认证信息
    ('gemini_api_key', ''),  -- 从环境变量注入
    ('gemini_api_url', 'https://gemini-proxy-iota-weld.vercel.app'),
    ('gemini_api_version', 'v1beta'),

    -- 3. 模型配置
    ('gemini_model', 'gemini-3-flash-preview'),
    ('gemini_temperature', '0.7'),
    ('gemini_max_tokens', '2000'),

    -- 4. 高级参数
    ('gemini_top_p', '0.95'),
    ('gemini_top_k', '40'),

    -- 5. 缓存配置
    ('gemini_cache_enabled', 'true'),
    ('gemini_cache_ttl_minutes', '30'),

    -- 6. 容错机制
    ('gemini_circuit_breaker_enabled', 'true'),

    -- 7. 监控
    ('gemini_metrics_enabled', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 💻 Go实现方案

### 配置结构体设计

```go
// GeminiConfig Gemini模型配置
type GeminiConfig struct {
    // 核心开关
    Enabled bool

    // API认证
    APIKey      string
    APIURL      string
    APIVersion  string

    // 模型参数
    Model        string
    Temperature  float64
    MaxTokens    int

    // 高级参数
    TopP         float64
    TopK         int

    // 缓存
    CacheEnabled   bool
    CacheTTLMinutes int

    // 容错
    CircuitBreakerEnabled bool

    // 监控
    MetricsEnabled bool
}
```

### 配置加载函数

```go
// LoadGeminiConfig 从system_config加载Gemini配置
func LoadGeminiConfig(db *sql.DB) (*GeminiConfig, error) {
    cfg := &GeminiConfig{}

    // 1. 从数据库加载所有gemini_*配置
    // 2. 覆盖关键敏感字段（如API Key）
    // 3. 验证配置完整性
    // 4. 返回配置对象

    return cfg, nil
}

// ValidateGeminiConfig 验证配置有效性
func ValidateGeminiConfig(cfg *GeminiConfig) error {
    if !cfg.Enabled {
        return nil  // 禁用状态下不验证
    }

    if cfg.APIKey == "" {
        return errors.New("gemini_api_key 不能为空")
    }

    if cfg.Temperature < 0 || cfg.Temperature > 1 {
        return fmt.Errorf("temperature 必须在 0-1 之间，当前: %.2f", cfg.Temperature)
    }

    return nil
}
```

---

## 🔄 与现有系统集成

### 与Mem0集成点
```
GetFullDecisionV2 流程:
  ├─ Step 1: 检查缓存 (CacheWarmer)
  ├─ Step 2: Mem0查询
  ├─ Step 3: 如果Mem0无结果，尝试Gemini (新增)
  │          └─ 使用GeminiConfig调用Gemini API
  ├─ Step 4: 压缩上下文
  └─ Step 5: 应用风险过滤
```

### 与CircuitBreaker集成
```
Gemini调用 → CircuitBreaker.Call()
  ├─ 成功 → 计数器重置
  └─ 失败 → 失败计数+1
      ├─ 失败次数 >= 阈值 → 打开断路器
      ├─ 断路器打开 → 快速失败
      └─ 断路器半开 → 尝试恢复
```

---

## 📈 实现计划

### 阶段1: 数据库和配置加载 (1天)
- [ ] 创建迁移脚本 `20251223_gemini_config_integration.sql`
- [ ] 实现 `config/gemini.go` 加载模块
- [ ] 编写单元测试 (≥90% 覆盖)
- [ ] 验证与环境变量的集成

### 阶段2: 模型集成 (2天)
- [ ] 创建 `mem0/gemini_client.go` HTTP客户端
- [ ] 实现 Gemini API 调用逻辑
- [ ] 集成到 `GetFullDecisionV2` 流程
- [ ] 编写集成测试

### 阶段3: 监控和降级 (1天)
- [ ] 扩展 MetricsCollector 支持Gemini指标
- [ ] 实现自动降级逻辑
- [ ] 添加警告阈值
- [ ] 性能测试

### 阶段4: 文档和发布 (0.5天)
- [ ] 更新API文档
- [ ] 创建管理员配置指南
- [ ] 灰度发布计划
- [ ] 回滚方案

---

## 🧪 测试策略

### 单元测试
```
✓ TestLoadGeminiConfigSuccess - 成功加载配置
✓ TestLoadGeminiConfigMissing - 配置缺失时处理
✓ TestValidateGeminiConfig - 配置验证
✓ TestGeminiAPICall - API调用功能
✓ TestGeminiWithCircuitBreaker - 与断路器集成
✓ TestGeminiCachingBehavior - 缓存机制
```

### 集成测试
```
✓ TestGeminiInGetFullDecisionV2 - 完整决策流程
✓ TestGeminiFailoverToMem0 - 故障转移
✓ TestGeminiMetricsCollection - 指标收集
```

### 性能测试
```
- P95延迟目标: < 800ms（Gemini Flash特性）
- 缓存命中率: > 70%
- 断路器保护: 失败快速回复 < 100ms
```

---

## 🎓 设计哲学（Linus风格）

### "有品味的设计"
```
关键决策原则：
1. 消除特殊情况 → 所有模型配置用同一套结构
2. 简单胜过完美 → 13项配置足够，不过度设计
3. 实用主义 → 支持Vercel代理，虽然不完美但实用
4. 安全第一 → API Key绝不hardcode，即使是测试环境
```

### "Never Break Userspace"
```
向后兼容性保证：
- gemini_enabled 默认为 false，不影响现有用户
- 新增配置不会改动现有的mem0_*或deepseek_*配置
- 灰度发布从0%开始，逐步提升
```

### 代码简洁性
```
配置加载：
  Bad:  100行代码，支持5种loading方式
  Good: 20行代码，支持1种清晰的加载方式

验证逻辑：
  Bad:  嵌套多层if-else判断
  Good: 单一职责，早期返回，3行验证代码
```

---

## 📋 验收标准

- [ ] 所有13项配置正确存入system_config表
- [ ] 配置加载函数延迟 < 100ms
- [ ] API Key可从环境变量注入，不在日志中出现
- [ ] 与Mem0配置格式100%一致
- [ ] 单元测试覆盖率 ≥ 90%
- [ ] 集成测试全部通过
- [ ] 性能测试达标（P95 < 800ms）
- [ ] 文档完整，包括故障排查指南

---

## 📚 参考资料

- [Google Gemini API文档](https://ai.google.dev)
- [Mem0配置参考](./database/migrations/20251222_mem0_integration_config.sql)
- [DeepSeek API集成](./mem0/http_client.go)

---

**提案完成日期**: 2025-12-23
**预期实现时间**: 2025-12-25
**风险等级**: 低（仅添加新配置，不修改现有代码路径）
