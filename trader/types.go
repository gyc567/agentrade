package trader

// TradeType 交易类型枚举
// 用于区分不同触发源的交易，决定是否消耗积分
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

// String 返回交易类型的字符串表示
func (t TradeType) String() string {
	switch t {
	case TradeTypeManual:
		return "manual"
	case TradeTypeStopLoss:
		return "stop_loss"
	case TradeTypeTakeProfit:
		return "take_profit"
	case TradeTypeForceClose:
		return "force_close"
	default:
		return "unknown"
	}
}

// ShouldConsumeCredit 判断该交易类型是否需要消耗积分
// 仅手动交易（用户主动发起的交易决策）需要消耗积分
func (t TradeType) ShouldConsumeCredit() bool {
	return t == TradeTypeManual
}

// IsSystemTriggered 判断是否为系统触发的交易
func (t TradeType) IsSystemTriggered() bool {
	return t == TradeTypeStopLoss || t == TradeTypeTakeProfit || t == TradeTypeForceClose
}
