package mem0

import (
	"strings"
	"fmt"
	"log"
	"sync"
	"time"
)

// CircuitState 断路器状态
type CircuitState string

const (
	StateClosed   CircuitState = "closed"    // 正常状态
	StateOpen     CircuitState = "open"      // 断路器打开
	StateHalfOpen CircuitState = "half-open" // 尝试恢复
)

// CircuitBreaker P0修复: 自动断路器
// 作用: 连续失败3次自动关闭,5分钟后尝试恢复
// 防止: 依赖Mem0故障导致延迟,自动降级
type CircuitBreaker struct {
	state               CircuitState
	failureCount        int
	successCount        int
	lastStateChangeAt   time.Time
	failureThreshold    int
	successThreshold    int
	timeout             time.Duration
	mu                  sync.RWMutex
	metrics             *CircuitBreakerMetrics
	onStateChange       func(oldState, newState CircuitState)
}

// CircuitBreakerMetrics 断路器指标
type CircuitBreakerMetrics struct {
	StateChanges int64
	TotalTrips   int64
	LastTripTime *time.Time
	mu           sync.RWMutex
}

// NewCircuitBreaker 创建断路器
func NewCircuitBreaker(failureThreshold int, successThreshold int, timeout time.Duration) *CircuitBreaker {
	if failureThreshold <= 0 {
		failureThreshold = 3
	}
	if successThreshold <= 0 {
		successThreshold = 2
	}
	if timeout <= 0 {
		timeout = 5 * time.Minute
	}

	return &CircuitBreaker{
		state:            StateClosed,
		failureThreshold: failureThreshold,
		successThreshold: successThreshold,
		timeout:          timeout,
		lastStateChangeAt: time.Now(),
		metrics:          &CircuitBreakerMetrics{},
	}
}

// Call 执行受保护的操作
func (cb *CircuitBreaker) Call(fn func() error) error {
	cb.mu.Lock()
	currentState := cb.state
	cb.mu.Unlock()

	// 如果断路器打开,检查是否应该恢复
	if currentState == StateOpen {
		if time.Since(cb.lastStateChangeAt) > cb.timeout {
			cb.setState(StateHalfOpen)
			log.Printf("🔄 断路器进入half-open状态,尝试恢复...")
		} else {
			log.Printf("⛔ 断路器打开 (剩余: %.0fs)", cb.timeout.Seconds()-time.Since(cb.lastStateChangeAt).Seconds())
			return fmt.Errorf("❌ CircuitBreaker Open - 服务暂时不可用")
		}
	}

	// 执行操作
	err := fn()

	if err != nil {
		cb.recordFailure(currentState)
		return err
	}

	// 成功
	cb.recordSuccess()
	return nil
}

// recordFailure 记录失败
func (cb *CircuitBreaker) recordFailure(currentState CircuitState) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.failureCount++
	cb.successCount = 0

	log.Printf("❌ 失败 (计数: %d/%d)", cb.failureCount, cb.failureThreshold)

	if cb.state == StateHalfOpen {
		// half-open时再失败,直接打开
		cb.state = StateOpen
		cb.lastStateChangeAt = time.Now()
		log.Printf("🚨 断路器打开(恢复失败)")

		cb.recordStateChange()
	} else if cb.failureCount >= cb.failureThreshold && cb.state == StateClosed {
		// 从closed转到open
		cb.state = StateOpen
		cb.lastStateChangeAt = time.Now()
		log.Printf("🚨 断路器打开(连续%d次失败)", cb.failureThreshold)

		cb.recordStateChange()
	}

	// 调用状态变化回调
	if cb.onStateChange != nil && cb.state == StateOpen && currentState == StateClosed {
		cb.onStateChange(currentState, StateOpen)
	}
}

// recordSuccess 记录成功
func (cb *CircuitBreaker) recordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	if cb.state == StateClosed {
		cb.failureCount = 0
		return
	}

	// half-open状态下,成功计数
	cb.successCount++
	log.Printf("✅ 成功 (恢复计数: %d/%d)", cb.successCount, cb.successThreshold)

	if cb.successCount >= cb.successThreshold {
		// 足够成功次数,关闭断路器
		cb.state = StateClosed
		cb.failureCount = 0
		cb.successCount = 0
		cb.lastStateChangeAt = time.Now()
		log.Printf("✅ 断路器关闭,恢复正常")

		cb.recordStateChange()

		// 调用状态变化回调
		if cb.onStateChange != nil {
			cb.onStateChange(StateHalfOpen, StateClosed)
		}
	}
}

// setState 设置状态
func (cb *CircuitBreaker) setState(newState CircuitState) {
	cb.mu.Lock()
	oldState := cb.state
	cb.state = newState
	cb.lastStateChangeAt = time.Now()
	cb.mu.Unlock()

	if cb.onStateChange != nil {
		cb.onStateChange(oldState, newState)
	}
}

// recordStateChange 记录状态变化指标
func (cb *CircuitBreaker) recordStateChange() {
	cb.metrics.mu.Lock()
	cb.metrics.StateChanges++
	cb.metrics.TotalTrips++
	now := time.Now()
	cb.metrics.LastTripTime = &now
	cb.metrics.mu.Unlock()
}

// GetState 获取当前状态
func (cb *CircuitBreaker) GetState() CircuitState {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// IsOpen 检查是否打开
func (cb *CircuitBreaker) IsOpen() bool {
	return cb.GetState() == StateOpen
}

// IsHalfOpen 检查是否半开
func (cb *CircuitBreaker) IsHalfOpen() bool {
	return cb.GetState() == StateHalfOpen
}

// IsClosed 检查是否关闭
func (cb *CircuitBreaker) IsClosed() bool {
	return cb.GetState() == StateClosed
}

// Reset 手动重置
func (cb *CircuitBreaker) Reset() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.state = StateClosed
	cb.failureCount = 0
	cb.successCount = 0
	cb.lastStateChangeAt = time.Now()

	log.Println("🔄 断路器已手动重置")
}

// SetOnStateChange 设置状态变化回调
func (cb *CircuitBreaker) SetOnStateChange(fn func(oldState, newState CircuitState)) {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.onStateChange = fn
}

// GetMetrics 获取指标
func (cb *CircuitBreaker) GetMetrics() CircuitBreakerMetrics {
	cb.metrics.mu.RLock()
	defer cb.metrics.mu.RUnlock()
	
	// 返回不包含锁的副本
	return CircuitBreakerMetrics{
		StateChanges: cb.metrics.StateChanges,
		TotalTrips:   cb.metrics.TotalTrips,
		LastTripTime: cb.metrics.LastTripTime,
	}
}

// PrintStats 打印统计信息
func (cb *CircuitBreaker) PrintStats() {
	cb.mu.RLock()
	state := cb.state
	failureCount := cb.failureCount
	successCount := cb.successCount
	lastChange := cb.lastStateChangeAt
	cb.mu.RUnlock()

	metrics := cb.GetMetrics()

	log.Println("\n🔌 断路器统计:")
	log.Println(strings.Repeat("═", 50))
	log.Printf("  状态: %s\n", state)
	log.Printf("  失败计数: %d/%d | 成功计数: %d/%d\n", failureCount, cb.failureThreshold, successCount, cb.successThreshold)
	log.Printf("  状态变化: %d次 | 总触发: %d次\n", metrics.StateChanges, metrics.TotalTrips)

	if metrics.LastTripTime != nil {
		log.Printf("  最后触发: %s\n", metrics.LastTripTime.Format("2006-01-02 15:04:05"))
	}

	log.Printf("  最后状态变化: %s\n", lastChange.Format("2006-01-02 15:04:05"))
	log.Println(strings.Repeat("═", 50))
}

// WrappedCall 带重试的调用
func (cb *CircuitBreaker) WrappedCall(fn func() error, maxRetries int) error {
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		err := cb.Call(fn)
		if err == nil {
			return nil
		}

		lastErr = err

		if cb.IsOpen() {
			log.Printf("⏳ 断路器打开,放弃重试")
			break
		}

		if attempt < maxRetries-1 {
			backoff := time.Duration(attempt+1) * time.Second
			log.Printf("⏳ 重试中... (等待%v)", backoff)
			time.Sleep(backoff)
		}
	}

	return lastErr
}
