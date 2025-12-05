# Manager 模块规范增量 v2

> 基于架构审计和Crypto专家审计修订

## MODIFIED Requirements

### Requirement: TraderManager 依赖注入

`TraderManager` 必须支持注入积分服务依赖。

#### Scenario: 构造函数注入
- **WHEN** 创建 `TraderManager`
- **THEN** 可选注入 `*credits.Service` 依赖
- **AND** 可选注入 `*config.Database` 依赖（用于事务操作）

#### Scenario: 无积分服务时兼容
- **WHEN** 创建 `TraderManager` 且未提供 `credits.Service`
- **THEN** 正常运行
- **AND** 交易员不检查积分（向后兼容）

---

### Requirement: 加载交易员时注入积分消费者

从数据库加载交易员时必须注入积分消费者。

#### Scenario: 创建积分消费者
- **WHEN** 调用 `LoadTradersFromDatabase()` 且已配置 `credits.Service`
- **THEN** 创建 `TradeCreditConsumer` 实例
- **AND** 为每个交易员注入该消费者

#### Scenario: 绑定正确的用户ID
- **WHEN** 为交易员注入积分消费者
- **THEN** 交易员的 `userID` 必须正确设置为其所属用户
- **AND** 从数据库交易员配置中获取 `user_id`

#### Scenario: 加载用户交易员时注入
- **WHEN** 调用 `LoadUserTraders(database, userID)` 且已配置 `credits.Service`
- **THEN** 为该用户的所有交易员创建并注入 `TradeCreditConsumer`
- **AND** 设置正确的 `userID`

---

### Requirement: 积分消费者生命周期管理

积分消费者必须在交易员整个生命周期内有效。

#### Scenario: 启动时积分消费者可用
- **WHEN** 调用 `StartAll()` 启动所有交易员
- **THEN** 每个交易员的 `CreditConsumer` 已正确设置
- **AND** 每个交易员的 `userID` 已正确设置

#### Scenario: 停止时无需清理
- **WHEN** 调用 `StopAll()` 停止所有交易员
- **THEN** `CreditConsumer` 无需特殊清理（无状态）

---

### Requirement: 新增交易员时注入积分消费者

动态添加交易员时必须注入积分消费者。

#### Scenario: 动态添加交易员
- **WHEN** 通过 API 或其他方式动态添加交易员
- **AND** `TraderManager` 已配置 `credits.Service`
- **THEN** 为新交易员创建并注入 `TradeCreditConsumer`
- **AND** 设置正确的 `userID`

---

## ADDED Requirements

### Requirement: TraderManager 工厂方法

提供创建 `TradeCreditConsumer` 的工厂方法。

#### Scenario: 创建积分消费者
- **WHEN** 调用 `tm.NewCreditConsumer(userID string)`
- **THEN** 返回配置好的 `TradeCreditConsumer` 实例
- **AND** 如果 `tm.creditService` 为 nil，返回 nil

---

### Requirement: 配置验证

启动时验证积分服务配置正确。

#### Scenario: 验证数据库连接
- **WHEN** `TraderManager` 配置了 `credits.Service`
- **AND** 调用 `StartAll()`
- **THEN** 验证数据库连接可用
- **AND** 验证 `user_credits` 表存在

#### Scenario: 配置错误处理
- **WHEN** 数据库连接不可用
- **THEN** 记录错误日志
- **AND** 交易员仍然启动（降级运行）
- **AND** 积分检查跳过
