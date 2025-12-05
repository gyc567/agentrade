# ai_model_configs 表分析报告

## 📋 调查结果

**调查日期**: 2025-11-23  
**调查人员**: Kiro AI Assistant  
**结论**: ❌ **该表不存在**

## 🔍 详细调查

### 1. 代码搜索结果

在整个代码库中搜索 `ai_model_configs`：

```bash
grep -r "ai_model_configs" *.go
# 结果: 无匹配
```

**结论**: 代码中没有任何地方引用 `ai_model_configs` 表。

### 2. 数据库实际表列表

查询本地SQLite数据库 `config.db`：

```sql
.tables
```

**结果**:
```
ai_models            exchanges_new        traders
audit_logs           login_attempts       user_signal_sources
beta_codes           password_resets      users
exchanges            system_config
```

**结论**: 数据库中只有 `ai_models` 表，没有 `ai_model_configs` 表。

### 3. ai_models 表结构

```sql
CREATE TABLE ai_models (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    enabled BOOLEAN DEFAULT 0,
    api_key TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    custom_api_url TEXT DEFAULT '',
    custom_model_name TEXT DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🎯 结论

### ❌ ai_model_configs 表不存在

1. **代码中不存在**: 没有任何代码引用这个表名
2. **数据库中不存在**: 实际数据库中没有这个表
3. **正确的表名**: `ai_models`

### ✅ 正确的表名是 ai_models

**用途**: 存储用户的AI模型配置
- 模型ID和名称
- 提供商信息
- 启用状态
- API密钥
- 自定义配置

## 🤔 可能的混淆来源

### 1. 命名相似性

可能是以下原因导致混淆：

- **Go结构体名称**: `AIModelConfig` (结构体)
- **实际表名**: `ai_models` (数据库表)
- **误解**: 可能认为表名是 `ai_model_configs`（复数形式）

### 2. 代码中的结构体

```go
// config/database.go:742
type AIModelConfig struct {
    ID              string    `json:"id"`
    UserID          string    `json:"user_id"`
    Name            string    `json:"name"`
    Provider        string    `json:"provider"`
    Enabled         bool      `json:"enabled"`
    APIKey          string    `json:"apiKey"`
    CustomAPIURL    string    `json:"customApiUrl"`
    CustomModelName string    `json:"customModelName"`
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}
```

**注意**: 
- 结构体名称: `AIModelConfig` (单数)
- 表名: `ai_models` (复数)
- 不存在: `ai_model_configs` 表

### 3. API端点命名

```go
// api/server.go
protected.GET("/models", s.handleGetModelConfigs)
protected.PUT("/models", s.handleUpdateModelConfigs)
```

**注意**:
- 函数名: `handleGetModelConfigs` (包含"configs")
- 但操作的表: `ai_models`
- 不是: `ai_model_configs`

## 📊 系统中所有的表

根据数据库查询，系统中实际存在的表：

| 表名 | 用途 |
|------|------|
| `users` | 用户信息 |
| `ai_models` | AI模型配置 ⭐ |
| `exchanges` | 交易所配置 |
| `exchanges_new` | 交易所配置（新版） |
| `traders` | 交易员配置 |
| `user_signal_sources` | 用户信号源配置 |
| `password_resets` | 密码重置令牌 |
| `login_attempts` | 登录尝试记录 |
| `audit_logs` | 审计日志 |
| `system_config` | 系统配置 |
| `beta_codes` | 内测码 |

## 🎓 命名规范说明

### Go语言命名规范

在Go语言中，通常遵循以下命名规范：

1. **结构体名称**: 使用大驼峰命名（PascalCase）
   - 例如: `AIModelConfig`, `UserSignalSource`

2. **数据库表名**: 使用蛇形命名（snake_case）
   - 例如: `ai_models`, `user_signal_sources`

3. **函数名称**: 使用小驼峰命名（camelCase）
   - 例如: `handleGetModelConfigs`, `updateAIModel`

### 本项目的命名

```
Go结构体          数据库表              API端点
---------------------------------------------------------
AIModelConfig  →  ai_models         →  /api/models
ExchangeConfig →  exchanges         →  /api/exchanges
UserSignalSource→ user_signal_sources→ /api/user/signal-sources
TraderRecord   →  traders           →  /api/traders
```

**规律**:
- 结构体: 单数形式 + Config/Record
- 表名: 复数形式 + 蛇形命名
- API: 复数形式 + 短横线命名

## 💡 总结

### 关键要点

1. ❌ **不存在** `ai_model_configs` 表
2. ✅ **存在** `ai_models` 表
3. 📝 结构体名称是 `AIModelConfig`
4. 🔧 函数名称包含 "ModelConfigs"
5. 💾 但实际操作的表是 `ai_models`

### 正确的理解

当用户在前端配置AI模型时：

```
前端操作
  ↓
API: GET/PUT /api/models
  ↓
Handler: handleGetModelConfigs / handleUpdateModelConfigs
  ↓
结构体: AIModelConfig
  ↓
数据库表: ai_models ⭐
  ↓
存储配置
```

### 建议

如果在其他文档或讨论中看到 `ai_model_configs`，应该理解为：
- 可能是笔误
- 可能是指 `ai_models` 表
- 可能是指 `AIModelConfig` 结构体
- 但**不是**实际的数据库表名

---

**调查状态**: ✅ 完成  
**结论**: `ai_model_configs` 表不存在，正确的表名是 `ai_models`
