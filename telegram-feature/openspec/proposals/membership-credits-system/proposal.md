# 会员积分套餐体系提案

## 提案概述

**提案标题**: Monnaire Trading Agent OS 会员积分套餐体系  
**提案类型**: 核心商业功能 / 付费系统  
**优先级**: P0 (最高优先级)  
**预计工作量**: 7-10天  
**预估价值**: $1,500 USD  

## 执行摘要

本提案旨在为 Monnaire Trading Agent OS 构建一套完整的会员积分套餐体系，实现平台商业化变现。系统支持多种套餐配置（如 10U/500积分、5U/200积分），所有套餐信息存储在数据库中，支持动态管理。积分可用于解锁高级功能、增加交易员数量限制、获取优先信号等。

## 背景与动机

### 当前状况

Monnaire Trading Agent OS 目前是一个功能完善的 AI 交易系统，但缺乏商业化变现机制：
- 用户可以免费使用所有功能
- 没有付费墙或功能限制
- 无法区分免费用户和付费用户
- 缺乏可持续的收入来源

### 业务需求

1. **建立可持续的商业模式**
   - 通过积分套餐实现收入
   - 支持多种定价策略
   - 灵活的套餐配置

2. **用户分层管理**
   - 区分免费用户和付费用户
   - 提供差异化服务
   - 激励用户付费升级

3. **功能解锁机制**
   - 基础功能免费
   - 高级功能需要积分
   - 按需付费模式

### 市场分析

| 竞品 | 定价模式 | 月费范围 |
|------|----------|----------|
| 3Commas | 订阅制 | $29-$99/月 |
| Cryptohopper | 订阅制 | $19-$99/月 |
| Pionex | 免费+VIP | $0-$50/月 |
| **Monnaire (本方案)** | **积分制** | **灵活定价** |

积分制的优势：
- 用户按需购买，降低入门门槛
- 灵活消费，不浪费
- 支持促销和赠送
- 易于扩展新功能

## 目标

### 主要目标

1. **构建完整的积分系统**
   - 积分购买、消费、查询
   - 积分有效期管理
   - 积分流水记录

2. **实现灵活的套餐管理**
   - 套餐信息存储在数据库
   - 支持动态增删改套餐
   - 支持促销和折扣

3. **建立功能解锁机制**
   - 定义积分消费规则
   - 实现功能权限控制
   - 支持按次/按时计费

4. **提供管理后台**
   - 套餐管理
   - 用户积分管理
   - 交易记录查询
   - 数据统计分析

### 成功指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 付费转化率 | >5% | 免费用户转付费用户 |
| ARPU | >$15/月 | 平均每用户收入 |
| 积分消耗率 | >70% | 购买积分的使用率 |
| 系统可用性 | >99.9% | 积分系统稳定性 |

## 功能需求

### 1. 套餐管理模块

#### 1.1 套餐数据模型

```go
// CreditPackage 积分套餐
type CreditPackage struct {
    ID              string    `json:"id"`               // 套餐ID (UUID)
    Name            string    `json:"name"`             // 套餐名称
    NameEN          string    `json:"name_en"`          // 英文名称
    Description     string    `json:"description"`      // 套餐描述
    DescriptionEN   string    `json:"description_en"`   // 英文描述
    PriceUSDT       float64   `json:"price_usdt"`       // 价格(USDT)
    Credits         int       `json:"credits"`          // 积分数量
    BonusCredits    int       `json:"bonus_credits"`    // 赠送积分
    ValidDays       int       `json:"valid_days"`       // 有效期(天)，0表示永久
    IsActive        bool      `json:"is_active"`        // 是否启用
    IsRecommended   bool      `json:"is_recommended"`   // 是否推荐套餐
    SortOrder       int       `json:"sort_order"`       // 排序顺序
    MaxPurchase     int       `json:"max_purchase"`     // 单用户最大购买次数，0表示无限
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}
```

#### 1.2 初始套餐配置

| 套餐名称 | 价格(USDT) | 积分 | 赠送 | 总积分 | 单价 | 有效期 |
|----------|------------|------|------|--------|------|--------|
| 入门套餐 | 5 U | 200 | 0 | 200 | 0.025 U/积分 | 永久 |
| 标准套餐 | 10 U | 500 | 50 | 550 | 0.018 U/积分 | 永久 |
| 高级套餐 | 25 U | 1500 | 200 | 1700 | 0.015 U/积分 | 永久 |
| 专业套餐 | 50 U | 3500 | 500 | 4000 | 0.0125 U/积分 | 永久 |
| 企业套餐 | 100 U | 8000 | 2000 | 10000 | 0.01 U/积分 | 永久 |

#### 1.3 套餐管理功能

- **创建套餐**: 管理员可创建新套餐
- **编辑套餐**: 修改套餐信息（不影响已购买用户）
- **启用/禁用**: 控制套餐是否可购买
- **删除套餐**: 软删除，保留历史记录
- **排序管理**: 调整套餐显示顺序
- **促销设置**: 临时折扣、限时优惠

### 2. 用户积分模块

#### 2.1 用户积分数据模型

```go
// UserCredits 用户积分账户
type UserCredits struct {
    ID              string    `json:"id"`
    UserID          string    `json:"user_id"`
    TotalCredits    int       `json:"total_credits"`     // 总积分（历史累计购买）
    AvailableCredits int      `json:"available_credits"` // 可用积分
    FrozenCredits   int       `json:"frozen_credits"`    // 冻结积分（处理中的订单）
    UsedCredits     int       `json:"used_credits"`      // 已使用积分
    ExpiredCredits  int       `json:"expired_credits"`   // 已过期积分
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}

// CreditBalance 积分余额明细（支持不同有效期的积分分开管理）
type CreditBalance struct {
    ID              string    `json:"id"`
    UserID          string    `json:"user_id"`
    Credits         int       `json:"credits"`           // 积分数量
    RemainingCredits int      `json:"remaining_credits"` // 剩余积分
    SourceType      string    `json:"source_type"`       // 来源类型: purchase/bonus/gift/refund
    SourceID        string    `json:"source_id"`         // 来源ID（订单ID等）
    ExpiresAt       *time.Time `json:"expires_at"`       // 过期时间，null表示永久
    CreatedAt       time.Time `json:"created_at"`
}
```

#### 2.2 积分流水记录

```go
// CreditTransaction 积分流水
type CreditTransaction struct {
    ID              string    `json:"id"`
    UserID          string    `json:"user_id"`
    Type            string    `json:"type"`              // 类型: credit(增加)/debit(扣减)
    Amount          int       `json:"amount"`            // 积分数量
    BalanceBefore   int       `json:"balance_before"`    // 变动前余额
    BalanceAfter    int       `json:"balance_after"`     // 变动后余额
    Category        string    `json:"category"`          // 分类: purchase/consume/gift/refund/expire/admin
    Description     string    `json:"description"`       // 描述
    ReferenceType   string    `json:"reference_type"`    // 关联类型: order/feature/admin
    ReferenceID     string    `json:"reference_id"`      // 关联ID
    CreatedAt       time.Time `json:"created_at"`
}
```

#### 2.3 积分操作接口

```go
// CreditService 积分服务接口
type CreditService interface {
    // 查询
    GetUserCredits(userID string) (*UserCredits, error)
    GetCreditBalances(userID string) ([]*CreditBalance, error)
    GetCreditTransactions(userID string, page, limit int) ([]*CreditTransaction, int, error)
    
    // 积分操作
    AddCredits(userID string, amount int, sourceType, sourceID string, expiresAt *time.Time) error
    DeductCredits(userID string, amount int, category, description, refType, refID string) error
    FreezeCredits(userID string, amount int, reason string) error
    UnfreezeCredits(userID string, amount int, reason string) error
    
    // 检查
    HasEnoughCredits(userID string, amount int) bool
    GetExpiringCredits(userID string, days int) (int, error)
}
```

### 3. 订单支付模块

#### 3.1 订单数据模型

```go
// CreditOrder 积分购买订单
type CreditOrder struct {
    ID              string    `json:"id"`               // 订单ID
    OrderNo         string    `json:"order_no"`         // 订单号 (格式: CR + 时间戳 + 随机数)
    UserID          string    `json:"user_id"`
    PackageID       string    `json:"package_id"`       // 套餐ID
    PackageName     string    `json:"package_name"`     // 套餐名称（快照）
    PriceUSDT       float64   `json:"price_usdt"`       // 支付金额
    Credits         int       `json:"credits"`          // 购买积分
    BonusCredits    int       `json:"bonus_credits"`    // 赠送积分
    TotalCredits    int       `json:"total_credits"`    // 总积分
    Status          string    `json:"status"`           // 状态: pending/paid/completed/cancelled/refunded
    PaymentMethod   string    `json:"payment_method"`   // 支付方式: usdt_trc20/usdt_erc20/usdt_bep20
    PaymentAddress  string    `json:"payment_address"`  // 收款地址
    PaymentTxHash   string    `json:"payment_tx_hash"`  // 支付交易哈希
    PaidAt          *time.Time `json:"paid_at"`         // 支付时间
    CompletedAt     *time.Time `json:"completed_at"`    // 完成时间
    ExpiresAt       time.Time `json:"expires_at"`       // 订单过期时间（未支付自动取消）
    Remark          string    `json:"remark"`           // 备注
    CreatedAt       time.Time `json:"created_at"`
    UpdatedAt       time.Time `json:"updated_at"`
}
```

#### 3.2 支付流程

```
用户选择套餐 → 创建订单 → 生成收款地址 → 用户转账 → 
链上确认 → 订单完成 → 积分到账 → 发送通知
```

**详细流程**:

1. **创建订单**
   - 用户选择套餐
   - 系统生成唯一订单号
   - 设置订单过期时间（默认30分钟）
   - 生成/分配收款地址

2. **等待支付**
   - 显示收款地址和金额
   - 显示倒计时
   - 支持复制地址和金额

3. **支付确认**
   - 监听链上交易
   - 验证金额和地址
   - 等待足够确认数（TRC20: 20确认，ERC20: 12确认）

4. **订单完成**
   - 更新订单状态
   - 发放积分到用户账户
   - 记录积分流水
   - 发送通知（邮件/Telegram）

5. **异常处理**
   - 金额不足：标记待处理，人工介入
   - 超时未支付：自动取消订单
   - 重复支付：记录并人工处理退款

#### 3.3 支付方式配置

```go
// PaymentMethod 支付方式配置
type PaymentMethod struct {
    ID              string    `json:"id"`
    Name            string    `json:"name"`             // 显示名称
    Code            string    `json:"code"`             // 代码: usdt_trc20
    Network         string    `json:"network"`          // 网络: tron/ethereum/bsc
    Currency        string    `json:"currency"`         // 币种: USDT
    ContractAddress string    `json:"contract_address"` // 合约地址
    WalletAddress   string    `json:"wallet_address"`   // 收款钱包地址
    Confirmations   int       `json:"confirmations"`    // 需要确认数
    MinAmount       float64   `json:"min_amount"`       // 最小金额
    MaxAmount       float64   `json:"max_amount"`       // 最大金额
    IsActive        bool      `json:"is_active"`
    SortOrder       int       `json:"sort_order"`
    CreatedAt       time.Time `json:"created_at"`
}
```

**支持的支付网络**:

| 网络 | 币种 | 确认数 | 手续费 | 到账时间 |
|------|------|--------|--------|----------|
| TRON (TRC20) | USDT | 20 | ~1 USDT | ~1分钟 |
| Ethereum (ERC20) | USDT | 12 | ~5-20 USDT | ~3分钟 |
| BSC (BEP20) | USDT | 15 | ~0.5 USDT | ~1分钟 |

### 4. 积分消费模块

#### 4.1 消费项目配置

```go
// CreditConsumptionItem 积分消费项目
type CreditConsumptionItem struct {
    ID              string    `json:"id"`
    Code            string    `json:"code"`             // 项目代码
    Name            string    `json:"name"`             // 项目名称
    NameEN          string    `json:"name_en"`
    Description     string    `json:"description"`
    Category        string    `json:"category"`         // 分类: feature/limit/service
    CostType        string    `json:"cost_type"`        // 计费类型: once/daily/monthly/per_use
    CostCredits     int       `json:"cost_credits"`     // 消费积分
    IsActive        bool      `json:"is_active"`
    CreatedAt       time.Time `json:"created_at"`
}
```

#### 4.2 积分消费项目清单

| 项目代码 | 项目名称 | 分类 | 计费方式 | 积分/次 | 说明 |
|----------|----------|------|----------|---------|------|
| `trader_create` | 创建交易员 | limit | 单次 | 50 | 每创建一个交易员消耗 |
| `trader_run_daily` | 交易员运行 | feature | 每日 | 10 | 每个运行中的交易员每日消耗 |
| `ai_decision` | AI决策调用 | per_use | 按次 | 1 | 每次AI决策消耗 |
| `signal_premium` | 高级信号 | feature | 每日 | 5 | 订阅高级信号源 |
| `telegram_signal` | Telegram信号推送 | feature | 每月 | 100 | 开通Telegram信号推送 |
| `api_access` | API访问权限 | feature | 每月 | 200 | 开通API访问权限 |
| `priority_support` | 优先客服 | service | 每月 | 50 | 优先客服支持 |
| `custom_prompt` | 自定义Prompt | feature | 单次 | 20 | 解锁自定义Prompt功能 |
| `backtest` | 策略回测 | per_use | 按次 | 5 | 每次回测消耗 |
| `export_data` | 数据导出 | per_use | 按次 | 10 | 导出交易数据 |

#### 4.3 免费额度配置

```go
// FreeQuota 免费额度配置
type FreeQuota struct {
    ID              string    `json:"id"`
    ItemCode        string    `json:"item_code"`        // 消费项目代码
    QuotaType       string    `json:"quota_type"`       // 额度类型: daily/monthly/total
    QuotaAmount     int       `json:"quota_amount"`     // 免费额度
    IsActive        bool      `json:"is_active"`
    CreatedAt       time.Time `json:"created_at"`
}
```

**默认免费额度**:

| 项目 | 免费额度 | 周期 | 说明 |
|------|----------|------|------|
| 创建交易员 | 1个 | 永久 | 新用户可免费创建1个交易员 |
| AI决策调用 | 100次 | 每月 | 每月100次免费AI决策 |
| 策略回测 | 5次 | 每月 | 每月5次免费回测 |

### 5. 会员等级模块

#### 5.1 会员等级数据模型

```go
// MembershipLevel 会员等级
type MembershipLevel struct {
    ID              string    `json:"id"`
    Code            string    `json:"code"`             // 等级代码: free/bronze/silver/gold/platinum
    Name            string    `json:"name"`             // 等级名称
    NameEN          string    `json:"name_en"`
    MinCredits      int       `json:"min_credits"`      // 最低累计消费积分
    MaxCredits      int       `json:"max_credits"`      // 最高累计消费积分
    DiscountRate    float64   `json:"discount_rate"`    // 积分消费折扣率 (0.9 = 9折)
    BonusRate       float64   `json:"bonus_rate"`       // 购买积分赠送比例 (0.1 = 10%)
    MaxTraders      int       `json:"max_traders"`      // 最大交易员数量
    PriorityLevel   int       `json:"priority_level"`   // 优先级（信号推送等）
    Benefits        string    `json:"benefits"`         // 权益说明 (JSON)
    IconURL         string    `json:"icon_url"`         // 等级图标
    Color           string    `json:"color"`            // 等级颜色
    SortOrder       int       `json:"sort_order"`
    IsActive        bool      `json:"is_active"`
    CreatedAt       time.Time `json:"created_at"`
}
```

#### 5.2 会员等级配置

| 等级 | 代码 | 累计消费 | 折扣 | 购买赠送 | 最大交易员 | 权益 |
|------|------|----------|------|----------|------------|------|
| 免费会员 | free | 0 | 无 | 无 | 1 | 基础功能 |
| 青铜会员 | bronze | 500+ | 95折 | 5% | 3 | 基础+优先信号 |
| 白银会员 | silver | 2000+ | 90折 | 10% | 5 | 青铜+API访问 |
| 黄金会员 | gold | 5000+ | 85折 | 15% | 10 | 白银+优先客服 |
| 铂金会员 | platinum | 10000+ | 80折 | 20% | 无限 | 全部权益+专属顾问 |

#### 5.3 用户会员信息

```go
// UserMembership 用户会员信息
type UserMembership struct {
    ID                  string    `json:"id"`
    UserID              string    `json:"user_id"`
    LevelCode           string    `json:"level_code"`           // 当前等级
    TotalPurchased      int       `json:"total_purchased"`      // 累计购买积分
    TotalConsumed       int       `json:"total_consumed"`       // 累计消费积分
    CurrentMonthPurchased int     `json:"current_month_purchased"` // 本月购买
    CurrentMonthConsumed int      `json:"current_month_consumed"`  // 本月消费
    LevelUpAt           *time.Time `json:"level_up_at"`          // 升级时间
    CreatedAt           time.Time `json:"created_at"`
    UpdatedAt           time.Time `json:"updated_at"`
}
```

### 6. 数据库设计

#### 6.1 完整表结构

```sql
-- 积分套餐表
CREATE TABLE credit_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    description_en TEXT,
    price_usdt DECIMAL(10,2) NOT NULL,
    credits INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    valid_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_recommended BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    max_purchase INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户积分账户表
CREATE TABLE user_credits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
    total_credits INTEGER DEFAULT 0,
    available_credits INTEGER DEFAULT 0,
    frozen_credits INTEGER DEFAULT 0,
    used_credits INTEGER DEFAULT 0,
    expired_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 积分余额明细表（支持不同有效期）
CREATE TABLE credit_balances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    credits INTEGER NOT NULL,
    remaining_credits INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_expires (user_id, expires_at)
);

-- 积分流水表
CREATE TABLE credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    reference_type TEXT,
    reference_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at DESC)
);

-- 积分订单表
CREATE TABLE credit_orders (
    id TEXT PRIMARY KEY,
    order_no TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    package_id TEXT NOT NULL REFERENCES credit_packages(id),
    package_name TEXT NOT NULL,
    price_usdt DECIMAL(10,2) NOT NULL,
    credits INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    total_credits INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    payment_address TEXT,
    payment_tx_hash TEXT,
    paid_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_status (user_id, status),
    INDEX idx_order_no (order_no),
    INDEX idx_status_expires (status, expires_at)
);

-- 支付方式配置表
CREATE TABLE payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    network TEXT NOT NULL,
    currency TEXT NOT NULL,
    contract_address TEXT,
    wallet_address TEXT NOT NULL,
    confirmations INTEGER DEFAULT 20,
    min_amount DECIMAL(10,2) DEFAULT 1,
    max_amount DECIMAL(10,2) DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 积分消费项目表
CREATE TABLE credit_consumption_items (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    category TEXT NOT NULL,
    cost_type TEXT NOT NULL,
    cost_credits INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 免费额度配置表
CREATE TABLE free_quotas (
    id TEXT PRIMARY KEY,
    item_code TEXT NOT NULL REFERENCES credit_consumption_items(code),
    quota_type TEXT NOT NULL,
    quota_amount INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户免费额度使用记录表
CREATE TABLE user_quota_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    item_code TEXT NOT NULL,
    quota_type TEXT NOT NULL,
    used_amount INTEGER DEFAULT 0,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, item_code, period_start)
);

-- 会员等级配置表
CREATE TABLE membership_levels (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_en TEXT,
    min_credits INTEGER NOT NULL,
    max_credits INTEGER,
    discount_rate DECIMAL(3,2) DEFAULT 1.00,
    bonus_rate DECIMAL(3,2) DEFAULT 0.00,
    max_traders INTEGER DEFAULT 1,
    priority_level INTEGER DEFAULT 0,
    benefits TEXT,
    icon_url TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户会员信息表
CREATE TABLE user_memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
    level_code TEXT NOT NULL REFERENCES membership_levels(code),
    total_purchased INTEGER DEFAULT 0,
    total_consumed INTEGER DEFAULT 0,
    current_month_purchased INTEGER DEFAULT 0,
    current_month_consumed INTEGER DEFAULT 0,
    level_up_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. API接口设计

### 7.1 RESTful API规范

#### 7.1.1 套餐相关API

```
GET    /api/v1/packages               # 获取所有套餐列表
GET    /api/v1/packages/{id}          # 获取套餐详情
GET    /api/v1/packages/recommended   # 获取推荐套餐

POST   /api/v1/orders                 # 创建积分订单
GET    /api/v1/orders/{id}            # 获取订单详情
GET    /api/v1/orders                 # 获取用户订单列表 (分页)
POST   /api/v1/orders/{id}/cancel     # 取消订单
```

#### 7.1.2 用户积分API

```
GET    /api/v1/credits                # 获取用户积分余额
GET    /api/v1/credits/balances       # 获取积分明细（不同有效期）
GET    /api/v1/credits/transactions   # 获取积分流水 (分页)
GET    /api/v1/credits/expiring       # 获取即将过期积分
```

#### 7.1.3 积分消费API

```
POST   /api/v1/consume                # 消费积分
GET    /api/v1/consumption/items      # 获取消费项目列表
GET    /api/v1/quotas                 # 获取用户免费额度使用情况
```

#### 7.1.4 会员等级API

```
GET    /api/v1/membership/level       # 获取用户会员等级
GET    /api/v1/membership/benefits    # 获取会员权益
GET    /api/v1/membership/levels      # 获取所有会员等级
```

### 7.2 WebSocket实时推送

```go
// WebSocket事件类型
type WSEventType string

const (
    WS_EVENT_ORDER_PAID     WSEventType = "order_paid"      // 订单支付成功
    WS_EVENT_CREDITS_ADDED  WSEventType = "credits_added"   // 积分到账
    WS_EVENT_CREDITS_USED   WSEventType = "credits_used"    // 积分消费
    WS_EVENT_LEVEL_UP       WSEventType = "level_up"        // 会员升级
    WS_EVENT_QUOTA_RESET    WSEventType = "quota_reset"     // 免费额度重置
)

type WSEvent struct {
    Type      WSEventType `json:"type"`
    UserID    string      `json:"user_id"`
    Timestamp int64       `json:"timestamp"`
    Data      interface{} `json:"data"`
}
```

**实时推送场景**:
- 订单支付成功通知
- 积分到账提醒
- 会员升级通知
- 即将过期积分提醒
- 免费额度用完提醒

### 7.3 API响应格式

```json
{
    "code": 200,
    "message": "success",
    "data": {
        // 实际数据
    },
    "timestamp": 1701234567890
}
```

**错误码规范**:

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| 200 | 成功 | 200 |
| 400 | 请求参数错误 | 400 |
| 401 | 未授权 | 401 |
| 403 | 权限不足 | 403 |
| 404 | 资源不存在 | 404 |
| 409 | 业务冲突 | 409 |
| 422 | 积分不足 | 422 |
| 429 | 请求过于频繁 | 429 |
| 500 | 服务器内部错误 | 500 |

### 7.4 接口鉴权

```go
// JWT Token载荷
type JWTClaims struct {
    UserID      string `json:"user_id"`
    Username    string `json:"username"`
    Membership  string `json:"membership"` // 会员等级
    RateLimit   int    `json:"rate_limit"` // API调用频率限制
    Exp         int64  `json:"exp"`
    Iat         int64  `json:"iat"`
}
```

**鉴权策略**:
- 所有API需要Bearer Token认证
- 不同会员等级有不同的API调用频率限制
- 敏感操作需要二次确认
- 管理员API需要特殊权限

---

## 8. 前端UI设计

### 8.1 套餐购买页面

#### 8.1.1 页面布局
```
┌─────────────────────────────────────────┐
│ 会员积分套餐                              │
│ ─────────                              │
│                                         │
│  💎 推荐套餐                             │
│  ┌──────┐ ┌──────┐ ┌──────┐             │
│  │5U/200│ │10U/550│ │25U/1700│           │
│  └──────┘ └──────┘ └──────┘             │
│                                         │
│  全部套餐                                │
│  ┌──────┐ ┌──────┐ ┌──────┐             │
│  │5U/200│ │10U/550│ │25U/1700│ ...      │
│  └──────┘ └──────┘ └──────┘             │
│                                         │
│  支付方式: [TRC20] [ERC20] [BEP20]      │
│  ──────                              │
│  [立即购买]                            │
└─────────────────────────────────────────┘
```

#### 8.1.2 交互功能

**套餐卡片**:
- 显示套餐名称、价格、总积分
- 突出推荐套餐
- 显示单位积分成本
- 点击选择套餐

**价格对比**:
- 显示节省金额
- 展示优惠信息
- 赠送积分高亮

**支付方式选择**:
- 显示各网络手续费
- 到账时间提示
- 推荐最优网络

### 8.2 支付页面

#### 8.2.1 订单信息
```
订单号: CR20251126220001
套餐: 标准套餐 (10U)
支付金额: 10.00 USDT
获得积分: 500 + 50 = 550
支付网络: TRON (TRC20)
订单过期: 29分45秒
```

#### 8.2.2 收款信息
```
┌─────────────────────────────────┐
│  请向上述地址转账                │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ TYjQYDZ2...AbC3              │ │
│  └─────────────────────────────┘ │
│            [📋 复制地址]           │
│                                 │
│  支付金额: 10.00 USDT           │
│  [📋 复制金额]                   │
│                                 │
│  ⚠️ 请确保转账金额完全一致         │
│     少于或多于都将导致订单失败    │
└─────────────────────────────────┘
```

#### 8.2.3 订单状态
- 等待支付 (倒计时)
- 支付确认中 (显示确认数)
- 支付成功 ✅
- 订单完成 ✅ (积分已到账)

### 8.3 用户积分页面

#### 8.3.1 积分概览
```
┌─────────────────────────────────────────┐
│ 我的积分                                 │
│ ─────                                │
│                                         │
│  可用积分: 1,250                       │
│  即将过期: 200 (30天后)                │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     积分使用趋势图 (近30天)      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

#### 8.3.2 积分明细
```
按有效期分类:
┌─────────────────────────────────────────┐
│ 永久积分 (1,050积分)                     │
│ 来源: 标准套餐 x2, 高级套餐 x1          │
│ 消费记录: [查看]                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 2025-12-26 到期 (200积分)                │
│ 来源: 青铜会员奖励                       │
│ 剩余: 200积分                           │
│ [申请延期] [立即使用]                    │
└─────────────────────────────────────────┘
```

#### 8.3.3 积分流水
```
类型    积分变化    余额    说明              时间
购买    +500       1,250   标准套餐         11-26
消费    -10        1,240   AI决策           11-26
消费    -50        1,190   创建交易员       11-25
赠送    +50        1,240   青铜会员奖励     11-25
```

### 8.4 会员中心

#### 8.4.1 会员等级展示
```
┌─────────────────────────────────────────┐
│ 当前等级: 青铜会员                       │
│ ────────────                          │
│                                         │
│  累计消费: 550积分                      │
│  下级目标: 2,000积分 (白银)             │
│                                         │
│  ████████░░ 27.5%                      │
│                                         │
│  权益:                                 │
│  ✅ 95折积分优惠                        │
│  ✅ 5%购买赠送                         │
│  ✅ 最大3个交易员                      │
│  ✅ 优先信号推送                       │
└─────────────────────────────────────────┘
```

#### 8.4.2 等级特权对比表
```
┌─────────┬──────┬──────┬──────┬──────┬──────┐
│ 等级    │免费  │青铜  │白银  │黄金  │铂金  │
├─────────┼──────┼──────┼──────┼──────┼──────┤
│ 折扣    │-     │95折  │9折   │85折  │8折   │
├─────────┼──────┼──────┼──────┼──────┼──────┤
│ 赠送    │-     │5%    │10%   │15%   │20%   │
├─────────┼──────┼──────┼──────┼──────┼──────┤
│ 交易员  │1个   │3个   │5个   │10个  │无限  │
├─────────┼──────┼──────┼──────┼──────┼──────┤
│ AI决策  │100/月│无限制│无限制│无限制│无限制│
├─────────┼──────┼──────┼──────┼──────┼──────┤
│ 优先信号│❌    │✅    │✅    │✅    │✅    │
├─────────┼──────┼──────┼──────┼──────┼──────�
│ API访问 │❌    │❌    │✅    │✅    │✅    │
├─────────┼──────┼──────┼──────┼──────┼──────�
│ 优先客服│❌    │❌    │❌    │✅    │✅    │
└─────────┴──────┴──────┴──────┴──────┴──────┘
```

### 8.5 响应式设计

#### 8.5.1 移动端适配
- 套餐卡片支持滑动浏览
- 支付页面优化触摸交互
- 二维码支付支持
- 简化订单信息展示

#### 8.5.2 国际化支持
- 中英文界面切换
- 多语言价格显示
- 本地化支付提示
- 区域化会员权益

---

## 9. 管理员后台

### 9.1 管理员权限设计

```go
// 角色权限定义
type AdminRole struct {
    ID          string   `json:"id"`
    Code        string   `json:"code"`         // role: super_admin/package_admin/order_admin
    Name        string   `json:"name"`
    Permissions []string `json:"permissions"`  // 权限列表
    IsActive    bool     `json:"is_active"`
}

// 权限列表
const (
    PERM_PACKAGE_VIEW    = "package:view"     // 查看套餐
    PERM_PACKAGE_EDIT    = "package:edit"     // 编辑套餐
    PERM_ORDER_VIEW      = "order:view"       // 查看订单
    PERM_ORDER_PROCESS   = "order:process"    // 处理订单
    PERM_USER_VIEW       = "user:view"        // 查看用户
    PERM_USER_ADJUST     = "user:adjust"      // 调整用户积分
    PERM_FINANCE_VIEW    = "finance:view"     // 查看财务报表
    PERM_SYSTEM_CONFIG   = "system:config"    // 系统配置
)
```

### 9.2 套餐管理页面

#### 9.2.1 套餐列表
```
┌─────────────────────────────────────────────────────────┐
│ 积分套餐管理                                [+ 新建套餐]   │
├─────────────────────────────────────────────────────────┤
│ 套餐名称    │价格 │积分│赠送│状态│推荐│操作                │
├─────────────────────────────────────────────────────────┤
│ 入门套餐    │5U  │200 │0   │✅启用│❌ │[编辑][禁用]        │
│ 标准套餐    │10U │500 │50  │✅启用│✅ │[编辑][禁用]        │
│ 高级套餐    │25U │1500│200 │✅启用│❌ │[编辑][禁用]        │
│ 专业套餐    │50U │3500│500 │❌禁用│❌ │[编辑][启用]        │
└─────────────────────────────────────────────────────────┘
```

#### 9.2.2 套餐创建/编辑表单
```
基本信息:
├── 套餐名称 (中/英)
├── 套餐描述 (中/英)
├── 价格 (USDT)
├── 积分数量
├── 赠送积分
├── 有效期 (天)
└── 最大购买次数

展示设置:
├── 是否启用
├── 是否推荐
├── 排序权重
└── 套餐图标

高级设置:
├── 折扣码支持
├── 限时优惠
├── 区域限制
└── 会员等级限制
```

### 9.3 订单管理页面

#### 9.3.1 订单列表
```
┌─────────────────────────────────────────────────────────┐
│ 积分订单管理                               [导出][刷新]   │
├─────────────────────────────────────────────────────────┤
│ 搜索: [订单号][用户ID] [状态:全部▼] [日期范围] [搜索]    │
├─────────────────────────────────────────────────────────┤
│订单号        │用户   │套餐    │金额│状态  │操作           │
├─────────────────────────────────────────────────────────┤
│CR20251126... │user123│标准套餐│10U │已完成│[详情][退款]   │
│CR20251126... │user456│高级套餐│25U │待支付│[详情][取消]   │
│CR20251126... │user789│入门套餐│5U  │处理中│[详情]         │
└─────────────────────────────────────────────────────────┘
```

#### 9.3.2 订单详情页
```
订单信息:
├── 订单号: CR20251126220001
├── 用户: user123 (email@example.com)
├── 套餐: 标准套餐 (10U/500积分)
├── 支付金额: 10.00 USDT
├── 获得积分: 500 + 50 = 550
├── 订单状态: 已完成
├── 创建时间: 2025-11-26 22:00:01
└── 完成时间: 2025-11-26 22:03:45

支付信息:
├── 支付方式: TRON (TRC20)
├── 收款地址: TYjQYDZ2...
├── 交易哈希: a1b2c3d4...
├── 链上确认: 20/20
└── 到账金额: 10.00 USDT

操作日志:
├── 22:00:01 - 订单创建
├── 22:01:23 - 用户发起转账
├── 22:03:12 - 链上确认完成
├── 22:03:45 - 积分发放完成

异常处理:
[金额不足标记处理] [重复支付退款] [订单申诉处理]
```

### 9.4 用户管理页面

#### 9.4.1 用户积分管理
```
┌─────────────────────────────────────────────────────────┐
│ 用户积分管理                              [批量调整]      │
├─────────────────────────────────────────────────────────┤
│ 用户ID    │用户名  │可用积分│冻结积分│总消费│会员等级 │
├─────────────────────────────────────────────────────────┤
│user123   │张三    │1,250   │0      │550   │青铜     │
│user456   │李四    │500     │50     │200   │免费     │
│user789   │王五    │3,400   │0      │3,000 │白银     │
└─────────────────────────────────────────────────────────┘

操作:
[调整积分] [查看流水] [冻结账户] [发送通知]
```

#### 9.4.2 积分调整功能
```
积分调整表单:
┌─────────────────────────────────┐
│ 目标用户: user123 (张三)         │
│ 当前可用: 1,250积分              │
├─────────────────────────────────┤
│ 调整类型:                        │
│ ○ 增加积分  ○ 减少积分          │
├─────────────────────────────────┤
│ 调整数量: [____] 积分            │
├─────────────────────────────────┤
│ 有效期:                          │
│ ○ 永久  ○ 指定过期时间          │
├─────────────────────────────────┤
│ 调整原因:                        │
│ [管理员手动调整                  │
│  ▾]                             │
├─────────────────────────────────┤
│ 备注说明: [________________]      │
├─────────────────────────────────┤
│ [取消]             [确认调整]    │
└─────────────────────────────────┘
```

### 9.5 数据统计页面

#### 9.5.1 销售数据看板
```
┌─────────────────────────────────────────┐
│ 积分销售数据看板                          │
│ ─────────                              │
│                                         │
│ 今日数据                                │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │新增收入│ │新增用户│ │订单数 │ │转化率│     │
│ │$1,250│ │15    │ │23    │ │8.3% │     │
│ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                         │
│ 销售趋势图 (近30天)                      │
│ ┌─────────────────────────────────────┐ │
│ │  ██████████████████████████████████│ │
│ │  ██████████████████████████████████│ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 热门套餐排行                             │
│ 1. 标准套餐 (10U) - 45%                 │
│ 2. 高级套餐 (25U) - 30%                 │
│ 3. 入门套餐 (5U) - 25%                  │
└─────────────────────────────────────────┘
```

#### 9.5.2 财务报表
```
月度财务报表:
┌─────────────────────────────────────────┐
│ 2025年11月                               │
│ ─────────                              │
│                                         │
│ 收入统计                                │
│ ├─ 积分销售收入: $12,450                │
│ ├─ 退款支出: $320                       │
│ └─ 净收入: $12,130                      │
│                                         │
│ 用户统计                                │
│ ├─ 新增付费用户: 85                     │
│ ├─ 累计付费用户: 420                    │
│ ├─ 免费用户: 1,580                      │
│ └─ 转化率: 5.1%                         │
│                                         │
│ 积分统计                                │
│ ├─ 售出积分: 65,000                     │
│ ├─ 消费积分: 45,500                     │
│ └─ 消耗率: 70%                          │
│                                         │
│ [导出财务报表] [发送月度报告]            │
└─────────────────────────────────────────┘
```

### 9.6 系统配置页面

#### 9.6.1 支付配置
```
支付网络配置:
┌─────────────────────────────────────────┐
│ TRON (TRC20)                            │
│ ├─ 收款钱包: TYjQYDZ2...                │
│ ├─ 合约地址: TR7N...                    │
│ ├─ 确认数: 20                           │
│ ├─ 最小金额: 1.0 USDT                   │
│ ├─ 状态: ✅启用                         │
│ └─ [编辑配置]                           │
├─────────────────────────────────────────┤
│ Ethereum (ERC20)                        │
│ ├─ 收款钱包: 0xAbC...                   │
│ ├─ 合约地址: 0x94B...                   │
│ ├─ 确认数: 12                           │
│ ├─ 最小金额: 5.0 USDT                   │
│ ├─ 状态: ✅启用                         │
│ └─ [编辑配置]                           │
└─────────────────────────────────────────┘
```

#### 9.6.2 消费项目配置
```
积分消费项目:
┌─────────────────────────────────────────┐
│ 项目代码     │名称        │费用 │状态  │操作│
├─────────────────────────────────────────┤
│trader_create│创建交易员  │50   │✅启用│编辑│
│trader_run   │交易员运行  │10/天│✅启用│编辑│
│ai_decision  │AI决策调用  │1/次│✅启用│编辑│
│signal_prem  │高级信号    │5/天│✅启用│编辑│
│telegram_sig │Telegram推送│100/月│❌禁用│编辑│
└─────────────────────────────────────────┘

[+ 新建消费项目]
```

---

## 10. 安全性设计

### 10.1 数据安全

#### 10.1.1 敏感数据加密
```go
// 支付相关敏感信息加密存储
type SecurePaymentInfo struct {
    WalletAddress string `json:"wallet_address" encrypt:"aes256"`      // 钱包地址加密
    TxHash        string `json:"tx_hash" encrypt:"aes256"`             // 交易哈希加密
    PrivateNote   string `json:"private_note" encrypt:"aes256"`        // 私密备注加密
}

// 管理员操作日志
type AdminAuditLog struct {
    ID         string    `json:"id"`
    AdminID    string    `json:"admin_id"`
    Action     string    `json:"action"`        // 操作类型
    Resource   string    `json:"resource"`      // 资源类型
    ResourceID string    `json:"resource_id"`   // 资源ID
    OldValue   string    `json:"old_value"`     // 修改前值
    NewValue   string    `json:"new_value"`     // 修改后值
    IPAddress  string    `json:"ip_address"`    // 操作IP
    UserAgent  string    `json:"user_agent"`    // 用户代理
    CreatedAt  time.Time `json:"created_at"`
}
```

#### 10.1.2 API安全策略

**Rate Limiting (频率限制)**:
```go
// 基于用户等级的频率限制
type RateLimitConfig struct {
    FreeUser:    100 req/hour    // 免费用户
    BronzeUser:  500 req/hour    // 青铜
    SilverUser:  1000 req/hour   // 白银
    GoldUser:    2000 req/hour   // 黄金
    PlatinumUser: unlimited      // 铂金
    AdminUser:   unlimited       // 管理员
}
```

**SQL注入防护**:
- 使用参数化查询
- 输入验证和转义
- 白名单验证
- 禁止动态SQL拼接

**XSS防护**:
- 输出编码
- CSP (内容安全策略)
- HTTP-only Cookie
- 输入过滤

### 10.2 支付安全

#### 10.2.1 交易验证
```go
// 链上交易验证
type TransactionVerifier struct {
    Network     string  `json:"network"`       // trc20/erc20/bep20
    TxHash      string  `json:"tx_hash"`
    FromAddress string  `json:"from_address"`
    ToAddress   string  `json:"to_address"`
    Amount      float64 `json:"amount"`        // 原始金额
    Confirmations int   `json:"confirmations"` // 当前确认数
    RequiredConf int    `json:"required_conf"` // 需要确认数
    Status      string  `json:"status"`        // pending/confirmed/failed
}

// 验证规则
var ValidationRules = map[string]ValidationRule{
    "trc20": {
        MinAmount:     1.0,
        RequiredConf:  20,
        TokenContract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
        CheckBalance:  false,
    },
    "erc20": {
        MinAmount:     5.0,
        RequiredConf:  12,
        TokenContract: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        CheckBalance:  true,
    },
}
```

#### 10.2.2 防重放攻击
```go
// 订单防重放
type OrderReplayProtection struct {
    OrderID    string    `json:"order_id"`
    TxHash     string    `json:"tx_hash"`      // 交易哈希唯一标识
    Processed  bool      `json:"processed"`    // 是否已处理
    ProcessTime time.Time `json:"process_time"`
}

// 幂等性保证
type IdempotencyKey struct {
    Key         string    `json:"key"`          // 幂等键
    RequestHash string    `json:"request_hash"` // 请求内容哈希
    Response    string    `json:"response"`     // 响应结果
    CreatedAt   time.Time `json:"created_at"`
    ExpiresAt   time.Time `json:"expires_at"`
}
```

### 10.3 系统安全

#### 10.3.1 访问控制 (RBAC)
```go
// 基于角色的访问控制
type RoleBasedAccessControl struct {
    UserRoles    map[string][]string    `json:"user_roles"`    // 用户->角色映射
    RolePerms    map[string][]string    `json:"role_perms"`    // 角色->权限映射
    ResourcePerms map[string][]string   `json:"resource_perms"`// 资源->权限映射
}

// 权限检查中间件
func CheckPermission(userID, resource, action string) bool {
    roles := GetUserRoles(userID)
    requiredPerm := fmt.Sprintf("%s:%s", resource, action)
    
    for _, role := range roles {
        if HasPermission(role, requiredPerm) {
            return true
        }
    }
    return false
}
```

#### 10.3.2 敏感操作二次验证
```go
// 二次验证配置
type TwoFactorAuth struct {
    Methods      []string  `json:"methods"`      // sms/email/totp
    Required     []string  `json:"required"`     // 哪些操作需要2FA
    Expiry       int       `json:"expiry"`       // 验证码有效期(秒)
    RateLimit    int       `json:"rate_limit"`   // 发送频率限制
}

// 敏感操作清单
var SensitiveOperations = []string{
    "package:delete",       // 删除套餐
    "user:adjust_credits",  // 调整用户积分
    "order:refund",         // 订单退款
    "system:config",        // 系统配置
    "admin:create",         // 创建管理员
}
```

---

## 11. 监控与日志

### 11.1 业务监控指标

#### 11.1.1 关键指标 (KPIs)
```go
// 业务指标定义
type BusinessMetrics struct {
    // 销售指标
    DailyRevenue        float64 `json:"daily_revenue"`        // 日收入
    MonthlyRevenue      float64 `json:"monthly_revenue"`      // 月收入
    ARPU               float64 `json:"arpu"`                 // 平均每用户收入
    ConversionRate     float64 `json:"conversion_rate"`      // 转化率
    CustomerLTV        float64 `json:"customer_ltv"`         // 客户生命周期价值
    
    // 用户指标
    NewUsers           int     `json:"new_users"`            // 新增用户
    ActiveUsers        int     `json:"active_users"`         // 活跃用户
    PaidUsers          int     `json:"paid_users"`           // 付费用户
    ChurnRate          float64 `json:"churn_rate"`           // 用户流失率
    
    // 积分指标
    CreditsSold        int     `json:"credits_sold"`         // 售出积分
    CreditsConsumed    int     `json:"credits_consumed"`     // 消费积分
    CreditsExpired     int     `json:"credits_expired"`      // 过期积分
    ConsumptionRate    float64 `json:"consumption_rate"`     // 积分消耗率
    
    // 订单指标
    OrderCount         int     `json:"order_count"`          // 订单数量
    OrderSuccessRate   float64 `json:"order_success_rate"`   // 订单成功率
    AverageOrderValue  float64 `json:"average_order_value"`  // 平均订单价值
    RefundRate         float64 `json:"refund_rate"`          // 退款率
}
```

#### 11.1.2 实时监控看板
```
┌─────────────────────────────────────────┐
│ 实时业务监控看板                          │
│ ─────────                              │
│                                         │
│ 当前在线: 125 用户                        │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│ │新订单│ │待处理│ │成功率│ │收入 │         │
│ │  5  │ │  3  │ │98.5%│ │$450│         │
│ └─────┘ └─────┘ └─────┘ └─────┘         │
│                                         │
│ 支付成功率趋势 (5分钟)                   │
│ ┌─────────────────────────────────────┐ │
│ │  ████████████████████▌             │ │
│ │  ███████████████████████▌           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 异常告警                                │
│ ✅ 无异常                               │
│                                         │
│ 系统状态                                │
│ ✅ 数据库: 正常                         │
│ ✅ 支付服务: 正常                       │
│ ⚠️  TRC20确认延迟 (当前12/20)           │
└─────────────────────────────────────────┘
```

### 11.2 日志设计

#### 11.2.1 结构化日志格式
```go
// 结构化日志格式
type CreditSystemLog struct {
    Timestamp   time.Time `json:"timestamp"`
    Level       string    `json:"level"`          // info/warn/error
    TraceID     string    `json:"trace_id"`       // 追踪ID
    UserID      string    `json:"user_id"`        // 用户ID
    Action      string    `json:"action"`         // 操作类型
    Resource    string    `json:"resource"`       // 资源类型
    ResourceID  string    `json:"resource_id"`    // 资源ID
    RequestIP   string    `json:"request_ip"`     // 请求IP
    UserAgent   string    `json:"user_agent"`     // 用户代理
    Duration    int64     `json:"duration_ms"`    // 耗时(毫秒)
    Status      string    `json:"status"`         // 成功/失败
    ErrorCode   string    `json:"error_code"`     // 错误码
    Message     string    `json:"message"`        // 日志消息
    Metadata    string    `json:"metadata"`       // 额外信息 (JSON)
}
```

**示例日志**:
```json
{
    "timestamp": "2025-11-26T22:00:01Z",
    "level": "info",
    "trace_id": "tr_abc123def456",
    "user_id": "user123",
    "action": "create_order",
    "resource": "credit_order",
    "resource_id": "CR20251126220001",
    "request_ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "duration_ms": 150,
    "status": "success",
    "message": "订单创建成功",
    "metadata": {
        "package_id": "pkg_standard",
        "amount": 10.0,
        "credits": 550
    }
}
```

#### 11.2.2 分类日志

**用户行为日志**:
- 用户登录/登出
- 套餐浏览/购买
- 积分消费/查询
- 会员等级变动

**系统操作日志**:
- 管理员操作记录
- 配置变更日志
- 数据修改追踪
- 权限变更记录

**业务事件日志**:
- 订单创建/支付
- 积分发放/消费
- 退款处理
- 异常订单处理

**错误日志**:
- API调用失败
- 支付确认失败
- 数据库异常
- 外部服务错误

### 11.3 告警机制

#### 11.3.1 告警规则配置
```go
// 告警规则
type AlertRule struct {
    ID          string            `json:"id"`
    Name        string            `json:"name"`
    Metric      string            `json:"metric"`           // 监控指标
    Condition   string            `json:"condition"`        // 触发条件: >/</>=/<=/==
    Threshold   float64           `json:"threshold"`        // 阈值
    Duration    int               `json:"duration"`         // 持续时间(秒)
    Severity    string            `json:"severity"`         // 严重级别: critical/major/minor
    Channels    []string          `json:"channels"`         // 通知渠道: email/sms/telegram/webhook
    Recipients  []string          `json:"recipients"`       // 接收人
    Enabled     bool              `json:"enabled"`
    CreatedAt   time.Time         `json:"created_at"`
}

// 预定义告警规则
var DefaultAlertRules = []AlertRule{
    {
        Name:        "支付成功率过低",
        Metric:      "payment_success_rate",
        Condition:   "<",
        Threshold:   95.0,
        Duration:    300,        // 5分钟
        Severity:    "major",
        Channels:    []string{"email", "telegram"},
        Recipients:  []string{"ops@company.com", "@devops"},
    },
    {
        Name:        "订单处理延迟",
        Metric:      "order_processing_time",
        Condition:   ">",
        Threshold:   300,        // 5分钟
        Duration:    60,
        Severity:    "minor",
        Channels:    []string{"webhook"},
        Recipients:  []string{"https://hooks.slack.com/..."},
    },
    {
        Name:        "数据库连接异常",
        Metric:      "db_connection_errors",
        Condition:   ">",
        Threshold:   5,
        Duration:    0,          // 立即告警
        Severity:    "critical",
        Channels:    []string{"sms", "email"},
        Recipients:  []string{"+1234567890", "dba@company.com"},
    },
}
```

#### 11.3.2 告警通知模板
```go
// 告警通知模板
type AlertNotification struct {
    RuleName     string    `json:"rule_name"`
    Severity     string    `json:"severity"`
    Metric       string    `json:"metric"`
    CurrentValue float64   `json:"current_value"`
    Threshold    float64   `json:"threshold"`
    Duration     string    `json:"duration"`
    Status       string    `json:"status"`        // triggered/resolved
    Timestamp    time.Time `json:"timestamp"`
    Description  string    `json:"description"`
    ActionURL    string    `json:"action_url"`    // 快速操作链接
}
```

---

## 12. 性能优化

### 12.1 数据库优化

#### 12.1.1 索引策略
```sql
-- 订单表索引
CREATE INDEX idx_credit_orders_user_status ON credit_orders(user_id, status);
CREATE INDEX idx_credit_orders_created ON credit_orders(created_at DESC);
CREATE INDEX idx_credit_orders_status_expires ON credit_orders(status, expires_at);
CREATE INDEX idx_credit_orders_payment_hash ON credit_orders(payment_tx_hash);

-- 积分流水表索引
CREATE INDEX idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_type_created ON credit_transactions(type, created_at DESC);
CREATE INDEX idx_credit_transactions_category ON credit_transactions(category);

-- 积分余额表索引
CREATE INDEX idx_credit_balances_user_expires ON credit_balances(user_id, expires_at);
CREATE INDEX idx_credit_balances_source ON credit_balances(source_type, source_id);

-- 用户会员表索引
CREATE INDEX idx_user_memberships_level ON user_memberships(level_code);
CREATE INDEX idx_user_memberships_total_purchased ON user_memberships(total_purchased);

-- 复合索引优化查询
CREATE INDEX idx_orders_user_status_created ON credit_orders(user_id, status, created_at DESC);
CREATE INDEX idx_transactions_user_type_created ON credit_transactions(user_id, type, created_at DESC);
```

#### 12.1.2 查询优化
```go
// 优化的积分查询
type OptimizedCreditQuery struct {
    // 使用预聚合查询
    GetUserCreditSummary(userID string) (*CreditSummary, error)
    
    // 批量查询减少N+1
    GetBatchUserCredits(userIDs []string) (map[string]*UserCredits, error)
    
    // 分页查询优化
    GetCreditTransactions(userID string, page, limit int) ([]*CreditTransaction, error)
    
    // 缓存热门数据
    GetPopularPackages() ([]*CreditPackage, error)
    
    // 只查询必要字段
    GetMinimalOrderInfo(orderID string) (*OrderMinimal, error)
}

// 分页查询优化
func GetCreditTransactionsOptimized(userID string, cursor string, limit int) ([]*CreditTransaction, string, error) {
    // 使用游标分页代替OFFSET
    var queries []string
    
    queries = append(queries, `
        SELECT id, type, amount, balance_after, category, description, created_at
        FROM credit_transactions 
        WHERE user_id = ? 
    `)
    
    if cursor != "" {
        queries = append(queries, fmt.Sprintf(" AND created_at < '%s'", cursor))
    }
    
    queries = append(queries, fmt.Sprintf(" ORDER BY created_at DESC LIMIT %d", limit))
    
    // 执行查询...
}
```

### 12.2 缓存策略

#### 12.2.1 多级缓存架构
```go
// 缓存层级
type CacheStrategy struct {
    L1Cache *sync.Map              // 内存缓存 (热点数据)
    L2Cache *redis.Client          // Redis缓存 (用户数据)
    L3Cache *sql.DB               // 数据库 (持久化)
    
    // 缓存键前缀
    Prefix map[string]string{
        "package":  "pkg",         // 套餐缓存
        "user":     "usr",         // 用户缓存
        "order":    "ord",         // 订单缓存
        "credits":  "crd",         // 积分缓存
    }
}

// 缓存配置
type CacheConfig struct {
    // L1缓存配置
    L1MaxEntries  int           // 最大条目数
    L1TTL         time.Duration // 过期时间
    
    // L2缓存配置
    L2RedisAddr   string
    L2Password    string
    L2DB          int
    L2TTL         time.Duration
    L2MaxRetries  int
    
    // 预热配置
    WarmUpEnabled bool          // 启用预热
    WarmUpItems   []string      // 预热项目
}
```

#### 12.2.2 缓存更新策略

**Write-Through (直写)**:
```go
// 写入套餐后立即更新缓存
func UpdatePackageCache(pkg *CreditPackage) error {
    // 1. 更新数据库
    if err := db.UpdatePackage(pkg); err != nil {
        return err
    }
    
    // 2. 更新缓存
    cacheKey := fmt.Sprintf("pkg:%s", pkg.ID)
    if err := redis.Set(cacheKey, pkg, time.Hour); err != nil {
        return err
    }
    
    // 3. 更新套餐列表缓存
    packages, _ := GetAllPackages()
    redis.Set("packages:list", packages, time.Minute*30)
    
    return nil
}
```

**Write-Behind (回写)**:
```go
// 用户积分异步更新
func DeductCreditsAsync(userID string, amount int) {
    // 1. 立即更新内存缓存 (提升响应速度)
    UpdateL1Cache(userID, amount)
    
    // 2. 写入队列异步处理
    creditQueue.Push(CreditTask{
        Type:     "deduct",
        UserID:   userID,
        Amount:   amount,
        Priority: "high",
    })
    
    // 3. 后台worker异步写入数据库
    go func() {
        time.Sleep(100 * time.Millisecond) // 批量写入
        processCreditQueue()
    }()
}
```

#### 12.2.3 缓存预热
```go
// 系统启动时预热缓存
func WarmUpCache() {
    var wg sync.WaitGroup
    
    // 预热套餐数据
    wg.Add(1)
    go func() {
        defer wg.Done()
        packages, _ := GetAllPackages()
        for _, pkg := range packages {
            cacheKey := fmt.Sprintf("pkg:%s", pkg.ID)
            redis.Set(cacheKey, pkg, time.Hour)
        }
        redis.Set("packages:list", packages, time.Minute*30)
    }()
    
    // 预热热门用户数据
    wg.Add(1)
    go func() {
        defer wg.Done()
        topUsers, _ := GetTopUsers(100)
        for _, userID := range topUsers {
            credits, _ := GetUserCredits(userID)
            cacheKey := fmt.Sprintf("usr:%s:credits", userID)
            redis.Set(cacheKey, credits, time.Minute*10)
        }
    }()
    
    // 预热支付配置
    wg.Add(1)
    go func() {
        defer wg.Done()
        methods, _ := GetPaymentMethods()
        redis.Set("payment:methods", methods, time.Hour)
    }()
    
    wg.Wait()
}
```

### 12.3 并发处理

#### 12.3.1 支付确认并发优化
```go
// 并发确认多个交易
func ConfirmTransactionsConcurrently(txHashes []string) {
    sem := make(chan struct{}, 10) // 限制并发数为10
    
    var wg sync.WaitGroup
    for _, hash := range txHashes {
        wg.Add(1)
        go func(txHash string) {
            sem <- struct{}{}
            defer func() {
                <-sem
                wg.Done()
            }()
            
            // 确认交易
            if err := ConfirmSingleTransaction(txHash); err != nil {
                log.Error("确认交易失败", "hash", txHash, "error", err)
            }
        }(hash)
    }
    
    wg.Wait()
}

// 使用channel实现生产消费者模式
func ProcessPaymentQueue() {
    // 生产者: 监听链上交易
    go func() {
        for {
            tx, ok := <-paymentCh
            if !ok {
                return
            }
            orderQueue <- tx
        }
    }()
    
    // 消费者: 处理交易
    for i := 0; i < 5; i++ { // 5个worker
        go func() {
            for tx := range orderQueue {
                processPayment(tx)
            }
        }()
    }
}
```

#### 12.3.2 乐观锁防并发问题
```go
// 积分扣减使用乐观锁
func DeductCreditsWithOptimisticLock(userID string, amount int, version int) error {
    return db.Transaction(func(tx *sql.DB) error {
        // 1. 查询当前版本
        var currentVersion int
        err := tx.QueryRow(`
            SELECT version 
            FROM user_credits 
            WHERE user_id = ? FOR UPDATE
        `, userID).Scan(&currentVersion)
        
        if err != nil {
            return err
        }
        
        // 2. 检查版本是否匹配
        if currentVersion != version {
            return errors.New("concurrent_modification")
        }
        
        // 3. 扣减积分并更新版本
        _, err = tx.Exec(`
            UPDATE user_credits 
            SET available_credits = available_credits - ?,
                used_credits = used_credits + ?,
                version = version + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `, amount, amount, userID)
        
        return err
    })
}
```

---

## 13. 国际化支持

### 13.1 多语言架构

#### 13.1.1 国际化配置
```go
// 支持的语言列表
type SupportedLanguage struct {
    Code       string `json:"code"`        // zh-CN/en-US/ru-RU/uk-UA
    Name       string `json:"name"`        // 中文/English/Русский/Українська
    NativeName string `json:"native_name"` // 中文/English/Русский/Українська
    Flag       string `json:"flag"`        // 🇨🇳/🇺🇸/🇷🇺/🇺🇦
    RTL        bool   `json:"rtl"`         // 是否从右到左
    Active     bool   `json:"active"`      // 是否启用
    SortOrder  int    `json:"sort_order"`  // 排序
}

var SupportedLanguages = []SupportedLanguage{
    {Code: "zh-CN", Name: "中文", NativeName: "中文", Flag: "🇨🇳", RTL: false, Active: true, SortOrder: 1},
    {Code: "en-US", Name: "English", NativeName: "English", Flag: "🇺🇸", RTL: false, Active: true, SortOrder: 2},
    {Code: "ru-RU", Name: "Russian", NativeName: "Русский", Flag: "🇷🇺", RTL: false, Active: true, SortOrder: 3},
    {Code: "uk-UA", Name: "Ukrainian", NativeName: "Українська", Flag: "🇺🇦", RTL: false, Active: true, SortOrder: 4},
}

// 翻译键值对结构
type TranslationMap map[string]map[string]string // key -> lang_code -> translation
```

#### 13.1.2 套餐多语言配置
```go
// 套餐多语言结构
type CreditPackageI18n struct {
    ID              string            `json:"id"`
    Name            map[string]string `json:"name"`            // 多语言名称
    Description     map[string]string `json:"description"`     // 多语言描述
    ShortName       map[string]string `json:"short_name"`      // 短名称
    Features        map[string][]string `json:"features"`      // 特性列表
    BadgeText       map[string]string `json:"badge_text"`      // 标签文本
    PaymentHint     map[string]string `json:"payment_hint"`    // 支付提示
}

// 套餐翻译示例
var PackageTranslations = map[string]CreditPackageI18n{
    "starter": {
        Name: map[string]string{
            "zh-CN": "入门套餐",
            "en-US": "Starter Pack",
            "ru-RU": "Стартовый пакет",
            "uk-UA": "Стартовий пакет",
        },
        Description: map[string]string{
            "zh-CN": "适合新用户的入门套餐，体验AI交易功能",
            "en-US": "Entry package for new users to experience AI trading",
            "ru-RU": "Стартовый пакет для новых пользователей",
            "uk-UA": "Стартовий пакет для нових користувачів",
        },
        BadgeText: map[string]string{
            "zh-CN": "🔥 最超值",
            "en-US": "🔥 Best Value",
            "ru-RU": "🔥 Лучшая цена",
            "uk-UA": "🔥 Найкраща ціна",
        },
    },
}
```

### 13.2 本地化适配

#### 13.2.1 货币和价格显示
```go
// 本地化数字和货币
type LocalizedPrice struct {
    Amount      float64 `json:"amount"`
    Currency    string  `json:"currency"`    // USDT
    Symbol      string  `json:"symbol"`      // $
    Formatted   string  `json:"formatted"`   // $10.00
    Locale      string  `json:"locale"`      // en-US
    Fraction    int     `json:"fraction"`    // 小数位数
}

func FormatPrice(amount float64, currency, locale string) LocalizedPrice {
    // 不同地区的价格显示格式
    localeFormats := map[string]struct {
        Symbol   string
        Fraction int
        Format   string // 格式模板
    }{
        "en-US": {"$", 2, "$%.2f"},
        "ru-RU": {"₽", 2, "%.2f ₽"},
        "uk-UA": {"₴", 2, "%.2f ₴"},
        "zh-CN": {"¥", 2, "¥%.2f"},
    }
    
    format, ok := localeFormats[locale]
    if !ok {
        format = localeFormats["en-US"]
    }
    
    return LocalizedPrice{
        Amount:    amount,
        Currency:  currency,
        Symbol:    format.Symbol,
        Formatted: fmt.Sprintf(format.Format, amount),
        Locale:    locale,
        Fraction:  format.Fraction,
    }
}
```

#### 13.2.2 支付方式本地化
```go
// 支付方式本地化显示
type PaymentMethodI18n struct {
    Code        string            `json:"code"`
    Name        map[string]string `json:"name"`
    NetworkName map[string]string `json:"network_name"`
    Description map[string]string `json:"description"`
    Tips        map[string]string `json:"tips"`            // 支付提示
    MinNotice   map[string]string `json:"min_notice"`      // 最小金额提示
}

var PaymentMethodTranslations = map[string]PaymentMethodI18n{
    "usdt_trc20": {
        Name: map[string]string{
            "zh-CN": "USDT (TRON网络)",
            "en-US": "USDT (TRON)",
            "ru-RU": "USDT (TRON)",
            "uk-UA": "USDT (TRON)",
        },
        Tips: map[string]string{
            "zh-CN": "推荐使用，手续费低，到账快",
            "en-US": "Recommended, low fees, fast confirmation",
            "ru-RU": "Рекомендуется, низкие комиссии, быстрое подтверждение",
            "uk-UA": "Рекомендується, низькі комісії, швидке підтвердження",
        },
        MinNotice: map[string]string{
            "zh-CN": "最小转账金额: 1 USDT",
            "en-US": "Min transfer: 1 USDT",
            "ru-RU": "Мин. перевод: 1 USDT",
            "uk-UA": "Мін. переказ: 1 USDT",
        },
    },
}
```

### 13.3 邮件和通知本地化

#### 13.3.1 邮件模板多语言
```go
// 邮件模板结构
type EmailTemplate struct {
    Subject     map[string]string `json:"subject"`      // 主题
    Content     map[string]string `json:"content"`      // HTML内容
    PlainText   map[string]string `json:"plain_text"`   // 纯文本
    Variables   []string          `json:"variables"`    // 模板变量
}

// 支付成功邮件模板
var PaymentSuccessEmail = EmailTemplate{
    Subject: map[string]string{
        "zh-CN": "🎉 积分到账通知 - 您的{package_name}已激活",
        "en-US": "🎉 Credits Added - Your {package_name} is ready",
        "ru-RU": "🎉 Начисление баллов - {package_name} активирован",
        "uk-UA": "🎉 Нарахування балів - {package_name} активовано",
    },
    Content: map[string]string{
        "zh-CN": `
            <h2>支付成功！</h2>
            <p>尊敬的客户，您购买的<strong>{package_name}</strong>已激活成功。</p>
            <ul>
                <li>订单号: {order_no}</li>
                <li>购买积分: {credits}</li>
                <li>赠送积分: {bonus}</li>
                <li>支付金额: {amount} {currency}</li>
            </ul>
            <p>感谢您的购买，祝您交易愉快！</p>
        `,
        "en-US": `
            <h2>Payment Successful!</h2>
            <p>Dear customer, your <strong>{package_name}</strong> has been activated successfully.</p>
            <ul>
                <li>Order No: {order_no}</li>
                <li>Purchased Credits: {credits}</li>
                <li>Bonus Credits: {bonus}</li>
                <li>Amount Paid: {amount} {currency}</li>
            </ul>
            <p>Thank you for your purchase. Happy trading!</p>
        `,
    },
}
```

#### 13.3.2 通知推送本地化
```go
// 通知消息结构
type NotificationMessage struct {
    Type        string            `json:"type"`        // payment/order/level_up
    Priority    string            `json:"priority"`    // high/normal/low
    Title       map[string]string `json:"title"`
    Message     map[string]string `json:"message"`
    ActionText  map[string]string `json:"action_text"`
    ActionURL   string            `json:"action_url"`
    Channels    []string          `json:"channels"`    // email/sms/telegram/webpush
}

// 会员升级通知
var LevelUpNotification = NotificationMessage{
    Type:     "level_up",
    Priority: "high",
    Title: map[string]string{
        "zh-CN": "🎊 恭喜升级！",
        "en-US": "🎊 Congratulations!",
        "ru-RU": "🎊 Поздравляем!",
        "uk-UA": "🎊 Вітаємо!",
    },
    Message: map[string]string{
        "zh-CN": "您已升级为{new_level}会员，享受更多权益！",
        "en-US": "You have been upgraded to {new_level} membership with more benefits!",
        "ru-RU": "Вы повышены до уровня {new_level} с дополнительными привилегиями!",
        "uk-UA": "Вас підвищено до рівня {new_level} з додатковими привілеями!",
    },
    ActionText: map[string]string{
        "zh-CN": "查看权益",
        "en-US": "View Benefits",
        "ru-RU": "Просмотр привилегий",
        "uk-UA": "Переглянути привілеї",
    },
    Channels: []string{"email", "webpush", "telegram"},
}
```

---

## 14. 测试策略

### 14.1 单元测试

#### 14.1.1 积分服务测试
```go
// 积分服务单元测试
func TestCreditService(t *testing.T) {
    setupTestDB()
    defer cleanupTestDB()
    
    service := NewCreditService(db, redis)
    userID := "test_user_001"
    
    // 测试: 添加积分
    t.Run("AddCredits", func(t *testing.T) {
        err := service.AddCredits(userID, 500, "purchase", "pkg_001", nil)
        assert.NoError(t, err)
        
        credits, err := service.GetUserCredits(userID)
        assert.NoError(t, err)
        assert.Equal(t, 500, credits.AvailableCredits)
    })
    
    // 测试: 扣减积分
    t.Run("DeductCredits", func(t *testing.T) {
        err := service.DeductCredits(userID, 50, "trader_create", "创建交易员", "feature", "trader_001")
        assert.NoError(t, err)
        
        credits, err := service.GetUserCredits(userID)
        assert.NoError(t, err)
        assert.Equal(t, 450, credits.AvailableCredits)
        assert.Equal(t, 50, credits.UsedCredits)
    })
    
    // 测试: 积分不足
    t.Run("InsufficientCredits", func(t *testing.T) {
        err := service.DeductCredits(userID, 1000, "api_access", "API访问", "feature", "api_001")
        assert.Error(t, err)
        assert.Contains(t, err.Error(), "insufficient_credits")
    })
    
    // 测试: 冻结/解冻积分
    t.Run("FreezeUnfreeze", func(t *testing.T) {
        err := service.FreezeCredits(userID, 100, "order_payment")
        assert.NoError(t, err)
        
        credits, _ := service.GetUserCredits(userID)
        assert.Equal(t, 100, credits.FrozenCredits)
        assert.Equal(t, 350, credits.AvailableCredits)
        
        err = service.UnfreezeCredits(userID, 100, "order_cancelled")
        assert.NoError(t, err)
        
        credits, _ = service.GetUserCredits(userID)
        assert.Equal(t, 0, credits.FrozenCredits)
        assert.Equal(t, 450, credits.AvailableCredits)
    })
}
```

#### 14.1.2 订单服务测试
```go
// 订单服务测试
func TestOrderService(t *testing.T) {
    setupTestDB()
    service := NewOrderService(db, redis)
    
    t.Run("CreateOrder", func(t *testing.T) {
        order, err := service.CreateOrder("user_001", "pkg_standard")
        assert.NoError(t, err)
        assert.NotNil(t, order)
        assert.Equal(t, "pending", order.Status)
        assert.Equal(t, 10.0, order.PriceUSDT)
        assert.Equal(t, 500, order.Credits)
    })
    
    t.Run("ConfirmPayment", func(t *testing.T) {
        // 创建订单
        order, _ := service.CreateOrder("user_001", "pkg_standard")
        
        // 模拟支付
        txHash := "a1b2c3d4e5f6..."
        err := service.ConfirmPayment(order.ID, txHash, "trc20", 10.0, 20)
        assert.NoError(t, err)
        
        // 验证订单状态
        updated, _ := service.GetOrder(order.ID)
        assert.Equal(t, "completed", updated.Status)
        assert.Equal(t, txHash, updated.PaymentTxHash)
        
        // 验证积分到账
        credits, _ := service.GetUserCredits("user_001")
        assert.Equal(t, 500, credits.AvailableCredits)
    })
}
```

### 14.2 集成测试

#### 14.2.1 完整支付流程测试
```go
// 端到端支付测试
func TestFullPaymentFlow(t *testing.T) {
    setupTestEnv()
    defer cleanupTestEnv()
    
    // 步骤1: 用户登录
    userID := "e2e_test_user"
    token := loginUser(userID, "password123")
    
    // 步骤2: 选择套餐
    packages, _ := GetPackages()
    packageID := packages[1].ID // 标准套餐
    
    // 步骤3: 创建订单
    order, err := CreateOrder(token, packageID)
    assert.NoError(t, err)
    assert.Equal(t, "pending", order.Status)
    
    // 步骤4: 模拟支付 (在测试环境中)
    paymentAddr := order.PaymentAddress
    amount := order.PriceUSDT
    
    // 发送模拟交易
    txHash, err := SimulatePayment(paymentAddr, amount)
    assert.NoError(t, err)
    
    // 步骤5: 确认支付
    err = ConfirmPayment(order.ID, txHash, "trc20", amount, 20)
    assert.NoError(t, err)
    
    // 步骤6: 验证订单完成
    time.Sleep(2 * time.Second) // 等待异步处理
    completedOrder, _ := GetOrder(order.ID)
    assert.Equal(t, "completed", completedOrder.Status)
    
    // 步骤7: 验证积分到账
    credits, _ := GetUserCredits(userID)
    assert.Equal(t, 500, credits.AvailableCredits)
    
    // 步骤8: 验证积分流水
    transactions, _ := GetCreditTransactions(userID, 1, 10)
    assert.True(t, len(transactions) >= 2) // 应该有购买和赠送两笔
    
    // 步骤9: 验证通知发送
    notifications := GetUserNotifications(userID)
    assert.True(t, len(notifications) >= 1)
    assert.Contains(t, notifications[0].Title, "支付成功")
}
```

#### 14.2.2 并发测试
```go
// 并发积分扣减测试
func TestConcurrentDeduction(t *testing.T) {
    setupTestDB()
    service := NewCreditService(db, redis)
    userID := "concurrent_user"
    
    // 初始积分1000
    service.AddCredits(userID, 1000, "test", "init", nil)
    
    // 并发扣减100次，每次10积分
    var wg sync.WaitGroup
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            err := service.DeductCredits(userID, 10, "test", "concurrent", "test", fmt.Sprintf("id_%d", i))
            // 允许部分失败(积分不足)
            if err != nil {
                assert.Contains(t, err.Error(), "insufficient_credits")
            }
        }()
    }
    
    wg.Wait()
    
    // 验证最终余额 (最多剩余0或10积分)
    credits, _ := service.GetUserCredits(userID)
    assert.True(t, credits.AvailableCredits >= 0 && credits.AvailableCredits <= 10)
}
```

### 14.3 性能测试

#### 14.3.1 负载测试
```go
// 性能测试 - 套餐查询
func BenchmarkGetPackages(b *testing.B) {
    setupTestDB()
    service := NewPackageService(db, redis)
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, err := service.GetPackages()
        if err != nil {
            b.Fatalf("GetPackages failed: %v", err)
        }
    }
}

// 性能测试 - 积分扣减
func BenchmarkDeductCredits(b *testing.B) {
    setupTestDB()
    service := NewCreditService(db, redis)
    userID := "perf_test_user"
    
    // 准备测试数据
    service.AddCredits(userID, 10000, "test", "benchmark", nil)
    
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        err := service.DeductCredits(userID, 1, "benchmark", "test", "test", fmt.Sprintf("id_%d", i))
        if err != nil {
            b.Fatalf("DeductCredits failed: %v", err)
        }
    }
}
```

#### 14.3.2 压力测试脚本
```bash
#!/bin/bash
# 压力测试脚本

echo "开始压力测试..."

# 并发用户登录
ab -n 10000 -c 100 -H "Authorization: Bearer $TOKEN" \
   http://localhost:8080/api/v1/credits

# 并发套餐查询
ab -n 50000 -c 200 \
   http://localhost:8080/api/v1/packages

# 并发积分扣减
ab -n 5000 -c 50 -H "Authorization: Bearer $TOKEN" -p payload.json \
   http://localhost:8080/api/v1/consume

echo "压力测试完成"
```

### 14.4 测试覆盖率

#### 14.4.1 覆盖率目标
```yaml
# 测试覆盖率要求
coverage:
  overall: 85%           # 总体覆盖率 >= 85%
  critical: 95%          # 核心逻辑覆盖率 >= 95%
  packages: 80%          # 套餐模块 >= 80%
  orders: 85%            # 订单模块 >= 85%
  payments: 90%          # 支付模块 >= 90%
  credits: 90%           # 积分模块 >= 90%
  membership: 85%        # 会员模块 >= 85%
```

#### 14.4.2 测试报告
```bash
# 生成测试覆盖率报告
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# 查看测试覆盖率
go tool cover -func=coverage.out

# 期望输出示例:
# github.com/nofx/service/credit/service.go:45:   AddCredits            95.2%
# github.com/nofx/service/credit/service.go:67:   DeductCredits         92.8%
# github.com/nofx/service/credit/service.go:89:   FreezeCredits         90.0%
# github.com/nofx/service/credit/service.go:101:  UnfreezeCredits       88.5%
# github.com/nofx/service/credit/service.go:113:  HasEnoughCredits      100.0%
```

---

## 15. 部署方案

### 15.1 容器化部署

#### 15.1.1 Dockerfile
```dockerfile
# 多阶段构建
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY web/package*.json ./
RUN npm ci --only=production
COPY web/ ./
RUN npm run build

FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/

# 复制后端
COPY --from=backend-builder /app/main .
# 复制前端
COPY --from=frontend-builder /app/dist ./web/dist
# 复制配置文件
COPY config/ ./config/

EXPOSE 8080
CMD ["./main"]
```

#### 15.1.2 Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  # 主应用
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=nofx
      - DB_PASSWORD=password
      - DB_NAME=nofx_credits
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # PostgreSQL数据库
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=nofx
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=nofx_credits
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 15.2 Kubernetes部署

#### 15.2.1 Deployment配置
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nofx-credits
  labels:
    app: nofx-credits
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nofx-credits
  template:
    metadata:
      labels:
        app: nofx-credits
    spec:
      containers:
      - name: app
        image: nofx/credits:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: nofx-config
              key: db_host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### 15.2.2 Service配置
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: nofx-credits-service
spec:
  selector:
    app: nofx-credits
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
---
# LoadBalancer服务
apiVersion: v1
kind: Service
metadata:
  name: nofx-credits-lb
spec:
  selector:
    app: nofx-credits
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

#### 15.2.3 HPA自动扩缩容
```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nofx-credits-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nofx-credits
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 15.3 CI/CD流水线

#### 15.3.1 GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy Credit System

on:
  push:
    branches: [ main, dev ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Go
      uses: actions/setup-go@v3
      with:
        go-version: '1.21'
    
    - name: Run tests
      run: |
        go test -v -race -coverprofile=coverage.out ./...
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: |
        docker build -t nofx/credits:${{ github.sha }} .
        docker tag nofx/credits:${{ github.sha }} nofx/credits:latest

  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/dev'
    steps:
    - name: Deploy to dev
      run: |
        echo "Deploying to development environment..."
        # kubectl apply -f k8s/dev/

  deploy-prod:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # kubectl apply -f k8s/prod/
```

### 15.4 灰度发布

#### 15.4.1 金丝雀发布
```yaml
# canary-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: nofx-credits-rollout
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 30s}
      - setWeight: 50
      - pause: {duration: 60s}
      - setWeight: 100
      analysis:
        templates:
        - templateName: success-rate
        args:
        - name: service-name
          value: nofx-credits-service
  revisionHistoryLimit: 2
  selector:
    matchLabels:
      app: nofx-credits
  template:
    metadata:
      labels:
        app: nofx-credits
    spec:
      containers:
      - name: app
        image: nofx/credits:latest
```

#### 15.4.2 监控和回滚
```bash
#!/bin/bash
# 部署脚本 - 包含监控和自动回滚

DEPLOY_VERSION="$1"
MAX_ERROR_RATE=5  # 最大错误率5%

echo "开始部署版本: $DEPLOY_VERSION"

# 部署新版本
kubectl set image deployment/nofx-credits \
  app=nofx/credits:$DEPLOY_VERSION

# 等待部署完成
kubectl rollout status deployment/nofx-credits

# 监控错误率
echo "监控错误率..."
ERROR_RATE=0
for i in {1..60}; do
    # 获取错误率 (实际项目中从监控系统获取)
    ERROR_RATE=$(get_error_rate)
    echo "当前错误率: $ERROR_RATE%"
    
    if (( $(echo "$ERROR_RATE > $MAX_ERROR_RATE" | bc -l) )); then
        echo "错误率超过阈值，开始回滚..."
        kubectl rollout undo deployment/nofx-credits
        exit 1
    fi
    
    sleep 10
done

echo "部署成功完成"
```

---

## 16. 运营策略

### 16.1 用户增长策略

#### 16.1.1 新用户引导
```go
// 新用户引导流程
type OnboardingFlow struct {
    Steps []OnboardingStep `json:"steps"`
}

type OnboardingStep struct {
    Order       int                    `json:"order"`
    Title       map[string]string      `json:"title"`       // 多语言标题
    Description map[string]string      `json:"description"` // 多语言描述
    Action      string                 `json:"action"`      // 操作类型
    TargetURL   string                 `json:"target_url"`  // 跳转链接
    AutoNext    bool                   `json:"auto_next"`   // 是否自动下一步
    Reward      *OnboardingReward      `json:"reward"`      // 奖励
}

var DefaultOnboardingFlow = OnboardingFlow{
    Steps: []OnboardingStep{
        {
            Order: 1,
            Title: map[string]string{
                "zh-CN": "欢迎使用 Monnaire Trading Agent OS",
                "en-US": "Welcome to Monnaire Trading Agent OS",
            },
            Description: map[string]string{
                "zh-CN": "让我们花2分钟快速了解如何使用AI进行自动交易",
                "en-US": "Let's take 2 minutes to learn how to trade with AI",
            },
            Action: "watch_video",
            TargetURL: "/tutorial",
            AutoNext: false,
            Reward: &OnboardingReward{
                Credits: 50,
                Type: "bonus",
            },
        },
        {
            Order: 2,
            Title: map[string]string{
                "zh-CN": "创建您的第一个交易员",
                "en-US": "Create Your First Trader",
            },
            Action: "create_trader",
            TargetURL: "/traders/new",
            AutoNext: false,
        },
        {
            Order: 3,
            Title: map[string]string{
                "zh-CN": "完成首次AI决策",
                "en-US": "Make Your First AI Decision",
            },
            Action: "make_decision",
            TargetURL: "/demo",
            AutoNext: false,
            Reward: &OnboardingReward{
                Credits: 100,
                Type: "bonus",
            },
        },
    },
}
```

#### 16.1.2 推荐奖励机制
```go
// 推荐计划配置
type ReferralProgram struct {
    Enabled       bool    `json:"enabled"`        // 是否启用
    ReferrerBonus int     `json:"referrer_bonus"` // 推荐人奖励积分
    RefereeBonus  int     `json:"referee_bonus"`  // 被推荐人奖励积分
    MaxRewards    int     `json:"max_rewards"`    // 每人最大推荐次数
    ExpiryDays    int     `json:"expiry_days"`    // 奖励有效期
    Tiers         []ReferralTier `json:"tiers"`    // 阶梯奖励
}

type ReferralTier struct {
    Level       int  `json:"level"`        // 等级
    Referrals   int  `json:"referrals"`    // 需要推荐人数
    BonusMultiplier float64 `json:"bonus_multiplier"` // 奖励倍数
}

var DefaultReferralProgram = ReferralProgram{
    Enabled:       true,
    ReferrerBonus: 200,  // 推荐成功奖励200积分
    RefereeBonus:  100,  // 新用户注册奖励100积分
    MaxRewards:    50,   // 最多推荐50人
    ExpiryDays:    90,   // 奖励90天有效
    Tiers: []ReferralTier{
        {Level: 1, Referrals: 5,  BonusMultiplier: 1.0},
        {Level: 2, Referrals: 20, BonusMultiplier: 1.5},
        {Level: 3, Referrals: 50, BonusMultiplier: 2.0},
    },
}
```

### 16.2 促销活动设计

#### 16.2.1 限时折扣
```go
// 促销活动配置
type Promotion struct {
    ID              string    `json:"id"`
    Name            map[string]string `json:"name"`             // 活动名称
    Description     map[string]string `json:"description"`      // 活动描述
    Type            string    `json:"type"`                    // 类型: discount/bonus/gift
    DiscountPercent *float64  `json:"discount_percent"`        // 折扣百分比
    BonusCredits    *int      `json:"bonus_credits"`           // 赠送积分
    MinPurchase     *float64  `json:"min_purchase"`            // 最低消费
    MaxDiscount     *float64  `json:"max_discount"`            // 最大折扣
    StartTime       time.Time `json:"start_time"`              // 开始时间
    EndTime         time.Time `json:"end_time"`                // 结束时间
    UsageLimit      int       `json:"usage_limit"`             // 使用次数限制
    UsedCount       int       `json:"used_count"`              // 已使用次数
    EligibleLevels  []string  `json:"eligible_levels"`         // 适用会员等级
    Stackable       bool      `json:"stackable"`               // 是否可叠加
    Active          bool      `json:"active"`
}

// 双11活动示例
var Double11Promotion = Promotion{
    ID:   "promo_2025_1111",
    Name: map[string]string{
        "zh-CN": "双11狂欢节 - 积分买1送1",
        "en-US": "Double 11 Sale - Buy 1 Get 1",
    },
    Type:            "bonus",
    BonusCredits:    100,  // 买10U送100积分
    MinPurchase:     10.0,
    StartTime:       time.Date(2025, 11, 11, 0, 0, 0, 0, time.UTC),
    EndTime:         time.Date(2025, 11, 11, 23, 59, 59, 0, time.UTC),
    UsageLimit:      3,    // 每用户限用3次
    EligibleLevels:  []string{"free", "bronze", "silver", "gold", "platinum"},
    Stackable:       false,
    Active:          true,
}
```

#### 16.2.2 会员日活动
```go
// 每月会员日
var MemberDayPromotion = Promotion{
    ID:   "promo_monthly",
    Name: map[string]string{
        "zh-CN": "每月15日会员日 - 专享9折优惠",
        "en-US": "Member's Day 15th - 10% OFF",
    },
    Type:            "discount",
    DiscountPercent: 10.0,  // 9折
    MinPurchase:     5.0,
    StartTime:       time.Date(2025, 11, 15, 0, 0, 0, 0, time.UTC),
    EndTime:         time.Date(2025, 11, 15, 23, 59, 59, 0, time.UTC),
    UsageLimit:      1,     // 每月限用1次
    EligibleLevels:  []string{"bronze", "silver", "gold", "platinum"},
    Stackable:       false,
    Active:          true,
}
```

### 16.3 用户留存策略

#### 16.3.1 积分到期提醒
```go
// 积分到期提醒任务
type ExpiryReminderJob struct {
    userID        string
    expiringCredits int
    daysLeft      int
    scheduledTime time.Time
}

func (j *ExpiryReminderJob) SendReminder() error {
    user, _ := GetUser(j.userID)
    
    // 生成多语言提醒内容
    subjectMap := map[string]string{
        "zh-CN": fmt.Sprintf("⚠️ 您有 %d 积分将在 %d 天后过期", j.expiringCredits, j.daysLeft),
        "en-US": fmt.Sprintf("⚠️ %d credits will expire in %d days", j.expiringCredits, j.daysLeft),
    }
    
    // 发送邮件
    if err := SendEmail(user.Email, subjectMap[user.Locale], j.generateReminderContent(user)); err != nil {
        return err
    }
    
    // 站内通知
    CreateNotification(user.ID, "credits_expiring", map[string]interface{}{
        "expiring_credits": j.expiringCredits,
        "days_left":        j.daysLeft,
    })
    
    return nil
}

// 定时任务: 每天检查即将过期的积分
func ScheduleExpiryReminders() {
    ticker := time.NewTicker(24 * time.Hour)
    go func() {
        for range ticker.C {
            checkExpiringCredits()
        }
    }()
}
```

#### 16.3.2 流失用户召回
```go
// 流失用户识别和召回
type ChurnPrediction struct {
    UserID            string  `json:"user_id"`
    LastLoginAt       time.Time `json:"last_login_at"`
    DaysInactive      int     `json:"days_inactive"`
    LastPurchaseAt    time.Time `json:"last_purchase_at"`
    CreditsBalance    int     `json:"credits_balance"`
    ChurnScore        float64 `json:"churn_score"` // 0-1，分数越高流失概率越大
    RecommendedAction string  `json:"recommended_action"`
}

// 流失召回活动
var ChurnRecallCampaign = map[string]Promotion{
    "high_risk": {
        Name: map[string]string{
            "zh-CN": "专属回归礼包 - 300积分免费送",
            "en-US": "Exclusive Comeback Gift - 300 Free Credits",
        },
        Type:         "gift",
        BonusCredits: 300,
        MinPurchase:  0,  // 无需购买
        EligibleLevels: []string{"bronze", "silver", "gold", "platinum"},
        Active:       true,
    },
    "medium_risk": {
        Name: map[string]string{
            "zh-CN": "欢迎回来 - 5折优惠任选套餐",
            "en-US": "Welcome Back - 50% OFF Any Package",
        },
        Type:            "discount",
        DiscountPercent: 50.0,
        MinPurchase:     5.0,
        EligibleLevels:  []string{"free", "bronze", "silver", "gold", "platinum"},
        Active:          true,
    },
}
```

### 16.4 数据驱动优化

#### 16.4.1 A/B测试框架
```go
// A/B测试配置
type ABTest struct {
    ID          string        `json:"id"`
    Name        string        `json:"name"`
    Description string        `json:"description"`
    Variants    []TestVariant `json:"variants"`     // 测试变体
    TrafficSplit int          `json:"traffic_split"` // 流量分配百分比
    Metrics     []string      `json:"metrics"`       // 跟踪指标
    StartTime   time.Time     `json:"start_time"`
    EndTime     time.Time     `json:"end_time"`
    Status      string        `json:"status"`        // running/completed/paused
}

// 套餐定价A/B测试
var PricingABTest = ABTest{
    ID:          "ab_test_pricing_001",
    Name:        "Standard Package Pricing",
    Description: "测试标准套餐不同定价对转化率的影响",
    Variants: []TestVariant{
        {
            Name:   "control",
            Traffic: 50, // 50%用户看到原价10U
            Config: map[string]interface{}{
                "package_id": "pkg_standard",
                "price":      10.0,
                "credits":    500,
                "bonus":      50,
            },
        },
        {
            Name:   "variant_a",
            Traffic: 50, // 50%用户看到提价12U送更多积分
            Config: map[string]interface{}{
                "package_id": "pkg_standard_v2",
                "price":      12.0,
                "credits":    600,
                "bonus":      60,
            },
        },
    },
    Metrics: []string{
        "conversion_rate",
        "revenue_per_user",
        "package_selection_rate",
        "average_order_value",
    },
    StartTime: time.Now(),
    EndTime:   time.Now().Add(30 * 24 * time.Hour), // 测试30天
    Status:    "running",
}
```

#### 16.4.2 用户行为分析
```go
// 用户行为事件追踪
type UserEvent struct {
    UserID      string                 `json:"user_id"`
    SessionID   string                 `json:"session_id"`
    EventType   string                 `json:"event_type"`  // page_view/package_view/order_create
    EventName   string                 `json:"event_name"`
    Properties  map[string]interface{} `json:"properties"`   // 事件属性
    Timestamp   time.Time              `json:"timestamp"`
}

// 事件追踪示例
func TrackUserEvent(userID, eventType, eventName string, properties map[string]interface{}) {
    event := UserEvent{
        UserID:      userID,
        SessionID:   getSessionID(userID),
        EventType:   eventType,
        EventName:   eventName,
        Properties:  properties,
        Timestamp:   time.Now(),
    }
    
    // 发送到分析系统
    analyticsClient.Track(event)
    
    // 存储到数据库
    SaveUserEvent(event)
}
```

---

## 17. 项目时间表

### 17.1 开发阶段规划

#### 17.1.1 Sprint规划 (2周一个Sprint)

**Sprint 1 (Week 1-2): 基础架构搭建**
```
Day 1-2: 数据库设计
├─ 完成表结构设计
├─ 编写建表SQL
└─ 数据库测试数据准备

Day 3-5: 核心服务开发
├─ 积分服务基础CRUD
├─ 套餐管理服务
├─ 用户积分账户管理
└─ 单元测试编写

Day 6-8: API接口开发
├─ 套餐相关API
├─ 积分查询API
├─ 基础鉴权
└─ API文档生成

Day 9-10: 前端基础页面
├─ 套餐列表页面
├─ 用户积分页面
└─ 基础UI组件

Day 11-14: 集成测试
├─ 端到端测试
├─ 性能基准测试
└─ 代码审查
```

**Sprint 2 (Week 3-4): 支付系统开发**
```
Day 15-17: 订单系统
├─ 订单创建流程
├─ 订单状态管理
├─ 订单查询接口
└─ 异常订单处理

Day 18-21: 支付集成
├─ TRON/ERC20/BEP20集成
├─ 链上交易监听
├─ 自动确认机制
└─ 支付回调处理

Day 22-24: 支付页面
├─ 订单详情页
├─ 支付信息展示
├─ 二维码生成
└─ 倒计时功能

Day 25-28: 支付测试
├─ 测试网环境测试
├─ 多网络支付测试
├─ 并发支付测试
└─ 安全漏洞扫描
```

**Sprint 3 (Week 5-6): 积分消费与会员系统**
```
Day 29-31: 积分消费模块
├─ 消费项目配置
├─ 免费额度管理
├─ 积分扣减逻辑
└─ 消费记录查询

Day 32-35: 会员等级系统
├─ 会员等级配置
├─ 等级计算逻辑
├─ 会员权益计算
└─ 等级变动通知

Day 36-38: 管理后台
├─ 套餐管理页面
├─ 订单管理页面
├─ 用户管理页面
└─ 数据统计看板

Day 39-42: 功能完善
├─ 缓存优化
├─ 性能调优
├─ 错误处理完善
└─ 日志系统完善
```

**Sprint 4 (Week 7-8): 优化与部署**
```
Day 43-45: 性能优化
├─ 数据库索引优化
├─ 缓存策略优化
├─ API响应时间优化
└─ 并发处理优化

Day 46-49: 安全加固
├─ 安全测试
├─ 渗透测试
├─ 支付安全验证
└─ 数据加密验证

Day 50-52: 部署准备
├─ Docker容器化
├─ CI/CD流水线
├─ 监控告警配置
└─ 文档完善

Day 53-56: 测试与上线
├─ UAT测试
├─ 灰度发布
├─ 监控数据确认
└─ 正式发布
```

### 17.2 里程碑节点

#### 17.2.1 关键里程碑

| 里程碑 | 时间 | 交付物 | 验收标准 |
|--------|------|--------|----------|
| **M1: 基础架构完成** | Week 2 | 数据库设计、核心API、基础页面 | 通过单元测试，覆盖率>80% |
| **M2: 支付系统就绪** | Week 4 | 订单系统、支付集成、测试网环境 | 支付成功率>95% |
| **M3: 核心功能完整** | Week 6 | 积分消费、会员体系、管理后台 | 所有核心流程可用 |
| **M4: 性能达标** | Week 7 | 性能优化、缓存策略 | API响应<200ms |
| **M5: 安全审查通过** | Week 7 | 安全测试报告 | 无高危漏洞 |
| **M6: 正式上线** | Week 8 | 生产环境部署 | 系统稳定运行 |

#### 17.2.2 测试阶段规划

```
阶段1: 单元测试 (Week 1-6 持续进行)
├─ 每日构建触发
├─ 覆盖率监控
└─ 自动测试报告

阶段2: 集成测试 (Week 5-7)
├─ API集成测试
├─ 端到端测试
└─ 性能压力测试

阶段3: 安全测试 (Week 7)
├─ 安全扫描
├─ 渗透测试
└─ 代码审计

阶段4: 用户验收测试 (Week 7-8)
├─ UAT环境部署
├─ 业务场景测试
└─ 用户体验测试

阶段5: 预发布 (Week 8)
├─ 灰度发布10%
├─ 监控系统指标
└─ 灰度扩大至100%
```

### 17.3 资源投入

#### 17.3.1 人力资源

| 角色 | 人数 | 投入周期 | 主要职责 |
|------|------|----------|----------|
| **项目经理** | 1 | 8周 | 项目管理、进度跟踪、风险控制 |
| **后端工程师** | 2 | 8周 | API开发、业务逻辑、数据库设计 |
| **前端工程师** | 1 | 8周 | UI开发、前端交互、页面优化 |
| **DevOps工程师** | 1 | 6周 | 部署、监控、日志系统 |
| **测试工程师** | 1 | 6周 | 测试用例、自动化测试、性能测试 |
| **UI/UX设计师** | 0.5 | 4周 | 界面设计、交互设计 |

**总人天**: 约400人天

#### 17.3.2 技术资源

```
开发环境:
├─ 开发服务器: 4核16G x2
├─ 测试数据库: PostgreSQL 15
├─ 缓存服务器: Redis 7
├─ 前端构建: Node.js 18
└─ 版本控制: Git

测试环境:
├─ 集成测试服务器: 4核16G x2
├─ 性能测试服务器: 8核32G x1
├─ 测试网环境: TRON/ETH测试网
└─ 自动化测试: Selenium

生产环境:
├─ 应用服务器: 8核32G x3 (负载均衡)
├─ 数据库服务器: 16核64G x1 (主从)
├─ 缓存服务器: 8核32G x2 (哨兵模式)
├─ 文件存储: CDN + 对象存储
└─ 监控告警: Prometheus + Grafana
```

### 17.4 风险控制

#### 17.4.1 技术风险

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| **支付确认延迟** | 中 | 高 | 多网络并行确认、超时重试机制 |
| **数据库性能瓶颈** | 中 | 中 | 索引优化、读写分离、缓存策略 |
| **并发积分扣减冲突** | 低 | 高 | 乐观锁、事务控制、队列处理 |
| **第三方依赖故障** | 低 | 高 | 降级方案、备用服务、监控告警 |
| **安全漏洞** | 低 | 高 | 安全审计、渗透测试、数据加密 |

#### 17.4.2 进度风险

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| **需求变更** | 中 | 中 | 敏捷开发、快速迭代、版本控制 |
| **人员变动** | 低 | 中 | 知识文档化、交叉培训、备用人员 |
| **技术难点** | 中 | 中 | 技术预研、专家咨询、原型验证 |
| **测试延期** | 中 | 中 | 自动化测试、并行测试、优先级排序 |
| **部署问题** | 低 | 高 | 灰度发布、回滚方案、演练验证 |

---

## 18. 验收标准

### 18.1 功能验收标准

#### 18.1.1 套餐管理
```
✅ 验收标准:
1. 管理员可以创建/编辑/删除套餐
2. 套餐信息正确存储到数据库
3. 用户可以查看所有启用套餐
4. 推荐套餐正确标识和排序
5. 套餐购买次数限制生效
6. 多语言套餐名称正确显示

❌ 不合格示例:
- 套餐信息丢失或错误
- 用户能看到已删除套餐
- 推荐套餐显示错乱
- 无限次购买限制失效
```

#### 18.1.2 积分系统
```
✅ 验收标准:
1. 用户积分余额实时更新
2. 积分有效期正确管理
3. 积分扣减准确无误
4. 流水记录完整可追溯
5. 积分对账无差错
6. 支持批量积分调整

❌ 不合格示例:
- 积分余额显示错误
- 积分消费后未记录
- 多用户积分数据混乱
- 过期积分未正确处理
```

#### 18.1.3 订单支付
```
✅ 验收标准:
1. 订单创建流程顺畅
2. 支付地址生成正确
3. 链上确认自动完成
4. 订单状态实时更新
5. 支付成功积分到账
6. 异常订单妥善处理

❌ 不合格示例:
- 订单号重复
- 支付确认失败
- 积分未及时到账
- 超时未支付未自动取消
```

#### 18.1.4 会员体系
```
✅ 验收标准:
1. 会员等级自动计算
2. 权益折扣正确应用
3. 等级变动实时生效
4. 升级奖励及时发放
5. 会员专属功能限制生效
6. 等级图标颜色正确显示

❌ 不合格示例:
- 等级计算错误
- 折扣未生效
- 用户未升级但显示升级
- 权益限制失效
```

### 18.2 性能验收标准

#### 18.2.1 响应时间要求
```
API性能标准:
├─ 套餐查询: < 100ms (P95)
├─ 积分余额查询: < 50ms (P95)
├─ 创建订单: < 200ms (P95)
├─ 积分扣减: < 100ms (P95)
├─ 订单查询: < 150ms (P95)
└─ 会员等级查询: < 80ms (P95)

页面性能标准:
├─ 套餐列表加载: < 1.5s (FCP)
├─ 积分页面加载: < 1.0s (FCP)
├─ 支付页面加载: < 1.2s (FCP)
├─ 订单列表加载: < 1.5s (FCP)
└─ 页面切换响应: < 300ms
```

#### 18.2.2 并发处理能力
```
并发指标:
├─ 同时在线用户: 1,000+
├─ 并发API请求: 500 req/s
├─ 并发支付确认: 100 tps
├─ 并发积分扣减: 200 tps
├─ 数据库连接池: 100 连接
└─ 缓存命中率: > 90%

压力测试标准:
├─ 100并发用户: 响应时间正常
├─ 500并发用户: 响应时间增加<50%
├─ 1000并发用户: 系统不崩溃
└─ 峰值流量: 自动扩容至2倍容量
```

#### 18.2.3 可用性要求
```
系统可用性:
├─ 服务可用性: ≥ 99.9% (月)
├─ 数据库可用性: ≥ 99.95% (月)
├─ 缓存可用性: ≥ 99.9% (月)
├─ 计划内维护: 每月<4小时
├─ 故障恢复时间: < 15分钟
└─ 数据备份: 每日自动备份

容灾能力:
├─ 单机故障: 自动切换<30秒
├─ 数据库故障: 读写分离切换<1分钟
├─ 机房故障: 异地备份恢复<1小时
└─ 数据恢复: RPO≤15分钟, RTO≤1小时
```

### 18.3 安全验收标准

#### 18.3.1 数据安全
```
✅ 安全标准:
1. 敏感数据加密存储 (AES-256)
2. 传输数据HTTPS加密 (TLS 1.3)
3. 数据库连接加密
4. API密钥安全管理
5. 支付信息加密存储
6. 定期数据备份验证

❌ 安全隐患:
- 明文存储密码或密钥
- HTTP传输敏感数据
- SQL注入漏洞
- XSS跨站脚本攻击
- CSRF跨站请求伪造
```

#### 18.3.2 访问控制
```
✅ 访问控制标准:
1. 身份认证机制有效
2. 权限控制粒度到接口
3. 管理员操作有审计日志
4. 敏感操作二次验证
5. API频率限制有效
6. 防止暴力破解

❌ 权限漏洞:
- 未授权访问接口
- 权限绕过
- 越权操作
- 会话劫持
- 管理员权限泄露
```

#### 18.3.3 支付安全
```
✅ 支付安全标准:
1. 交易金额验证严格
2. 交易哈希唯一性检查
3. 防重放攻击机制
4. 多重签名验证
5. 异常交易监控告警
6. 退款流程安全可控

❌ 支付风险:
- 金额篡改
- 重复支付
- 假支付确认
- 交易回滚风险
- 资金被盗用
```

### 18.4 兼容性验收标准

#### 18.4.1 浏览器兼容
```
✅ 支持浏览器:
├─ Chrome >= 90
├─ Firefox >= 88
├─ Safari >= 14
├─ Edge >= 90
├─ 移动端Safari (iOS 14+)
└─ 移动端Chrome (Android 10+)

功能一致性:
├─ 页面布局一致
├─ 交互行为一致
├─ 数据显示一致
└─ 错误提示一致
```

#### 18.4.2 设备适配
```
✅ 响应式支持:
├─ 桌面端: 1920x1080及以上
├─ 平板端: 768x1024 - 1024x1366
├─ 手机端: 375x667 - 428x926
├─ 超宽屏: 2560x1440及以上
└─ 高DPI屏幕适配

性能优化:
├─ 移动端页面大小 < 200KB
├─ 图片懒加载
├─ 代码分割
└─ CDN加速
```

#### 18.4.3 国际化支持
```
✅ 多语言支持:
├─ 中文简体 (zh-CN)
├─ 英文 (en-US)
├─ 俄文 (ru-RU)
├─ 乌克兰文 (uk-UA)

本地化适配:
├─ 货币符号正确
├─ 日期格式正确
├─ 数字格式正确
├─ 文案长度适配
└─ 从右到左支持 (预留)
```

### 18.5 监控验收标准

#### 18.5.1 业务监控
```
✅ 监控指标:
1. 支付成功率实时监控
2. 积分消费异常告警
3. 会员等级变动统计
4. 用户活跃度分析
5. 套餐购买趋势监控
6. 转化率漏斗分析

告警机制:
├─ 支付成功率<95%: 立即告警
├─ API错误率>1%: 5分钟内告警
├─ 数据库响应>500ms: 告警
├─ 内存使用>80%: 告警
└─ 磁盘使用>90%: 告警
```

#### 18.5.2 日志要求
```
✅ 日志规范:
1. 结构化日志格式 (JSON)
2. 包含追踪ID (TraceID)
3. 用户操作完整记录
4. 错误堆栈完整保存
5. 敏感信息自动脱敏
6. 日志保留90天以上

日志级别:
├─ ERROR: 系统错误、异常
├─ WARN: 业务警告、失败重试
├─ INFO: 重要业务操作
└─ DEBUG: 开发调试信息
```

#### 18.5.3 报表要求
```
✅ 运营报表:
1. 每日收入报表
2. 用户增长报表
3. 积分流通报表
4. 会员等级分布
5. 套餐销售排行
6. 转化率分析

财务报表:
├─ 月度收入明细
├─ 退款统计
├─ 手续费统计
├─ 用户ARPU分析
└─ 收入趋势预测
```

---

## 总结

### 价值交付

本提案构建了一套**完整、专业、企业级**的会员积分套餐体系，包含:

**核心功能模块**:
- ✅ 套餐管理 (多层级定价策略)
- ✅ 用户积分 (余额/有效期/流水管理)
- ✅ 订单支付 (多链支付/自动确认)
- ✅ 积分消费 (免费额度/按需付费)
- ✅ 会员体系 (等级/折扣/权益)
- ✅ 管理后台 (数据分析/运营管理)

**技术架构**:
- ✅ 数据库设计 (9张核心表)
- ✅ RESTful API (40+接口)
- ✅ 前端UI (响应式/多语言)
- ✅ 安全性设计 (加密/鉴权/审计)
- ✅ 性能优化 (缓存/索引/并发)
- ✅ 监控告警 (业务/系统/安全)

**运营支持**:
- ✅ 新用户引导流程
- ✅ 推荐奖励机制
- ✅ 促销活动系统
- ✅ 用户留存策略
- ✅ A/B测试框架
- ✅ 数据驱动优化

**交付质量**:
- ✅ 开发周期: 8周 (4个Sprint)
- ✅ 测试覆盖率: >85%
- ✅ API响应时间: <200ms
- ✅ 系统可用性: >99.9%
- ✅ 安全等级: 企业级
- ✅ 可维护性: 模块化设计

### 商业价值

**收入增长**:
- 付费转化率预期提升至5%+
- ARPU (平均每用户收入) > $15/月
- 年度收入增长: $500K+ (基于1000付费用户)

**用户价值**:
- 免费试用降低门槛
- 积分制灵活消费
- 会员权益激励留存
- 推荐奖励口碑传播

**平台价值**:
- 建立可持续商业模式
- 积累用户行为数据
- 优化产品迭代方向
- 提升品牌竞争力

### 技术亮点

1. **灵活套餐体系** - 支持动态配置、多语言、多层级定价
2. **智能积分系统** - 有效期管理、余额明细、流水可追溯
3. **安全支付机制** - 多链支持、自动确认、防重放攻击
4. **会员等级系统** - 自动化等级计算、差异化权益
5. **高性能架构** - 缓存优化、数据库优化、并发处理
6. **企业级安全** - 数据加密、访问控制、审计日志
7. **完善监控** - 业务监控、系统监控、异常告警
8. **国际化支持** - 多语言、多币种、多时区适配

---

**提案价值: $1,500 USD**  
**开发周期: 8周**  
**交付质量: 生产就绪**

