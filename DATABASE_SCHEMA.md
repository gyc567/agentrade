# Agentrade 数据库结构文档

## 概览

完全统一的PostgreSQL数据库迁移脚本位于 `database/migration.sql`，包含所有必要的表、约束、索引和初始数据。

**文件位置**: `/Users/eric/dreame/code/agentrade/database/migration.sql`
**版本**: 1.0.0
**兼容性**: PostgreSQL 12+

---

## 数据库表结构（共26张表）

### Part 1: 基础表结构

#### 1. **users** - 用户表
```sql
id (TEXT, PK)                    -- 用户ID
email (TEXT, UNIQUE)             -- 邮箱
password_hash (TEXT)             -- 密码哈希
otp_secret (TEXT)                -- OTP密钥
otp_verified (BOOLEAN)           -- OTP验证状态
locked_until (TIMESTAMPTZ)       -- 账户锁定截止时间
failed_attempts (INTEGER)        -- 失败尝试次数
last_failed_at (TIMESTAMPTZ)     -- 最后失败时间
is_active (BOOLEAN)              -- 账户激活状态
is_admin (BOOLEAN)               -- 管理员标记
beta_code (TEXT)                 -- 内测码
invite_code (TEXT, UNIQUE)       -- 邀请码
invited_by_user_id (TEXT, FK)    -- 邀请者ID
invitation_level (INTEGER)       -- 邀请等级
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

#### 2. **ai_models** - AI模型配置表
```sql
id (TEXT, PK)                    -- 模型ID
user_id (TEXT, PK, FK)           -- 用户ID
name (TEXT)                      -- 模型名称
provider (TEXT)                  -- AI提供商
enabled (BOOLEAN)                -- 启用状态
api_key (TEXT)                   -- API密钥
custom_api_url (TEXT)            -- 自定义API URL
custom_model_name (TEXT)         -- 自定义模型名称
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```
**默认数据**: DeepSeek, Qwen

#### 3. **exchanges** - 交易所配置表
```sql
id (TEXT, PK)                    -- 交易所ID
user_id (TEXT, PK, FK)           -- 用户ID
name (TEXT)                      -- 交易所名称
type (TEXT)                      -- 类型(cex/dex)
enabled (BOOLEAN)                -- 启用状态
api_key (TEXT)                   -- API密钥
secret_key (TEXT)                -- 密钥
testnet (BOOLEAN)                -- 测试网络标记
hyperliquid_wallet_addr (TEXT)   -- Hyperliquid钱包地址
aster_user (TEXT)                -- Aster用户
aster_signer (TEXT)              -- Aster签名者
aster_private_key (TEXT)         -- Aster私钥
okx_passphrase (TEXT)            -- OKX口令
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```
**默认数据**: Binance, Hyperliquid, Aster, OKX

#### 4. **traders** - 交易员配置表
```sql
id (TEXT, PK)                    -- 交易员ID
user_id (TEXT, FK)               -- 用户ID
name (TEXT)                      -- 交易员名称
ai_model_id (TEXT)               -- AI模型ID
exchange_id (TEXT)               -- 交易所ID
initial_balance (REAL)           -- 初始余额
scan_interval_minutes (INTEGER)  -- 扫描间隔(分钟)
is_running (BOOLEAN)             -- 运行状态
btc_eth_leverage (INTEGER)       -- BTC/ETH杠杆倍数
altcoin_leverage (INTEGER)       -- 山寨币杠杆倍数
trading_symbols (TEXT)           -- 交易币种
use_coin_pool (BOOLEAN)          -- 使用币种池
use_oi_top (BOOLEAN)             -- 使用OI Top
custom_prompt (TEXT)             -- 自定义提示
override_base_prompt (BOOLEAN)   -- 覆盖基础提示
system_prompt_template (TEXT)    -- 系统提示模板
is_cross_margin (BOOLEAN)        -- 全仓保证金
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

#### 5. **user_signal_sources** - 用户信号源配置表
```sql
id (SERIAL, PK)                  -- 记录ID
user_id (TEXT, FK, UNIQUE)       -- 用户ID
coin_pool_url (TEXT)             -- 币种池URL
oi_top_url (TEXT)                -- OI Top URL
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

#### 6. **password_resets** - 密码重置令牌表
```sql
id (TEXT, PK)                    -- 令牌ID
user_id (TEXT, FK)               -- 用户ID
token_hash (TEXT)                -- 令牌哈希
expires_at (TIMESTAMPTZ)         -- 过期时间
used_at (TIMESTAMPTZ)            -- 使用时间
created_at (TIMESTAMPTZ)         -- 创建时间
```

#### 7. **login_attempts** - 登录尝试记录表
```sql
id (TEXT, PK)                    -- 记录ID
user_id (TEXT, FK)               -- 用户ID
email (TEXT)                     -- 邮箱
ip_address (TEXT)                -- IP地址
success (BOOLEAN)                -- 成功标记
timestamp (TIMESTAMPTZ)          -- 时间戳
user_agent (TEXT)                -- 用户代理
```

#### 8. **audit_logs** - 审计日志表
```sql
id (TEXT, PK)                    -- 日志ID
user_id (TEXT, FK)               -- 用户ID
action (TEXT)                    -- 操作
ip_address (TEXT)                -- IP地址
user_agent (TEXT)                -- 用户代理
success (BOOLEAN)                -- 成功标记
details (TEXT)                   -- 详细信息
created_at (TIMESTAMPTZ)         -- 创建时间
```

#### 9. **system_config** - 系统配置表
```sql
key (TEXT, PK)                   -- 配置键
value (TEXT)                     -- 配置值
updated_at (TIMESTAMPTZ)         -- 更新时间
```
**配置项总数**: 78项（包括基础、Mlion、Web3、Mem0、Gemini等配置）

#### 10. **user_news_config** - 用户新闻源配置表
```sql
id (SERIAL, PK)                  -- 记录ID
user_id (TEXT, FK, UNIQUE)       -- 用户ID
enabled (BOOLEAN)                -- 启用状态
news_sources (TEXT)              -- 新闻源列表
auto_fetch_interval_minutes (INT)-- 自动获取间隔
max_articles_per_fetch (INT)     -- 单次最大文章数
sentiment_threshold (REAL)       -- 情绪阈值
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

#### 11. **beta_codes** - 内测码表
```sql
code (TEXT, PK)                  -- 内测码
used (BOOLEAN)                   -- 使用状态
used_by (TEXT)                   -- 使用者
used_at (TIMESTAMPTZ)            -- 使用时间
created_at (TIMESTAMPTZ)         -- 创建时间
```

### Part 2: Web3 钱包支持表

#### 12. **web3_wallets** - Web3钱包表
```sql
id (TEXT, PK)                    -- 钱包ID
wallet_addr (TEXT, UNIQUE)       -- 钱包地址
chain_id (INTEGER)               -- 链ID
wallet_type (TEXT)               -- 钱包类型
label (TEXT)                     -- 标签
is_active (BOOLEAN)              -- 激活状态
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

#### 13. **user_wallets** - 用户钱包关联表
```sql
id (TEXT, PK)                    -- 关联ID
user_id (TEXT, FK)               -- 用户ID
wallet_addr (TEXT, FK)           -- 钱包地址
is_primary (BOOLEAN)             -- 主钱包标记
bound_at (TIMESTAMPTZ)           -- 绑定时间
last_used_at (TIMESTAMPTZ)       -- 最后使用时间
```

#### 14. **web3_wallet_nonces** - Web3 Nonce存储表
```sql
id (TEXT, PK)                    -- Nonce ID
address (TEXT)                   -- 地址
nonce (TEXT)                     -- Nonce值
expires_at (TIMESTAMPTZ)         -- 过期时间
used (BOOLEAN)                   -- 使用状态
created_at (TIMESTAMPTZ)         -- 创建时间
```

### Part 3: 积分系统表

#### 15. **credit_packages** - 积分套餐表
```sql
id (TEXT, PK)                    -- 套餐ID
name (TEXT, UNIQUE)              -- 套餐名称
name_en (TEXT)                   -- 英文名称
description (TEXT)               -- 描述
price_usdt (DECIMAL)             -- 价格(USDT)
credits (INTEGER)                -- 积分数量
bonus_credits (INTEGER)          -- 赠送积分
is_active (BOOLEAN)              -- 激活状态
is_recommended (BOOLEAN)          -- 推荐标记
sort_order (INTEGER)             -- 排序序号
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```
**默认数据**: 4个套餐（入门、标准、高级、专业）

#### 16. **user_credits** - 用户积分账户表
```sql
id (TEXT, PK)                    -- 账户ID
user_id (TEXT, FK, UNIQUE)       -- 用户ID
available_credits (INTEGER)      -- 可用积分
total_credits (INTEGER)          -- 总积分
used_credits (INTEGER)           -- 已使用积分
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

#### 17. **credit_transactions** - 积分流水表
```sql
id (TEXT, PK)                    -- 交易ID
user_id (TEXT, FK)               -- 用户ID
type (TEXT)                      -- 交易类型(credit/debit)
amount (INTEGER)                 -- 金额
balance_before (INTEGER)         -- 交易前余额
balance_after (INTEGER)          -- 交易后余额
category (TEXT)                  -- 类别
description (TEXT)               -- 描述
reference_id (TEXT, UNIQUE)      -- 参考ID
created_at (TIMESTAMPTZ)         -- 创建时间
```

#### 18. **credit_compensation_tasks** - 积分补偿任务表
```sql
id (TEXT, PK)                    -- 任务ID
user_id (TEXT, FK)               -- 用户ID
trade_id (TEXT, UNIQUE)          -- 交易ID
status (TEXT)                    -- 状态
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

#### 19. **credit_reservations** - 积分预留表
```sql
id (TEXT, PK)                    -- 预留ID
user_id (TEXT, FK)               -- 用户ID
trade_id (TEXT, UNIQUE)          -- 交易ID
reserved_credits (INTEGER)       -- 预留积分数量
status (TEXT)                    -- 状态
created_at (TIMESTAMPTZ)         -- 创建时间
```

### Part 4: 支付系统表

#### 20. **payment_orders** - 支付订单表
```sql
id (TEXT, PK)                    -- 订单ID
crossmint_order_id (TEXT, UNIQUE)-- Crossmint订单ID
user_id (TEXT, FK)               -- 用户ID
package_id (TEXT, FK)            -- 套餐ID
amount (DECIMAL)                 -- 金额
currency (TEXT)                  -- 货币
credits (INTEGER)                -- 积分数量
status (TEXT)                    -- 订单状态
payment_method (TEXT)            -- 支付方式
crossmint_client_secret (TEXT)   -- Crossmint密钥
webhook_received_at (TIMESTAMPTZ)-- Webhook接收时间
completed_at (TIMESTAMPTZ)       -- 完成时间
failed_reason (TEXT)             -- 失败原因
metadata (JSONB)                 -- 元数据
created_at (TIMESTAMPTZ)         -- 创建时间
updated_at (TIMESTAMPTZ)         -- 更新时间
```

### Part 5: AI 学习系统表

#### 21. **trade_analysis_records** - 交易分析记录表
```sql
id (TEXT, PK)                    -- 记录ID
trader_id (TEXT)                 -- 交易员ID
analysis_date (TIMESTAMPTZ)      -- 分析日期
total_trades (INTEGER)           -- 总交易数
winning_trades (INTEGER)         -- 胜利交易数
losing_trades (INTEGER)          -- 失败交易数
win_rate (REAL)                  -- 胜率
avg_profit_per_win (REAL)        -- 平均盈利
avg_loss_per_loss (REAL)         -- 平均亏损
profit_factor (REAL)             -- 利润因子
risk_reward_ratio (REAL)         -- 风险收益比
analysis_data (JSONB)            -- 分析数据JSON
created_at (TIMESTAMPTZ)         -- 创建时间
```

#### 22. **learning_reflections** - 学习反思表
```sql
id (TEXT, PK)                    -- 反思ID
trader_id (TEXT)                 -- 交易员ID
reflection_type (VARCHAR)        -- 反思类型
severity (VARCHAR)               -- 严重级别
problem_title (TEXT)             -- 问题标题
problem_description (TEXT)       -- 问题描述
root_cause (TEXT)                -- 根本原因
recommended_action (TEXT)        -- 推荐操作
priority (INTEGER)               -- 优先级
is_applied (BOOLEAN)             -- 是否已应用
created_at (TIMESTAMPTZ)         -- 创建时间
```

#### 23. **parameter_change_history** - 参数变更历史表
```sql
id (TEXT, PK)                    -- 历史ID
trader_id (TEXT)                 -- 交易员ID
parameter_name (VARCHAR)         -- 参数名称
old_value (TEXT)                 -- 旧值
new_value (TEXT)                 -- 新值
change_reason (TEXT)             -- 变更原因
created_at (TIMESTAMPTZ)         -- 创建时间
```

### Part 9: Kelly统计和交易记录表

#### 24. **trade_records** - 交易记录表
用于Kelly公式学习和统计的交易记录表，存储每笔交易的详细信息。
```sql
id (BIGSERIAL, PK)               -- 交易记录ID
trader_id (TEXT)                 -- 交易员ID
symbol (TEXT)                    -- 交易对
entry_price (DECIMAL(18,8))      -- 入场价格
exit_price (DECIMAL(18,8))       -- 出场价格
profit_pct (DECIMAL(10,6))       -- 利润百分比
leverage (INTEGER)               -- 杠杆倍数
holding_time_seconds (BIGINT)    -- 持仓时长（秒）
margin_mode (TEXT)               -- 保证金模式
created_at (TIMESTAMPTZ)         -- 创建时间
```
**用途**: Kelly公式学习、交易统计、收益分析
**性能**:
- `idx_trade_records_trader` - 按交易员查询
- `idx_trade_records_symbol` - 按交易对查询
- `idx_trade_records_created_at` - 按时间查询

#### 25. **kelly_stats** - Kelly统计表
缓存计算的Kelly公式统计数据，加速启动和查询性能。
```sql
id (BIGSERIAL, PK)               -- 统计记录ID
trader_id (TEXT)                 -- 交易员ID
symbol (TEXT)                    -- 交易对
total_trades (INTEGER)           -- 总交易次数
profitable_trades (INTEGER)      -- 盈利交易次数
win_rate (DECIMAL(10,6))         -- 胜率
avg_win_pct (DECIMAL(10,6))      -- 平均盈利百分比
avg_loss_pct (DECIMAL(10,6))     -- 平均亏损百分比
max_profit_pct (DECIMAL(10,6))   -- 最大单笔盈利
max_drawdown_pct (DECIMAL(10,6)) -- 最大回撤
volatility (DECIMAL(10,6))       -- 波动率
weighted_win_rate (DECIMAL(10,6))-- 加权胜率
updated_at (TIMESTAMPTZ)         -- 更新时间
UNIQUE(trader_id, symbol)        -- 唯一约束
```
**用途**: Kelly公式计算、杠杆优化、风险管理
**性能**:
- `idx_kelly_stats_trader` - 按交易员查询
- `idx_kelly_stats_symbol` - 按交易对查询

#### 26. **news_feed_state** - 新闻源状态表
跟踪新闻源的消费进度，防止重复处理和数据遗漏。
```sql
category (TEXT, PK)              -- 新闻分类
last_id (BIGINT)                 -- 最后处理的消息ID
last_timestamp (BIGINT)          -- 最后处理的时间戳
updated_at (TIMESTAMPTZ)         -- 更新时间
```
**用途**: 新闻源同步状态跟踪、消息去重
**说明**: 用于Mlion新闻系统的状态管理

---

## 系统配置项（78项）

### 基础配置
- `admin_mode`, `beta_mode`, `api_server_port`, `use_default_coins`, `default_coins`
- `max_daily_loss`, `max_drawdown`, `stop_trading_minutes`
- `btc_eth_leverage`, `altcoin_leverage`, `jwt_secret`

### Mlion新闻配置
- `mlion_api_key`, `mlion_target_topic_id`, `mlion_news_enabled`

### Web3钱包配置
- `web3.supported_wallet_types`, `web3.max_wallets_per_user`
- `web3.nonce_expiry_minutes`, `web3.rate_limit_per_ip`
- `web3.rate_limit_window_minutes`

### Mem0 AI记忆配置（36项）
- 核心开关、API认证、用户身份、AI模型配置、记忆存储
- 缓存与预热、断路器、压缩与过滤、反思学习、监控指标
- 灰度发布、A/B测试

### Gemini AI配置（30项）
- 核心开关、API认证、模型配置、采样参数
- 缓存与性能、容错与断路器、监控与日志
- 灰度发布、超时与重试配置

---

## 索引统计

| 类别 | 索引数量 | 用途 |
|------|---------|------|
| 用户表 | 4 | 邮箱查询、激活状态、邀请码、邀请者 |
| AI模型 | 2 | 用户筛选、启用状态 |
| 交易所 | 2 | 用户筛选、启用状态 |
| 交易员 | 3 | 用户、运行状态、交易所 |
| Web3钱包 | 7 | 地址、类型、用户、过期Nonce、使用状态 |
| 积分系统 | 10 | 套餐、交易、补偿、预留等 |
| 支付订单 | 5 | 用户、Crossmint订单、状态、时间 |
| AI学习 | 3 | 交易员分析、反思、参数变更 |
| 交易记录 | 4 | 交易员、交易对、时间查询 |
| Kelly统计 | 2 | 交易员、交易对查询 |
| **总计** | **43** | 性能优化 |

---

## 触发器

所有需要自动更新 `updated_at` 的表都配置了触发器：
- users, ai_models, exchanges, traders, user_signal_sources
- user_news_config, system_config, web3_wallets
- credit_packages, user_credits, payment_orders
- credit_compensation_tasks

---

## 约束和验证

### 数据完整性约束
- 外键约束: CASCADE删除以保证数据一致性
- UNIQUE约束: 确保字段唯一性（邀请码、钱包地址、积分套餐名等）
- CHECK约束: 数据验证（金额正数、杠杆倍数、状态值等）

### 业务逻辑约束
- 积分一致性: `available = total - used`
- 交易余额: `(credit: after = before + amount) OR (debit: after = before - amount)`
- Web3钱包: 正则校验ERC20地址格式

---

## 迁移历史

本脚本整合了以下独立迁移脚本：

1. `database/migration.sql` - 基础表结构
2. `database/migrations/20251201_add_web3_wallets/001_create_tables.sql` - Web3支持
3. `database/migrations/20251201_credits/001_create_tables.sql` - 积分系统
4. `database/migrations/20251211_invitation_system.sql` - 邀请系统
5. `database/migrations/20251215_mlion_news_config.sql` - Mlion新闻配置
6. `database/migrations/20251216_ai_learning_phase1.sql` - AI学习系统
7. `database/migrations/20251222_mem0_integration_config.sql` - Mem0配置
8. `database/migrations/20251223_gemini_config_integration.sql` - Gemini配置
9. `database/migrations/20251228_crossmint_payment/001_create_tables.sql` - Crossmint支付
10. `config/database_constraints.sql` - 数据库约束

---

## 初始数据

### 默认用户
| ID | Email | 角色 |
|----|-|-|
| default | default@agentrade.local | 普通用户 |

### 默认AI模型
| ID | 名称 | 提供商 | 状态 |
|-|-|-|-|
| deepseek | DeepSeek | deepseek | 禁用 |
| qwen | Qwen | qwen | 禁用 |

### 默认交易所
| ID | 名称 | 类型 | 状态 |
|-|-|-|-|
| binance | Binance Futures | cex | 禁用 |
| hyperliquid | Hyperliquid | dex | 禁用 |
| aster | Aster DEX | dex | 禁用 |
| okx | OKX Futures | cex | 禁用 |

### 默认积分套餐
| ID | 名称 | 价格 | 积分 | 推荐 |
|-|-|-|-|-|
| pkg_starter | 入门套餐 | $5.00 | 200 | ✗ |
| pkg_standard | 标准套餐 | $10.00 | 500 | ✓ |
| pkg_premium | 高级套餐 | $20.00 | 1200 | ✗ |
| pkg_pro | 专业套餐 | $50.00 | 3500 | ✗ |

---

## 使用说明

### 全新安装
```bash
export DATABASE_URL='postgresql://user:pass@host/database?sslmode=require'
go run cmd/db-migrate/main.go
```

### 重置数据库
```bash
export DATABASE_URL='postgresql://user:pass@host/database?sslmode=require'
go run cmd/db-reset/main.go    # 清空所有表
go run cmd/db-migrate/main.go  # 重新创建
```

### 验证数据库
```bash
export DATABASE_URL='postgresql://user:pass@host/database?sslmode=require'
go run cmd/db-verify/main.go
```

---

## 文件位置

- **主迁移脚本**: `database/migration.sql`
- **迁移工具**: `cmd/db-migrate/main.go`
- **重置工具**: `cmd/db-reset/main.go`
- **验证工具**: `cmd/db-verify/main.go`
- **.env配置**: `.env`

---

## 数据库连接

```env
DATABASE_URL='postgresql://neondb_owner:npg_a07wZfjmeBHi@ep-tiny-glade-ahz6ueot-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

---

**文档创建日期**: 2026-01-15
**版本**: 1.0.0
**状态**: ✅ 完成
