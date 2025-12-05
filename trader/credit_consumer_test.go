package trader

import (
	"os"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/assert"
	"nofx/config"
)

// TestTradeType_ShouldConsumeCredit 测试交易类型是否需要消耗积分
func TestTradeType_ShouldConsumeCredit(t *testing.T) {
	tests := []struct {
		name      string
		tradeType TradeType
		expected  bool
	}{
		{"Manual应该扣积分", TradeTypeManual, true},
		{"StopLoss不应扣积分", TradeTypeStopLoss, false},
		{"TakeProfit不应扣积分", TradeTypeTakeProfit, false},
		{"ForceClose不应扣积分", TradeTypeForceClose, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.tradeType.ShouldConsumeCredit()
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestTradeType_String 测试交易类型字符串表示
func TestTradeType_String(t *testing.T) {
	tests := []struct {
		tradeType TradeType
		expected  string
	}{
		{TradeTypeManual, "manual"},
		{TradeTypeStopLoss, "stop_loss"},
		{TradeTypeTakeProfit, "take_profit"},
		{TradeTypeForceClose, "force_close"},
		{TradeType(999), "unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			assert.Equal(t, tt.expected, tt.tradeType.String())
		})
	}
}

// TestTradeType_IsSystemTriggered 测试是否为系统触发
func TestTradeType_IsSystemTriggered(t *testing.T) {
	assert.False(t, TradeTypeManual.IsSystemTriggered())
	assert.True(t, TradeTypeStopLoss.IsSystemTriggered())
	assert.True(t, TradeTypeTakeProfit.IsSystemTriggered())
	assert.True(t, TradeTypeForceClose.IsSystemTriggered())
}

// TestMockCreditConsumer_ReserveCredit 测试模拟积分消费者预留
func TestMockCreditConsumer_ReserveCredit(t *testing.T) {
	mock := NewMockCreditConsumer()

	// 测试成功预留
	reservation, err := mock.ReserveCredit("user1", "trade1")
	assert.NoError(t, err)
	assert.NotNil(t, reservation)
	assert.Equal(t, "trade1", reservation.TradeID)
	assert.Equal(t, "user1", reservation.UserID)
	assert.Equal(t, 1, reservation.Amount)
	assert.Equal(t, 1, mock.ReservationCount)
}

// TestMockCreditConsumer_InsufficientCredits 测试积分不足
func TestMockCreditConsumer_InsufficientCredits(t *testing.T) {
	mock := NewMockCreditConsumer()
	mock.SetCanTrade(false)

	reservation, err := mock.ReserveCredit("user1", "trade1")
	assert.ErrorIs(t, err, ErrInsufficientCredits)
	assert.Nil(t, reservation)
}

// TestCreditReservation_Confirm 测试确认扣减
func TestCreditReservation_Confirm(t *testing.T) {
	mock := NewMockCreditConsumer()
	reservation, _ := mock.ReserveCredit("user1", "trade1")

	err := reservation.Confirm("BTCUSDT", "LONG", "trader1")
	assert.NoError(t, err)
	assert.Equal(t, 1, mock.ConfirmCount)

	// 重复确认应该返回错误
	err = reservation.Confirm("BTCUSDT", "LONG", "trader1")
	assert.ErrorIs(t, err, ErrReservationAlreadyConfirmed)
}

// TestCreditReservation_Release 测试释放锁定
func TestCreditReservation_Release(t *testing.T) {
	mock := NewMockCreditConsumer()
	reservation, _ := mock.ReserveCredit("user1", "trade1")

	err := reservation.Release()
	assert.NoError(t, err)
	assert.Equal(t, 1, mock.ReleaseCount)

	// 重复释放应该返回错误
	err = reservation.Release()
	assert.ErrorIs(t, err, ErrReservationAlreadyReleased)
}

// TestCreditReservation_ConfirmAfterRelease 测试释放后确认
func TestCreditReservation_ConfirmAfterRelease(t *testing.T) {
	mock := NewMockCreditConsumer()
	reservation, _ := mock.ReserveCredit("user1", "trade1")

	reservation.Release()
	err := reservation.Confirm("BTCUSDT", "LONG", "trader1")
	assert.ErrorIs(t, err, ErrReservationAlreadyReleased)
}

// TestCreditReservation_ReleaseAfterConfirm 测试确认后释放
func TestCreditReservation_ReleaseAfterConfirm(t *testing.T) {
	mock := NewMockCreditConsumer()
	reservation, _ := mock.ReserveCredit("user1", "trade1")

	reservation.Confirm("BTCUSDT", "LONG", "trader1")
	err := reservation.Release()
	assert.ErrorIs(t, err, ErrReservationAlreadyConfirmed)
}

// TestCreditReservation_AlreadyProcessed 测试幂等性
func TestCreditReservation_AlreadyProcessed(t *testing.T) {
	reservation := &CreditReservation{
		ID:               "trade1",
		UserID:           "user1",
		TradeID:          "trade1",
		Amount:           1,
		alreadyProcessed: true,
	}

	assert.True(t, reservation.IsAlreadyProcessed())

	// 已处理的预留，Confirm和Release都应该安全返回
	err := reservation.Confirm("BTCUSDT", "LONG", "trader1")
	assert.NoError(t, err)

	err = reservation.Release()
	assert.NoError(t, err)
}

// TestMockCreditConsumer_CustomFunc 测试自定义函数
func TestMockCreditConsumer_CustomFunc(t *testing.T) {
	mock := NewMockCreditConsumer()
	customCalled := false

	mock.ReserveCreditFunc = func(userID, tradeID string) (*CreditReservation, error) {
		customCalled = true
		return &CreditReservation{
			ID:      tradeID,
			UserID:  userID,
			TradeID: tradeID,
			Amount:  1,
		}, nil
	}

	mock.ReserveCredit("user1", "trade1")
	assert.True(t, customCalled)
}

// TestConcurrentReservation 测试并发预留（使用Mock模拟竞争）
func TestConcurrentReservation(t *testing.T) {
	// 模拟只有1积分的场景
	var availableCredits int32 = 1
	var mu sync.Mutex

	mock := NewMockCreditConsumer()
	mock.ReserveCreditFunc = func(userID, tradeID string) (*CreditReservation, error) {
		mu.Lock()
		defer mu.Unlock()

		if atomic.LoadInt32(&availableCredits) < 1 {
			return nil, ErrInsufficientCredits
		}

		// 扣减积分
		atomic.AddInt32(&availableCredits, -1)

		return &CreditReservation{
			ID:      tradeID,
			UserID:  userID,
			TradeID: tradeID,
			Amount:  1,
			onConfirm: func(symbol, action, traderID string) error {
				return nil
			},
			onRelease: func() error {
				atomic.AddInt32(&availableCredits, 1)
				return nil
			},
		}, nil
	}

	var wg sync.WaitGroup
	successCount := int32(0)
	failCount := int32(0)

	// 并发10个交易请求
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			_, err := mock.ReserveCredit("user1", "trade_"+string(rune('0'+idx)))
			if err != nil {
				atomic.AddInt32(&failCount, 1)
			} else {
				atomic.AddInt32(&successCount, 1)
			}
		}(i)
	}

	wg.Wait()

	// 只有1个应该成功
	assert.Equal(t, int32(1), successCount, "只有1个交易应该成功")
	assert.Equal(t, int32(9), failCount, "9个交易应该失败")
}

// TestMockCreditConsumer_Reset 测试重置
func TestMockCreditConsumer_Reset(t *testing.T) {
	mock := NewMockCreditConsumer()
	mock.ReserveCredit("user1", "trade1")
	mock.ReserveCredit("user1", "trade2")

	assert.Equal(t, 2, mock.ReservationCount)

	mock.Reset()
	assert.Equal(t, 0, mock.ReservationCount)
	assert.Equal(t, 0, mock.ConfirmCount)
	assert.Equal(t, 0, mock.ReleaseCount)
}

// ==================== 数据库集成测试 ====================

// TestTradeCreditConsumer_WithDB 测试真实数据库操作
func TestTradeCreditConsumer_WithDB(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	consumer := NewTradeCreditConsumer(db)
	userID := "test_db_" + config.GenerateUUID()[:8]

	// 准备测试数据
	db.GetOrCreateUserCredits(userID)
	db.AddCredits(userID, 100, "purchase", "测试充值", "order_"+config.GenerateUUID()[:8])

	t.Run("ReserveAndConfirm", func(t *testing.T) {
		tradeID := "trade_" + config.GenerateUUID()[:8]

		// 预留积分
		reservation, err := consumer.ReserveCredit(userID, tradeID)
		if err != nil {
			t.Fatalf("预留失败: %v", err)
		}
		if reservation == nil {
			t.Fatal("预留凭证不应为空")
		}

		// 确认扣减
		err = reservation.Confirm("BTCUSDT", "LONG", "trader_test")
		if err != nil {
			t.Fatalf("确认失败: %v", err)
		}

		// 验证积分已扣减
		credits, err := db.GetUserCredits(userID)
		if err != nil {
			t.Fatalf("获取用户积分失败: %v", err)
		}
		if credits.AvailableCredits != 99 {
			t.Errorf("可用积分不匹配: expected 99, got %d", credits.AvailableCredits)
		}
		if credits.UsedCredits != 1 {
			t.Errorf("已用积分不匹配: expected 1, got %d", credits.UsedCredits)
		}

		// 验证幂等性：重复确认不报错
		err = reservation.Confirm("BTCUSDT", "LONG", "trader_test")
		if err != nil {
			t.Errorf("重复确认应该返回nil: %v", err)
		}

		t.Log("✅ 数据库操作成功：预留-确认")
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestTradeCreditConsumer_InsufficientCreditsDB 测试数据库中积分不足
func TestTradeCreditConsumer_InsufficientCreditsDB(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	consumer := NewTradeCreditConsumer(db)
	userID := "test_db2_" + config.GenerateUUID()[:8]

	// 准备测试数据：不充值
	db.GetOrCreateUserCredits(userID)

	t.Run("ReserveFailed", func(t *testing.T) {
		tradeID := "trade_" + config.GenerateUUID()[:8]

		// 预留积分应该失败
		reservation, err := consumer.ReserveCredit(userID, tradeID)
		if err == nil {
			t.Fatal("应该返回积分不足错误")
		}
		if err != ErrInsufficientCredits {
			t.Errorf("错误类型不匹配: expected ErrInsufficientCredits, got %v", err)
		}
		if reservation != nil {
			t.Error("预留失败时凭证应该为空")
		}

		t.Log("✅ 正确检测积分不足")
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestTradeCreditConsumer_ReleaseDB 测试数据库中释放锁定
func TestTradeCreditConsumer_ReleaseDB(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	consumer := NewTradeCreditConsumer(db)
	userID := "test_db3_" + config.GenerateUUID()[:8]

	// 准备测试数据
	db.GetOrCreateUserCredits(userID)
	initialCredits, _ := db.GetUserCredits(userID)
	db.AddCredits(userID, 100, "purchase", "测试充值", "order_"+config.GenerateUUID()[:8])

	t.Run("ReserveAndRelease", func(t *testing.T) {
		tradeID := "trade_" + config.GenerateUUID()[:8]

		// 预留积分
		reservation, err := consumer.ReserveCredit(userID, tradeID)
		if err != nil {
			t.Fatalf("预留失败: %v", err)
		}

		// 释放锁定
		err = reservation.Release()
		if err != nil {
			t.Fatalf("释放失败: %v", err)
		}

		// 验证积分未扣减
		credits, err := db.GetUserCredits(userID)
		if err != nil {
			t.Fatalf("获取用户积分失败: %v", err)
		}
		if credits.AvailableCredits != initialCredits.AvailableCredits+100 {
			t.Errorf("释放后积分未恢复: expected %d, got %d", initialCredits.AvailableCredits+100, credits.AvailableCredits)
		}

		t.Log("✅ 数据库操作成功：预留-释放")
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestTradeCreditConsumer_IdempotencyDB 测试幂等性
func TestTradeCreditConsumer_IdempotencyDB(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	consumer := NewTradeCreditConsumer(db)
	userID := "test_db4_" + config.GenerateUUID()[:8]
	tradeID := "trade_idempotent_" + config.GenerateUUID()[:8]

	// 准备测试数据
	db.GetOrCreateUserCredits(userID)
	db.AddCredits(userID, 100, "purchase", "测试充值", "order_"+config.GenerateUUID()[:8])

	t.Run("TwiceReserveSameTradeID", func(t *testing.T) {
		// 第一次预留+确认
		reservation1, err := consumer.ReserveCredit(userID, tradeID)
		if err != nil {
			t.Fatalf("第一次预留失败: %v", err)
		}
		err = reservation1.Confirm("BTCUSDT", "LONG", "trader_1")
		if err != nil {
			t.Fatalf("第一次确认失败: %v", err)
		}

		// 第二次使用相同tradeID预留（幂等）
		reservation2, err := consumer.ReserveCredit(userID, tradeID)
		if err != nil {
			t.Fatalf("第二次预留失败: %v", err)
		}
		if !reservation2.IsAlreadyProcessed() {
			t.Error("第二次预留应该标记为已处理")
		}

		// 确认积分没有被重复扣减
		credits, _ := db.GetUserCredits(userID)
		if credits.UsedCredits != 1 {
			t.Errorf("幂等性失败: 积分被重复扣减, got %d, expected 1", credits.UsedCredits)
		}

		t.Log("✅ 幂等性正确")
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestTradeCreditConsumer_ConcurrentDB 测试数据库并发
func TestTradeCreditConsumer_ConcurrentDB(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	consumer := NewTradeCreditConsumer(db)
	userID := "test_db5_" + config.GenerateUUID()[:8]

	// 准备测试数据：只有1积分
	db.GetOrCreateUserCredits(userID)
	db.AddCredits(userID, 1, "purchase", "测试充值", "order_"+config.GenerateUUID()[:8])

	t.Run("ConcurrentReserve", func(t *testing.T) {
		var wg sync.WaitGroup
		var successCount int32
		var failCount int32

		// 并发10个请求
		for i := 0; i < 10; i++ {
			wg.Add(1)
			go func(idx int) {
				defer wg.Done()
				tradeID := "trade_concurrent_" + config.GenerateUUID()[:8]

				reservation, err := consumer.ReserveCredit(userID, tradeID)
				if err != nil {
					atomic.AddInt32(&failCount, 1)
					return
				}

				// 模拟交易执行
				// time.Sleep(1 * time.Millisecond)

				err = reservation.Confirm("BTCUSDT", "LONG", "trader_concurrent")
				if err != nil {
					atomic.AddInt32(&failCount, 1)
					return
				}

				atomic.AddInt32(&successCount, 1)
			}(i)
		}

		wg.Wait()

		// 只有1个应该成功
		if successCount != 1 {
			t.Errorf("应该只有1个成功: got %d", successCount)
		}
		if failCount != 9 {
			t.Errorf("应该有9个失败: got %d", failCount)
		}

		t.Logf("✅ 数据库并发测试通过: 成功=%d, 失败=%d", successCount, failCount)
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}
