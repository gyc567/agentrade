package trader

import "errors"

// 积分相关错误定义
var (
	// ErrInsufficientCredits 积分不足
	ErrInsufficientCredits = errors.New("insufficient credits for trade")

	// ErrReservationExpired 预留已过期（事务超时）
	ErrReservationExpired = errors.New("credit reservation expired")

	// ErrReservationAlreadyConfirmed 预留已确认（重复调用）
	ErrReservationAlreadyConfirmed = errors.New("credit reservation already confirmed")

	// ErrReservationAlreadyReleased 预留已释放（重复调用）
	ErrReservationAlreadyReleased = errors.New("credit reservation already released")

	// ErrCreditConsumerNotSet 积分消费者未设置
	ErrCreditConsumerNotSet = errors.New("credit consumer not set")
)
