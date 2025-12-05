# Trader 模块规范增量 v2

> 基于架构审计和Crypto专家审计修订

## ADDED Requirements

### Requirement: TradeType 交易类型枚举

系统必须区分不同的交易触发类型，以决定是否消耗积分。

#### Scenario: 定义交易类型
- **WHEN** 系统需要执行交易
- **THEN** 必须指定以下交易类型之一：
  - `TradeTypeManual` - 用户主动交易（扣积分）
  - `TradeTypeStopLoss` - 止损自动平仓（不扣积分）
  - `TradeTypeTakeProfit` - 止盈自动平仓（不扣积分）
  - `TradeTypeForceClose` - 强制平仓/清算（不扣积分）

#### Scenario: 判断是否消耗积分
- **WHEN** 调用 `TradeType.ShouldConsumeCredit()`
- **THEN** 仅 `TradeTypeManual` 返回 `true`，其他返回 `false`

---

### Requirement: CreditConsumer 两阶段提交接口

系统必须提供 `CreditConsumer` 接口，使用两阶段提交模式保证积分操作原子性。

#### Scenario: 接口定义
- **WHEN** 交易员需要消耗积分
- **THEN** 通过 `CreditConsumer.ReserveCredit()` 预留积分

#### Scenario: 预留方法签名
- **WHEN** 定义 `CreditConsumer` 接口
- **THEN** 必须包含方法：
  ```go
  ReserveCredit(userID, tradeID string) (*CreditReservation, error)
  ```

---

### Requirement: CreditReservation 积分预留凭证

系统必须提供 `CreditReservation` 结构体，管理积分锁定的生命周期。

#### Scenario: 确认扣减
- **WHEN** 交易成功后调用 `Reservation.Confirm(symbol, action, traderID)`
- **THEN** 提交数据库事务，记录积分流水，返回 `nil`

#### Scenario: 释放锁定
- **WHEN** 交易失败后调用 `Reservation.Release()`
- **THEN** 回滚数据库事务，释放锁定的积分，返回 `nil`

#### Scenario: 幂等性处理
- **WHEN** tradeID 已被处理过
- **THEN** `ReserveCredit` 返回 `alreadyProcessed=true` 的 Reservation
- **AND** 后续 `Confirm()` 或 `Release()` 调用为空操作

---

### Requirement: TradeCreditConsumer 实现

系统必须提供 `TradeCreditConsumer` 结构体，实现 `CreditConsumer` 接口。

#### Scenario: 积分充足预留
- **WHEN** 调用 `ReserveCredit(userID, tradeID)` 且用户积分 >= 1
- **THEN** 使用 `SELECT ... FOR UPDATE` 锁定用户积分行
- **AND** 预扣减1积分（事务内）
- **AND** 返回包含事务的 `CreditReservation`

#### Scenario: 积分不足预留失败
- **WHEN** 调用 `ReserveCredit(userID, tradeID)` 且用户积分 < 1
- **THEN** 回滚事务
- **AND** 返回 `ErrInsufficientCredits` 错误

#### Scenario: 事务超时处理
- **WHEN** 事务持有锁超过5秒
- **THEN** 自动回滚事务
- **AND** 释放积分锁定

#### Scenario: 流水记录格式
- **WHEN** 成功确认积分消耗
- **THEN** 流水记录包含：
  - `type`: "debit"
  - `amount`: 1
  - `category`: "trade"
  - `description`: "交易消耗: [symbol] [action] by [traderID]"
  - `reference_id`: tradeID（幂等键）

---

### Requirement: 并发安全保证

系统必须保证高并发下积分操作的正确性。

#### Scenario: 并发预留竞争
- **WHEN** 多个交易同时请求预留同一用户的最后1积分
- **THEN** 只有1个预留成功
- **AND** 其他预留返回 `ErrInsufficientCredits`

#### Scenario: 无竞态条件
- **WHEN** 运行 `go test -race ./trader/...`
- **THEN** 无竞态警告

---

### Requirement: 交易员积分检查（手动交易）

增强版交易员执行**手动交易**前必须检查并锁定积分。

#### Scenario: 手动交易积分充足
- **WHEN** 交易类型为 `TradeTypeManual`
- **AND** `CreditConsumer.ReserveCredit()` 成功
- **THEN** 执行交易逻辑
- **AND** 交易成功后调用 `Reservation.Confirm()`

#### Scenario: 手动交易积分不足
- **WHEN** 交易类型为 `TradeTypeManual`
- **AND** `CreditConsumer.ReserveCredit()` 返回 `ErrInsufficientCredits`
- **THEN** 拒绝执行交易
- **AND** 记录警告日志
- **AND** 返回 `ErrInsufficientCredits`

#### Scenario: 手动交易失败释放积分
- **WHEN** 交易类型为 `TradeTypeManual`
- **AND** 交易执行失败
- **THEN** 调用 `Reservation.Release()` 释放锁定的积分

---

### Requirement: 系统触发交易不消耗积分

止损、止盈、强制平仓等系统触发的交易不消耗积分。

#### Scenario: 止损不扣积分
- **WHEN** 交易类型为 `TradeTypeStopLoss`
- **THEN** 不调用 `CreditConsumer`
- **AND** 正常执行平仓逻辑

#### Scenario: 止盈不扣积分
- **WHEN** 交易类型为 `TradeTypeTakeProfit`
- **THEN** 不调用 `CreditConsumer`
- **AND** 正常执行平仓逻辑

#### Scenario: 强制平仓不扣积分
- **WHEN** 交易类型为 `TradeTypeForceClose`
- **THEN** 不调用 `CreditConsumer`
- **AND** 正常执行平仓逻辑

---

### Requirement: 向后兼容

无 CreditConsumer 时交易员正常运行。

#### Scenario: 无积分消费者
- **WHEN** 交易员未设置 `CreditConsumer`（nil）
- **THEN** 正常执行交易
- **AND** 不检查积分
- **AND** 不扣减积分

---

## MODIFIED Requirements

### Requirement: AutoTraderInterface 接口扩展

在 `AutoTraderInterface` 接口中新增积分消费者和用户ID相关方法。

#### Scenario: 设置积分消费者
- **WHEN** 调用 `SetCreditConsumer(cc CreditConsumer)`
- **THEN** 交易员使用该消费者进行积分预留和确认

#### Scenario: 获取用户ID
- **WHEN** 调用 `GetUserID() string`
- **THEN** 返回交易员所属用户的ID

---

### Requirement: EnhancedAutoTrader 结构体扩展

在 `EnhancedAutoTrader` 结构体中新增积分相关字段。

#### Scenario: 新增字段
- **WHEN** 创建 `EnhancedAutoTrader`
- **THEN** 包含以下新字段：
  - `userID string` - 所属用户ID
  - `creditConsumer CreditConsumer` - 积分消费者（可选）

---

### Requirement: executeDecision 方法签名变更

`executeDecision` 方法必须接受交易类型参数。

#### Scenario: 方法签名
- **WHEN** 调用 `executeDecision(decision *Decision, tradeType TradeType)`
- **THEN** 根据 `tradeType` 决定是否消耗积分

---

### Requirement: 止损/止盈触发点传递正确类型

Kelly止损止盈触发时必须传递正确的交易类型。

#### Scenario: 止损触发
- **WHEN** `checkAndUpdateStopOrdersEnhanced()` 触发止损
- **THEN** 调用 `executeDecision(decision, TradeTypeStopLoss)`

#### Scenario: 止盈触发
- **WHEN** Kelly止盈逻辑触发平仓
- **THEN** 调用 `executeDecision(decision, TradeTypeTakeProfit)`
