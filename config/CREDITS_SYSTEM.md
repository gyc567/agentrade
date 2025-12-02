# 积分系统文档

## 概述

本积分系统为 nofx 项目提供完整的积分管理功能，包括积分套餐、用户积分账户、积分流水记录等。系统支持并发安全、事务原子性、审计日志等企业级特性。

## 数据库表结构

### 1. credit_packages (积分套餐表)

存储系统提供的积分套餐信息。

```sql
CREATE TABLE credit_packages (
    id TEXT PRIMARY KEY,                    -- 套餐ID
    name TEXT NOT NULL,                     -- 套餐名称（中文）
    name_en TEXT NOT NULL,                  -- 套餐名称（英文）
    description TEXT DEFAULT '',            -- 套餐描述
    price_usdt REAL NOT NULL,               -- 价格（USDT）
    credits INTEGER NOT NULL,               -- 基础积分
    bonusCredits INTEGER DEFAULT 0,         -- 赠送积分
    is_active BOOLEAN DEFAULT true,         -- 是否启用
    is_recommended BOOLEAN DEFAULT false,   -- 是否推荐
    sort_order INTEGER DEFAULT 0,           -- 排序顺序
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. user_credits (用户积分账户表)

存储用户的积分余额信息。

```sql
CREATE TABLE user_credits (
    id TEXT PRIMARY KEY,                    -- 账户ID
    user_id TEXT NOT NULL UNIQUE,           -- 用户ID
    available_credits INTEGER DEFAULT 0,    -- 可用积分
    total_credits INTEGER DEFAULT 0,        -- 总充值积分
    used_credits INTEGER DEFAULT 0,         -- 已使用积分
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. credit_transactions (积分流水表)

记录所有积分变动流水。

```sql
CREATE TABLE credit_transactions (
    id TEXT PRIMARY KEY,                    -- 流水ID
    user_id TEXT NOT NULL,                  -- 用户ID
    type TEXT NOT NULL,                     -- 类型：credit(充值)/debit(扣减)
    amount INTEGER NOT NULL,                -- 变动积分数量
    balance_before INTEGER NOT NULL,        -- 变动前余额
    balance_after INTEGER NOT NULL,         -- 变动后余额
    category TEXT NOT NULL,                 -- 类别：purchase/consume/gift/refund/admin
    description TEXT NOT NULL,              -- 描述
    reference_id TEXT DEFAULT '',           -- 关联ID（如订单ID）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 核心功能

### 1. 积分套餐管理

#### GetActivePackages()
获取所有启用的积分套餐，按排序顺序返回。

```go
packages, err := db.GetActivePackages()
if err != nil {
    log.Fatal(err)
}
```

#### GetPackageByID(id string)
根据ID获取特定套餐。

```go
pkg, err := db.GetPackageByID("standard_500")
if err != nil {
    log.Fatal(err)
}
```

#### GetAllCreditPackages()
获取所有套餐（包括禁用的）。

```go
packages, err := db.GetAllCreditPackages()
```

#### CreateCreditPackage(pkg *CreditPackage)
创建新套餐。

```go
pkg := &config.CreditPackage{
    ID:            "custom_888",
    Name:          "自定义套餐",
    NameEN:        "Custom Package",
    Description:   "888积分个性套餐",
    PriceUSDT:     66.66,
    Credits:       888,
    BonusCredits:  88,
    IsActive:      true,
    IsRecommended: false,
    SortOrder:     5,
}
err := db.CreateCreditPackage(pkg)
```

#### UpdateCreditPackage(pkg *CreditPackage)
更新套餐信息。

```go
err := db.UpdateCreditPackage(pkg)
```

#### DeleteCreditPackage(id string)
删除套餐（软删除，设置 is_active = false）。

```go
err := db.DeleteCreditPackage("custom_888")
```

### 2. 用户积分账户

#### GetUserCredits(userID string)
获取用户积分（不存在则返回错误）。

```go
credits, err := db.GetUserCredits("user_123")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("可用积分: %d\n", credits.AvailableCredits)
```

#### GetOrCreateUserCredits(userID string)
获取或创建用户积分账户，使用 UPSERT 避免竞争条件。

```go
credits, err := db.GetOrCreateUserCredits("user_123")
```

### 3. 积分操作

#### AddCredits(userID, amount, category, description, refID string)
增加积分，使用事务保证原子性，包含行级锁防止并发问题。

```go
err := db.AddCredits("user_123", 500, "purchase",
    "购买标准套餐", "order_abc123")
if err != nil {
    log.Fatal(err)
}
```

#### DeductCredits(userID, amount, category, description, refID string)
扣减积分，检查余额是否充足，使用事务保证原子性。

```go
err := db.DeductCredits("user_123", 100, "consume",
    "AI交易分析服务", "service_xyz789")
if err != nil {
    log.Fatal(err)
}
```

#### HasEnoughCredits(userID string, amount int)
检查积分是否充足。

```go
if db.HasEnoughCredits("user_123", 100) {
    fmt.Println("积分充足")
}
```

### 4. 积分流水查询

#### GetUserTransactions(userID, page, limit int)
获取用户积分流水，支持分页。

```go
transactions, total, err := db.GetUserTransactions("user_123", 1, 10)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("共 %d 条流水记录\n", total)
for _, txn := range transactions {
    fmt.Printf("[%s] %s: %d积分 (余额: %d)\n",
        txn.Type, txn.Description, txn.Amount, txn.BalanceAfter)
}
```

#### GetUserCreditSummary(userID string)
获取用户积分摘要统计。

```go
summary, err := db.GetUserCreditSummary("user_123")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("可用积分: %d\n", summary["available_credits"])
fmt.Printf("本月消费: %d\n", summary["monthly_consumption"])
```

### 5. 管理员功能

#### AdjustUserCredits(adminID, userID string, amount int, reason, ipAddress string)
管理员调整用户积分，自动记录审计日志。

```go
err := db.AdjustUserCredits("admin_001", "user_123", 1000,
    "新用户奖励", "192.168.1.1")
if err != nil {
    log.Fatal(err)
}
```

## 关键特性

### 1. 并发安全
- `AddCredits` 和 `DeductCredits` 使用 `SELECT ... FOR UPDATE` 行级锁
- 防止并发操作导致的数据不一致

### 2. 事务原子性
- 积分变动和流水记录在同一事务中
- 失败时自动回滚，保证数据一致性

### 3. 自动创建账户
- `GetOrCreateUserCredits` 使用 UPSERT 自动创建不存在的用户账户
- 避免用户首次使用时需要手动创建账户

### 4. 审计日志
- 管理员操作自动记录审计日志
- 可追踪所有管理员操作

### 5. 错误处理
- 积分不足检查
- 参数验证
- 详细错误信息

### 6. 重试机制
- 使用 withRetry 处理 Neon PostgreSQL 冷启动问题
- 最多重试3次，指数退避策略

## 积分类别说明

### Type (类型)
- `credit`: 充值（增加积分）
- `debit`: 消费（扣减积分）

### Category (类别)
- `purchase`: 购买套餐
- `consume`: 使用服务
- `gift`: 赠送
- `refund`: 退款
- `admin`: 管理员调整

## 典型使用场景

### 场景1: 用户购买积分套餐
```go
// 1. 获取套餐信息
pkg, _ := db.GetPackageByID("standard_500")

// 2. 支付流程（通过支付系统）
paymentOrderID := processPayment(pkg.PriceUSDT)

// 3. 增加积分
totalCredits := pkg.Credits + pkg.BonusCredits
err := db.AddCredits(userID, totalCredits, "purchase",
    fmt.Sprintf("购买套餐: %s", pkg.Name), paymentOrderID)

// 4. 验证
credits, _ := db.GetUserCredits(userID)
fmt.Printf("当前积分: %d\n", credits.AvailableCredits)
```

### 场景2: 用户使用积分消费
```go
// 1. 检查积分
if !db.HasEnoughCredits(userID, 100) {
    fmt.Println("积分不足，请先充值")
    return
}

// 2. 扣减积分
err := db.DeductCredits(userID, 100, "consume",
    "AI交易分析服务", "service_xyz789")

// 3. 使用服务
processAIService(userID)
```

### 场景3: 管理员调整积分
```go
// 新用户奖励
err := db.AdjustUserCredits("admin_001", userID, 1000,
    "新用户注册奖励", "192.168.1.100")

// 违规处罚
err = db.AdjustUserCredits("admin_001", userID, -500,
    "违反使用条款", "192.168.1.100")
```

## 默认数据

系统初始化时会创建以下默认套餐：

1. **基础套餐** (basic_100)
   - 100积分，价格9.99 USDT

2. **标准套餐** (standard_500) ⭐推荐
   - 500积分 + 50赠送，价格39.99 USDT

3. **高级套餐** (premium_1200)
   - 1200积分 + 200赠送，价格79.99 USDT

4. **企业套餐** (enterprise_3000)
   - 3000积分 + 600赠送，价格199.99 USDT

## 注意事项

1. **并发安全**: 所有积分变动操作都使用行级锁保证并发安全
2. **事务保证**: 积分操作和流水记录在同一事务中
3. **错误处理**: 建议在调用积分操作时检查返回值错误
4. **审计日志**: 管理员操作会自动记录到 audit_logs 表
5. **分页限制**: 积分流水查询建议分页，单页不超过100条
6. **性能优化**: 频繁查询可考虑缓存用户积分信息

## 扩展建议

1. **积分有效期**: 可扩展支持积分过期时间
2. **批量操作**: 可添加批量积分调整功能
3. **积分兑换**: 可扩展积分兑换商品或服务
4. **等级系统**: 可基于积分数量设置用户等级
5. **推荐奖励**: 可添加推荐注册奖励机制

## 示例代码

完整的使用示例请参考 `config/credits_example.go` 文件。

```go
package main

import (
    "log"
    "nofx/config"
)

func main() {
    // 初始化数据库
    db, err := config.NewDatabase(databaseURL)
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    // 获取套餐列表
    packages, err := db.GetActivePackages()
    if err != nil {
        log.Fatal(err)
    }

    for _, pkg := range packages {
        fmt.Printf("%s: %.2f USDT (%d积分)\n",
            pkg.Name, pkg.PriceUSDT, pkg.Credits)
    }
}
```
