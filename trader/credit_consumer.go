package trader

import (
	"fmt"
	"log"
	"nofx/config"
	"strings"
)

// TradeCreditConsumer 交易积分消费者实现
// 实现 CreditConsumer 接口，使用两阶段提交保证原子性
type TradeCreditConsumer struct {
	db *config.Database
}

// NewTradeCreditConsumer 创建交易积分消费者
func NewTradeCreditConsumer(db *config.Database) *TradeCreditConsumer {
	return &TradeCreditConsumer{
		db: db,
	}
}

// ReserveCredit 预留积分（第一阶段）
// 锁定1积分用于交易，返回预留凭证
func (c *TradeCreditConsumer) ReserveCredit(userID, tradeID string) (*CreditReservation, error) {
	if userID == "" {
		return nil, fmt.Errorf("userID 不能为空")
	}
	if tradeID == "" {
		return nil, fmt.Errorf("tradeID 不能为空")
	}

	// 幂等性检查：检查是否已处理过
	exists, err := c.db.CheckTransactionExists(tradeID)
	if err != nil {
		return nil, fmt.Errorf("幂等性检查失败: %w", err)
	}
	if exists {
		log.Printf("⚠️ 交易 %s 已处理过，跳过积分扣减", tradeID)
		return &CreditReservation{
			ID:               tradeID,
			UserID:           userID,
			TradeID:          tradeID,
			Amount:           1,
			alreadyProcessed: true,
		}, nil
	}

	// 预留积分（获取事务锁）
	tx, balanceBefore, err := c.db.ReserveCreditForTrade(userID, 1)
	if err != nil {
		if strings.Contains(err.Error(), "积分不足") {
			return nil, ErrInsufficientCredits
		}
		return nil, fmt.Errorf("预留积分失败: %w", err)
	}

	// 创建预留凭证
	reservation := &CreditReservation{
		ID:      tradeID,
		UserID:  userID,
		TradeID: tradeID,
		Amount:  1,
		Tx:      tx,
	}

	// 设置确认回调
	reservation.onConfirm = func(symbol, action, traderID string) error {
		description := fmt.Sprintf("交易消耗: %s %s by %s", symbol, action, traderID)
		return c.db.ConfirmCreditConsumption(tx, userID, tradeID, description, 1, balanceBefore)
	}

	// 设置释放回调
	reservation.onRelease = func() error {
		return c.db.ReleaseCreditReservation(tx)
	}

	log.Printf("🔒 用户 %s 积分已锁定 (tradeID: %s, 余额: %d)", userID, tradeID, balanceBefore)
	return reservation, nil
}

// MockCreditConsumer 模拟积分消费者（用于测试）
type MockCreditConsumer struct {
	ReserveCreditFunc func(userID, tradeID string) (*CreditReservation, error)
	CanTradeResult    bool
	ConsumeError      error
	ReservationCount  int
	ConfirmCount      int
	ReleaseCount      int
}

// NewMockCreditConsumer 创建模拟积分消费者
func NewMockCreditConsumer() *MockCreditConsumer {
	return &MockCreditConsumer{
		CanTradeResult: true,
	}
}

// ReserveCredit 模拟预留积分
func (m *MockCreditConsumer) ReserveCredit(userID, tradeID string) (*CreditReservation, error) {
	m.ReservationCount++

	if m.ReserveCreditFunc != nil {
		return m.ReserveCreditFunc(userID, tradeID)
	}

	if !m.CanTradeResult {
		return nil, ErrInsufficientCredits
	}

	reservation := &CreditReservation{
		ID:      tradeID,
		UserID:  userID,
		TradeID: tradeID,
		Amount:  1,
	}

	reservation.onConfirm = func(symbol, action, traderID string) error {
		m.ConfirmCount++
		return m.ConsumeError
	}

	reservation.onRelease = func() error {
		m.ReleaseCount++
		return nil
	}

	return reservation, nil
}

// SetCanTrade 设置是否可以交易
func (m *MockCreditConsumer) SetCanTrade(canTrade bool) {
	m.CanTradeResult = canTrade
}

// SetConsumeError 设置消费错误
func (m *MockCreditConsumer) SetConsumeError(err error) {
	m.ConsumeError = err
}

// Reset 重置计数器
func (m *MockCreditConsumer) Reset() {
	m.ReservationCount = 0
	m.ConfirmCount = 0
	m.ReleaseCount = 0
}
