# 设计文档 v2

> 基于架构审计和Crypto专家审计修订

## 核心设计决策

### 1. 两阶段提交 vs 单步扣减

**v1（错误）**：检查和扣减分离
```go
// 竞态条件：检查通过后，扣减前可能被其他交易抢占
if !creditConsumer.CanTrade(userID) {
    return ErrInsufficientCredits
}
defer creditConsumer.ConsumeTrade(...)  // 可能失败！
```

**v2（正确）**：两阶段提交
```go
// 原子锁定 → 执行 → 确认/释放
reservation, err := creditConsumer.ReserveCredit(userID, tradeID)
if err != nil {
    return ErrInsufficientCredits
}
defer func() {
    if tradeSuccess {
        reservation.Confirm()
    } else {
        reservation.Release()
    }
}()
```

**设计理由**：
- 锁定阶段使用 `SELECT ... FOR UPDATE` 获得行锁
- 交易期间积分被锁定，其他交易无法抢占
- 成功提交事务，失败回滚，保证一致性

### 2. 交易类型分离

**问题**：v1 未区分交易触发源，导致止损/止盈也扣积分

**解决**：定义 `TradeType` 枚举

```go
// trader/types.go
type TradeType int

const (
    // TradeTypeManual 用户主动交易（AI决策、手动操作）
    // 扣积分：是
    TradeTypeManual TradeType = iota

    // TradeTypeStopLoss 止损自动平仓
    // 扣积分：否（系统保护机制）
    TradeTypeStopLoss

    // TradeTypeTakeProfit 止盈自动平仓
    // 扣积分：否（系统保护机制）
    TradeTypeTakeProfit

    // TradeTypeForceClose 强制平仓/清算
    // 扣积分：否（交易所触发）
    TradeTypeForceClose
)

// ShouldConsumeCredit 判断该交易类型是否需要消耗积分
func (t TradeType) ShouldConsumeCredit() bool {
    return t == TradeTypeManual
}
```

### 3. 幂等性保证

**问题**：重试可能导致重复扣减

**解决**：使用 tradeID 去重

```go
// 在 credit_transactions 表中添加唯一约束
ALTER TABLE credit_transactions
ADD CONSTRAINT uk_reference_id UNIQUE (reference_id);

// 扣减时检查
func (s *TradeCreditConsumer) ReserveCredit(userID, tradeID string) (*Reservation, error) {
    // 检查是否已处理
    exists, err := s.db.CheckTransactionExists(tradeID)
    if err != nil {
        return nil, err
    }
    if exists {
        return &Reservation{alreadyProcessed: true}, nil  // 幂等返回
    }

    // 执行锁定...
}
```

## 接口设计 v2

```go
// trader/interface.go

// CreditConsumer 交易积分消费接口 v2
// 使用两阶段提交模式保证原子性
type CreditConsumer interface {
    // ReserveCredit 预留积分（第一阶段）
    // 锁定1积分用于交易，返回预留凭证
    // 如果积分不足，返回 ErrInsufficientCredits
    // 如果 tradeID 已处理过，返回已确认的 Reservation（幂等）
    ReserveCredit(userID, tradeID string) (*CreditReservation, error)
}

// CreditReservation 积分预留凭证
type CreditReservation struct {
    id               string
    userID           string
    tradeID          string
    amount           int
    tx               *sql.Tx
    confirmed        bool
    alreadyProcessed bool  // 幂等标记
}

// Confirm 确认扣减（第二阶段 - 成功路径）
// 提交事务，记录积分流水
func (r *CreditReservation) Confirm(symbol, action, traderID string) error

// Release 释放锁定（第二阶段 - 失败路径）
// 回滚事务，释放锁定的积分
func (r *CreditReservation) Release() error
```

## 错误定义

```go
// trader/errors.go
var (
    // ErrInsufficientCredits 积分不足
    ErrInsufficientCredits = errors.New("insufficient credits for trade")

    // ErrReservationExpired 预留已过期（事务超时）
    ErrReservationExpired = errors.New("credit reservation expired")

    // ErrReservationAlreadyConfirmed 预留已确认（重复调用）
    ErrReservationAlreadyConfirmed = errors.New("credit reservation already confirmed")
)
```

## 数据库层实现

### 锁定积分

```go
// config/credits.go

// ReserveCreditForTrade 为交易预留积分
// 返回事务对象，调用方负责提交或回滚
func (d *Database) ReserveCreditForTrade(userID string, amount int) (*sql.Tx, error) {
    tx, err := d.db.Begin()
    if err != nil {
        return nil, fmt.Errorf("开启事务失败: %w", err)
    }

    // 设置事务超时（5秒）
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // 锁定用户积分行
    var available int
    err = tx.QueryRowContext(ctx, `
        SELECT available_credits
        FROM user_credits
        WHERE user_id = $1
        FOR UPDATE
    `, userID).Scan(&available)

    if err != nil {
        tx.Rollback()
        return nil, fmt.Errorf("查询积分失败: %w", err)
    }

    if available < amount {
        tx.Rollback()
        return nil, ErrInsufficientCredits
    }

    // 预扣减（事务内）
    _, err = tx.ExecContext(ctx, `
        UPDATE user_credits
        SET available_credits = available_credits - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
    `, amount, userID)

    if err != nil {
        tx.Rollback()
        return nil, fmt.Errorf("预扣减失败: %w", err)
    }

    return tx, nil  // 调用方负责 Commit 或 Rollback
}
```

### 确认扣减

```go
// ConfirmCreditConsumption 确认积分消耗，记录流水
func (d *Database) ConfirmCreditConsumption(
    tx *sql.Tx,
    userID, tradeID, description string,
    amount int,
) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // 更新已用积分
    _, err := tx.ExecContext(ctx, `
        UPDATE user_credits
        SET used_credits = used_credits + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
    `, amount, userID)
    if err != nil {
        return fmt.Errorf("更新已用积分失败: %w", err)
    }

    // 获取当前余额
    var balanceAfter int
    err = tx.QueryRowContext(ctx, `
        SELECT available_credits FROM user_credits WHERE user_id = $1
    `, userID).Scan(&balanceAfter)
    if err != nil {
        return fmt.Errorf("查询余额失败: %w", err)
    }

    // 记录流水
    _, err = tx.ExecContext(ctx, `
        INSERT INTO credit_transactions
        (id, user_id, type, amount, balance_before, balance_after, category, description, reference_id, created_at)
        VALUES ($1, $2, 'debit', $3, $4, $5, 'trade', $6, $7, CURRENT_TIMESTAMP)
    `, GenerateUUID(), userID, amount, balanceAfter+amount, balanceAfter, description, tradeID)

    if err != nil {
        return fmt.Errorf("记录流水失败: %w", err)
    }

    return tx.Commit()
}
```

## 交易员集成

```go
// trader/auto_trader_enhanced.go

func (eat *EnhancedAutoTrader) executeDecision(
    decision *Decision,
    tradeType TradeType,
) error {
    var reservation *CreditReservation
    var tradeSuccess bool

    // 仅手动交易需要积分
    if tradeType.ShouldConsumeCredit() && eat.creditConsumer != nil {
        var err error
        tradeID := fmt.Sprintf("trade_%s_%d", eat.id, time.Now().UnixNano())

        reservation, err = eat.creditConsumer.ReserveCredit(eat.userID, tradeID)
        if err != nil {
            if errors.Is(err, ErrInsufficientCredits) {
                eat.logger.Warn("积分不足，拒绝交易",
                    "userID", eat.userID,
                    "symbol", decision.Symbol,
                )
            }
            return err
        }

        // 确保最终处理预留
        defer func() {
            if reservation.alreadyProcessed {
                return  // 幂等：已处理过
            }
            if tradeSuccess {
                if err := reservation.Confirm(decision.Symbol, decision.Action, eat.id); err != nil {
                    eat.logger.Error("积分确认失败", "error", err)
                    // 交易已成功，积分确认失败需要补偿
                    eat.scheduleCompensation(tradeID, eat.userID)
                }
            } else {
                if err := reservation.Release(); err != nil {
                    eat.logger.Error("积分释放失败", "error", err)
                }
            }
        }()
    }

    // 执行交易
    err := eat.executeTrade(decision)
    if err != nil {
        tradeSuccess = false
        return err
    }

    tradeSuccess = true
    return nil
}
```

## 流水记录格式

| 字段 | 值 | 说明 |
|------|-----|------|
| type | "debit" | 扣减 |
| amount | 1 | 固定1积分 |
| category | "trade" | 交易消耗 |
| description | "交易消耗: BTCUSDT LONG by trader_xxx" | 详细描述 |
| reference_id | "trade_xxx_1701792000000" | 交易唯一ID（幂等键） |

## 测试策略

### Mock 设计

```go
// trader/credit_consumer_mock.go

type MockCreditConsumer struct {
    ReserveCreditFunc func(userID, tradeID string) (*CreditReservation, error)
    reservations      map[string]*MockReservation
}

type MockReservation struct {
    confirmed bool
    released  bool
}

func (m *MockCreditConsumer) ReserveCredit(userID, tradeID string) (*CreditReservation, error) {
    if m.ReserveCreditFunc != nil {
        return m.ReserveCreditFunc(userID, tradeID)
    }
    // 默认行为：成功预留
    return &CreditReservation{
        id:      tradeID,
        userID:  userID,
        tradeID: tradeID,
        amount:  1,
    }, nil
}
```

### 并发测试

```go
// trader/credit_consumer_test.go

func TestConcurrentReservation(t *testing.T) {
    consumer := NewTradeCreditConsumer(db, creditsService)
    userID := "test_user"

    // 设置用户只有1积分
    db.SetUserCredits(userID, 1)

    var wg sync.WaitGroup
    successCount := int32(0)
    failCount := int32(0)

    // 并发10个交易请求
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(idx int) {
            defer wg.Done()
            tradeID := fmt.Sprintf("trade_%d", idx)
            reservation, err := consumer.ReserveCredit(userID, tradeID)
            if err != nil {
                atomic.AddInt32(&failCount, 1)
                return
            }
            atomic.AddInt32(&successCount, 1)
            reservation.Confirm("BTCUSDT", "LONG", "trader_1")
        }(i)
    }

    wg.Wait()

    // 只有1个应该成功
    assert.Equal(t, int32(1), successCount)
    assert.Equal(t, int32(9), failCount)
}
```

### Race Detector

```bash
go test -race ./trader/...
```

## 补偿机制

当交易成功但积分确认失败时，需要补偿：

```go
// trader/compensation.go

type CompensationTask struct {
    TradeID   string
    UserID    string
    CreatedAt time.Time
    Retries   int
}

func (eat *EnhancedAutoTrader) scheduleCompensation(tradeID, userID string) {
    task := CompensationTask{
        TradeID:   tradeID,
        UserID:    userID,
        CreatedAt: time.Now(),
    }
    // 写入补偿任务表，由后台任务重试
    eat.db.InsertCompensationTask(task)
}

// 后台补偿任务（定时运行）
func (s *CompensationService) ProcessPendingTasks() {
    tasks, _ := s.db.GetPendingCompensationTasks()
    for _, task := range tasks {
        err := s.creditsService.DeductCredits(task.UserID, 1, "trade",
            "补偿扣减", task.TradeID)
        if err == nil {
            s.db.MarkCompensationComplete(task.TradeID)
        } else {
            s.db.IncrementRetryCount(task.TradeID)
        }
    }
}
```

## 监控指标

```go
// 建议添加的监控埋点
metrics.RecordCreditReservation(userID, success, duration)
metrics.RecordCreditConfirmation(userID, success, duration)
metrics.RecordCreditRelease(userID, success, duration)
metrics.RecordCompensationTask(userID, retries)
```
