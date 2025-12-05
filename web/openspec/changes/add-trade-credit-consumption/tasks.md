# 任务清单 v2

> 基于架构审计和Crypto专家审计修订

## 0. 设计修订（已完成）

- [x] 0.1 定义 `TradeType` 枚举，区分手动/止损/止盈
- [x] 0.2 修改 `CreditConsumer` 接口为两阶段提交模式
- [x] 0.3 添加积分锁定/释放机制
- [x] 0.4 定义部分成交的计费规则
- [x] 0.5 添加幂等性保证（tradeID去重）

## 1. 类型定义

- [ ] 1.1 创建 `trader/types.go`
  - 定义 `TradeType` 枚举（Manual/StopLoss/TakeProfit/ForceClose）
  - 实现 `ShouldConsumeCredit()` 方法
  - 添加单元测试

- [ ] 1.2 创建 `trader/errors.go`
  - 定义 `ErrInsufficientCredits`
  - 定义 `ErrReservationExpired`
  - 定义 `ErrReservationAlreadyConfirmed`

## 2. 接口定义

- [ ] 2.1 在 `trader/interface.go` 中添加
  - `CreditConsumer` 接口（ReserveCredit方法）
  - `CreditReservation` 结构体
  - `Confirm()` 和 `Release()` 方法签名

- [ ] 2.2 在 `AutoTraderInterface` 中添加
  - `SetCreditConsumer(cc CreditConsumer)`
  - `GetUserID() string`

## 3. 数据库层

- [ ] 3.1 修改 `config/credits.go`
  - 实现 `ReserveCreditForTrade()` - 事务锁定
  - 实现 `ConfirmCreditConsumption()` - 确认扣减
  - 实现 `CheckTransactionExists()` - 幂等性检查

- [ ] 3.2 数据库迁移
  - 添加 `uk_reference_id` 唯一约束到 `credit_transactions`
  - 创建 `credit_compensation_tasks` 表（可选）

- [ ] 3.3 创建 `config/credits_test.go`
  - 测试 `ReserveCreditForTrade` 锁定成功
  - 测试积分不足场景
  - 测试并发锁定（只有一个成功）
  - 测试事务超时

## 4. 积分消耗实现

- [ ] 4.1 创建 `trader/credit_consumer.go`
  - 实现 `TradeCreditConsumer` 结构体
  - 实现 `ReserveCredit()` - 包含幂等性检查
  - 实现 `CreditReservation.Confirm()` - 提交事务
  - 实现 `CreditReservation.Release()` - 回滚事务

- [ ] 4.2 创建 `trader/credit_consumer_test.go`
  - 测试 `ReserveCredit` 积分充足
  - 测试 `ReserveCredit` 积分不足
  - 测试 `Confirm` 成功扣减
  - 测试 `Release` 释放锁定
  - 测试幂等性（重复tradeID）
  - **测试并发竞态（10个goroutine抢1积分）**
  - 运行 `go test -race` 验证

## 5. 交易员集成

- [ ] 5.1 修改 `trader/auto_trader_enhanced.go`
  - 添加 `userID string` 字段
  - 添加 `creditConsumer CreditConsumer` 字段
  - 添加 `SetCreditConsumer()` 方法
  - 修改 `executeDecision()` 接受 `TradeType` 参数
  - 集成两阶段积分消耗逻辑
  - 添加补偿调度逻辑

- [ ] 5.2 修改止损/止盈触发点
  - 在 `checkAndUpdateStopOrdersEnhanced()` 中传递 `TradeTypeStopLoss`
  - 在止盈逻辑中传递 `TradeTypeTakeProfit`
  - 确保系统触发的交易不扣积分

- [ ] 5.3 修改 `trader/auto_trader_enhanced_test.go`
  - 测试无 CreditConsumer 时正常交易（向后兼容）
  - 测试手动交易成功扣积分
  - 测试手动交易失败释放积分
  - 测试止损触发不扣积分
  - 测试止盈触发不扣积分
  - 测试积分不足拒绝手动交易

## 6. 管理器集成

- [ ] 6.1 修改 `manager/trader_manager.go`
  - 添加 `creditService *credits.Service` 依赖
  - 在 `NewTraderManager()` 中接受可选 `credits.Service`
  - 在 `LoadTradersFromDatabase()` 中创建 `TradeCreditConsumer`
  - 为每个交易员注入 `CreditConsumer` 和 `userID`

- [ ] 6.2 修改 `manager/trader_manager_test.go`
  - 测试无 creditService 时正常运行
  - 测试交易员正确绑定 `CreditConsumer`
  - 测试交易员正确绑定 `userID`

## 7. 补偿机制（可选）

- [ ] 7.1 创建 `trader/compensation.go`
  - 定义 `CompensationTask` 结构体
  - 实现 `scheduleCompensation()` 方法
  - 实现 `CompensationService.ProcessPendingTasks()`

- [ ] 7.2 创建数据库表
  - `credit_compensation_tasks` 表

- [ ] 7.3 创建 `trader/compensation_test.go`
  - 测试补偿任务创建
  - 测试补偿任务处理

## 8. 集成测试

- [ ] 8.1 创建 `trader/integration_test.go`
  - 端到端测试：创建交易员 → 手动交易 → 验证积分扣减
  - 端到端测试：止损触发 → 验证积分不变
  - 使用测试数据库

## 9. 验证

- [ ] 9.1 运行所有测试
  ```bash
  go test ./trader/... -v -cover
  go test ./manager/... -v -cover
  go test ./config/... -v -cover
  ```

- [ ] 9.2 运行竞态检测
  ```bash
  go test -race ./trader/...
  ```

- [ ] 9.3 验证测试覆盖率
  ```bash
  go test ./trader/... -coverprofile=coverage.out
  go tool cover -func=coverage.out
  # 确保 >= 90%
  ```

- [ ] 9.4 手动测试
  - [ ] 创建交易员，执行手动交易，验证积分扣减
  - [ ] 设置止损，触发止损，验证积分不变
  - [ ] 积分归零，尝试交易，验证被拒绝
  - [ ] 验证积分流水记录正确

- [ ] 9.5 验证现有功能不受影响
  - [ ] 无 CreditConsumer 的交易员正常运行
  - [ ] Kelly止盈止损正常工作
  - [ ] 现有API正常响应
