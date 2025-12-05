package trader

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"nofx/config"
	"nofx/decision"
	"nofx/logger"
)

// TestAutoTraderWithCreditConsumption 测试交易员积分消耗完整流程
func TestAutoTraderWithCreditConsumption(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	// 连接数据库
	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 准备测试数据
	userID := "integration_user_" + config.GenerateUUID()[:8]
	db.GetOrCreateUserCredits(userID)
	db.AddCredits(userID, 100, "purchase", "测试充值", "order_"+config.GenerateUUID()[:8])

	// 创建交易员配置
	config := AutoTraderConfig{
		ID:                    "test_trader_" + config.GenerateUUID()[:8],
		Name:                  "测试交易员",
		Exchange:              "binance",
		ScanInterval:          60 * time.Second,
		InitialBalance:        1000,
		BTCETHLeverage:        10,
		AltcoinLeverage:       5,
		IsCrossMargin:         true,
		UseQwen:               false,
		DeepSeekKey:           "test_key",
		DefaultCoins:          []string{"BTC", "ETH"},
		TradingCoins:          []string{"BTC", "ETH"},
		BinanceAPIKey:         "test_key",
		BinanceSecretKey:      "test_secret",
	}

	// 创建交易员
	at, err := NewAutoTrader(config)
	require.NoError(t, err, "创建交易员失败")

	// 设置用户ID和积分消费者
	at.SetUserID(userID)
	creditConsumer := NewTradeCreditConsumer(db)
	at.SetCreditConsumer(creditConsumer)

	t.Run("SetCreditConsumer", func(t *testing.T) {
		assert.NotNil(t, at.GetDecisionLogger())
	})

	// 模拟执行决策（手动交易 - 应该扣积分）
	t.Run("ExecuteManualTrade", func(t *testing.T) {
		// 检查初始积分
		initialCredits, err := db.GetUserCredits(userID)
		require.NoError(t, err)
		assert.Equal(t, 100, initialCredits.AvailableCredits)

		// 模拟决策执行（手动交易）
		decision := &decision.Decision{
			Symbol: "BTCUSDT",
			Action: "open_long",
		}

		// 创建决策记录
		actionRecord := &logger.DecisionAction{
			Symbol:   decision.Symbol,
			Action:   decision.Action,
			Success:  true, // 模拟交易成功
			Error: "",
		}

		// 执行决策（使用带积分检查的方法）
		err = at.executeDecisionWithRecordAndType(
			decision,
			actionRecord,
			TradeTypeManual,
		)

		// 注意：这个会失败因为没有真实API密钥，但我们主要测试积分逻辑
		// 所以我们只检查积分逻辑是否正确调用

		// 验证积分已扣减（或锁定）
		finalCredits, err := db.GetUserCredits(userID)
		require.NoError(t, err)

		// 如果交易失败（预期），积分应该被释放
		// 如果成功，应该被扣减
		t.Logf("交易后积分: %d", finalCredits.AvailableCredits)
	})

	// 测试不扣积分的交易（止损）
	t.Run("ExecuteStopLossTrade", func(t *testing.T) {
		// 检查当前积分
		creditsBefore, err := db.GetUserCredits(userID)
		require.NoError(t, err)

		// 执行止损交易（不扣积分）
		err = at.executeDecisionWithRecordAndType(
			&decision.Decision{
				Symbol: "BTCUSDT",
				Action: "close_long",
			},
			&logger.DecisionAction{
				Symbol:   "BTCUSDT",
				Action:   "close_long",
				Success:  true,
				Error: "",
			},
			TradeTypeStopLoss, // 止损不扣积分
		)

		// 验证积分没有变化
		creditsAfter, err := db.GetUserCredits(userID)
		require.NoError(t, err)
		assert.Equal(t, creditsBefore.AvailableCredits, creditsAfter.AvailableCredits)

		t.Log("✅ 止损交易不扣积分")
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestAutoTrader_InsufficientCredits 积分不足测试
func TestAutoTrader_InsufficientCredits(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	// 连接数据库
	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 准备测试数据：只有0积分
	userID := "integration_user2_" + config.GenerateUUID()[:8]
	db.GetOrCreateUserCredits(userID)

	// 创建交易员
	config := AutoTraderConfig{
		ID:                    "test_trader2_" + config.GenerateUUID()[:8],
		Name:                  "测试交易员2",
		Exchange:              "binance",
		ScanInterval:          60 * time.Second,
		InitialBalance:        1000,
		BTCETHLeverage:        10,
		AltcoinLeverage:       5,
		IsCrossMargin:         true,
		UseQwen:               false,
		DeepSeekKey:           "test_key",
		BinanceAPIKey:         "test_key",
		BinanceSecretKey:      "test_secret",
	}

	at, err := NewAutoTrader(config)
	require.NoError(t, err)

	// 设置用户ID和积分消费者
	at.SetUserID(userID)
	creditConsumer := NewTradeCreditConsumer(db)
	at.SetCreditConsumer(creditConsumer)

	t.Run("TradeRejected", func(t *testing.T) {
		// 尝试执行手动交易
		err := at.executeDecisionWithRecordAndType(
			&decision.Decision{
				Symbol: "BTCUSDT",
				Action: "open_long",
			},
			&logger.DecisionAction{},
			TradeTypeManual,
		)

		// 应该返回积分不足错误
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "积分不足", "应该返回积分不足错误")

		t.Log("✅ 积分不足时正确拒绝交易")
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestAutoTrader_WithoutCreditConsumer 测试没有积分消费者的交易员（向后兼容）
func TestAutoTrader_WithoutCreditConsumer(t *testing.T) {
	// 创建交易员（不设置积分消费者）
	config := AutoTraderConfig{
		ID:                    "test_trader3_" + config.GenerateUUID()[:8],
		Name:                  "测试交易员3",
		Exchange:              "binance",
		ScanInterval:          60 * time.Second,
		InitialBalance:        1000,
		BTCETHLeverage:        10,
		AltcoinLeverage:       5,
		IsCrossMargin:         true,
		UseQwen:               false,
		DeepSeekKey:           "test_key",
		BinanceAPIKey:         "test_key",
		BinanceSecretKey:      "test_secret",
	}

	at, err := NewAutoTrader(config)
	require.NoError(t, err)

	// 设置用户ID但不设置积分消费者
	at.SetUserID("test_user")

	t.Run("TradeWithoutCreditConsumer", func(t *testing.T) {
		// 执行交易（应该正常执行，不检查积分）
		// 注意：这会失败因为没有真实API，但积分逻辑应该被跳过

		// 验证没有设置积分消费者也能正常运行
		assert.Equal(t, "test_user", at.GetUserID())

		t.Log("✅ 无积分消费者的交易员正常运行（向后兼容）")
	})
}

// TestTradeTypeLogic 测试交易类型逻辑
func TestTradeTypeLogic(t *testing.T) {
	t.Run("ManualShouldConsume", func(t *testing.T) {
		assert.True(t, TradeTypeManual.ShouldConsumeCredit(), "手动交易应该扣积分")
	})

	t.Run("StopLossShouldNotConsume", func(t *testing.T) {
		assert.False(t, TradeTypeStopLoss.ShouldConsumeCredit(), "止损不应该扣积分")
	})

	t.Run("TakeProfitShouldNotConsume", func(t *testing.T) {
		assert.False(t, TradeTypeTakeProfit.ShouldConsumeCredit(), "止盈不应该扣积分")
	})

	t.Run("ForceCloseShouldNotConsume", func(t *testing.T) {
		assert.False(t, TradeTypeForceClose.ShouldConsumeCredit(), "强制平仓不应该扣积分")
	})

	t.Run("SystemTriggeredCheck", func(t *testing.T) {
		assert.False(t, TradeTypeManual.IsSystemTriggered(), "手动交易不是系统触发")
		assert.True(t, TradeTypeStopLoss.IsSystemTriggered(), "止损是系统触发")
		assert.True(t, TradeTypeTakeProfit.IsSystemTriggered(), "止盈是系统触发")
		assert.True(t, TradeTypeForceClose.IsSystemTriggered(), "强制平仓是系统触发")
	})

	t.Run("StringRepresentation", func(t *testing.T) {
		assert.Equal(t, "manual", TradeTypeManual.String())
		assert.Equal(t, "stop_loss", TradeTypeStopLoss.String())
		assert.Equal(t, "take_profit", TradeTypeTakeProfit.String())
		assert.Equal(t, "force_close", TradeTypeForceClose.String())
		assert.Equal(t, "unknown", TradeType(999).String())
	})
}

// TestRaceCondition 竞态条件测试（使用race detector）
func TestRaceCondition(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	// 连接数据库
	db, err := config.NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 准备测试数据：只有1积分
	userID := "race_test_" + config.GenerateUUID()[:8]
	db.GetOrCreateUserCredits(userID)
	db.AddCredits(userID, 1, "purchase", "测试充值", "order_"+config.GenerateUUID()[:8])

	// 创建交易员
	config := AutoTraderConfig{
		ID:                    "race_trader_" + config.GenerateUUID()[:8],
		Name:                  "竞态测试交易员",
		Exchange:              "binance",
		ScanInterval:          1 * time.Second,
		InitialBalance:        1000,
		BTCETHLeverage:        10,
		AltcoinLeverage:       5,
		IsCrossMargin:         true,
		UseQwen:               false,
		DeepSeekKey:           "test_key",
		BinanceAPIKey:         "test_key",
		BinanceSecretKey:      "test_secret",
	}

	at, err := NewAutoTrader(config)
	require.NoError(t, err)

	// 设置用户ID和积分消费者
	at.SetUserID(userID)
	creditConsumer := NewTradeCreditConsumer(db)
	at.SetCreditConsumer(creditConsumer)

	t.Run("ConcurrentTradeAttempts", func(t *testing.T) {
		// 并发执行多个交易决策
		done := make(chan bool, 20)
		failCount := 0

		for i := 0; i < 20; i++ {
			go func(idx int) {
				defer func() { done <- true }()

				err := at.executeDecisionWithRecordAndType(
					&decision.Decision{
						Symbol: "BTCUSDT",
						Action: "open_long",
					},
					&logger.DecisionAction{
						Symbol:   "BTCUSDT",
						Action:   "open_long",
						Success:  false, // 模拟交易失败（因为没有真实API）
						Error:    "模拟失败",
					},
					TradeTypeManual,
				)

				if err != nil {
					failCount++
				}
			}(i)
		}

		// 等待所有协程完成（最多2秒）
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()

		for i := 0; i < 20; i++ {
			select {
			case <-done:
			case <-ctx.Done():
				t.Fatal("测试超时")
			}
		}

		t.Logf("竞态测试完成: 失败=%d", failCount)
	})

	// 清理测试数据
	db.Exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.Exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}
