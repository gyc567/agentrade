package ai

import (
	"context"
	"errors"
	"testing"
	"time"
)

// TestMockAIModelCallAPI 测试mock模型的基本调用
func TestMockAIModelCallAPI(t *testing.T) {
	mock := NewMockAIModel()
	mock.SetResponse(`{"test": "success"}`)

	ctx := context.Background()
	response, err := mock.CallAPI(ctx, "system", "user")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if response != `{"test": "success"}` {
		t.Fatalf("expected success response, got %s", response)
	}

	if mock.CallCount != 1 {
		t.Fatalf("expected 1 call, got %d", mock.CallCount)
	}
}

// TestMockAIModelError 测试mock模型的错误处理
func TestMockAIModelError(t *testing.T) {
	mock := NewMockAIModel()
	testError := errors.New("test error")
	mock.SetError(testError)

	ctx := context.Background()
	_, err := mock.CallAPI(ctx, "system", "user")

	if err != testError {
		t.Fatalf("expected %v, got %v", testError, err)
	}

	if mock.CallCount != 1 {
		t.Fatalf("expected 1 call, got %d", mock.CallCount)
	}
}

// TestMockAIModelLatency 测试mock模型的延迟模拟
func TestMockAIModelLatency(t *testing.T) {
	mock := NewMockAIModel()
	mock.SetLatency(50)

	ctx := context.Background()
	start := time.Now()
	mock.CallAPI(ctx, "system", "user")
	elapsed := time.Since(start)

	// 允许10ms的误差范围
	if elapsed < 40*time.Millisecond {
		t.Fatalf("expected at least 40ms delay, got %v", elapsed)
	}
}

// TestMockAIModelContextCancellation 测试context取消时的行为
func TestMockAIModelContextCancellation(t *testing.T) {
	mock := NewMockAIModel()
	mock.SetLatency(200)

	ctx, cancel := context.WithCancel(context.Background())
	go func() {
		time.Sleep(50 * time.Millisecond)
		cancel()
	}()

	_, err := mock.CallAPI(ctx, "system", "user")

	if err != context.Canceled {
		t.Fatalf("expected context.Canceled, got %v", err)
	}
}

// TestMockAIModelHealthy 测试健康检查
func TestMockAIModelHealthy(t *testing.T) {
	mock := NewMockAIModel()
	mock.SetHealthy(true)

	ctx := context.Background()
	err := mock.Health(ctx)

	if err != nil {
		t.Fatalf("expected healthy, got error: %v", err)
	}
}

// TestMockAIModelUnhealthy 测试不健康状态
func TestMockAIModelUnhealthy(t *testing.T) {
	mock := NewMockAIModel()
	mock.SetHealthy(false)

	ctx := context.Background()
	err := mock.Health(ctx)

	if err == nil {
		t.Fatal("expected error for unhealthy model")
	}
}

// TestMockAIModelGetModelInfo 测试模型信息获取
func TestMockAIModelGetModelInfo(t *testing.T) {
	mock := NewMockAIModel()
	info := mock.GetModelInfo()

	if info.Name != "mock-model" {
		t.Fatalf("expected name 'mock-model', got %s", info.Name)
	}

	if info.MaxTokens != 2000 {
		t.Fatalf("expected 2000 max tokens, got %d", info.MaxTokens)
	}
}

// TestMockAIModelCallHistory 测试调用历史记录
func TestMockAIModelCallHistory(t *testing.T) {
	mock := NewMockAIModel()

	ctx := context.Background()
	mock.CallAPI(ctx, "system1", "user1")
	mock.CallAPI(ctx, "system2", "user2")
	mock.CallAPI(ctx, "system1", "user3")

	if len(mock.CallHistory) != 3 {
		t.Fatalf("expected 3 calls in history, got %d", len(mock.CallHistory))
	}

	// 测试按系统提示查询
	calls := mock.GetCallsBySystemPrompt("system1")
	if len(calls) != 2 {
		t.Fatalf("expected 2 calls with system1, got %d", len(calls))
	}
}

// TestMockAIModelReset 测试重置功能
func TestMockAIModelReset(t *testing.T) {
	mock := NewMockAIModel()

	ctx := context.Background()
	mock.CallAPI(ctx, "system", "user")

	if mock.CallCount != 1 {
		t.Fatalf("expected 1 call before reset, got %d", mock.CallCount)
	}

	mock.Reset()

	if mock.CallCount != 0 {
		t.Fatalf("expected 0 calls after reset, got %d", mock.CallCount)
	}

	if len(mock.CallHistory) != 0 {
		t.Fatalf("expected empty history after reset, got %d", len(mock.CallHistory))
	}
}

// TestMockAIModelAssertions 测试断言功能
func TestMockAIModelAssertions(t *testing.T) {
	mock := NewMockAIModel()

	ctx := context.Background()
	mock.CallAPI(ctx, "system", "user")

	// 测试调用次数断言
	if !mock.AssertCallCount(1) {
		t.Fatal("expected call count assertion to pass")
	}

	if mock.AssertCallCount(2) {
		t.Fatal("expected call count assertion to fail")
	}

	// 测试最后调用断言
	if !mock.AssertLastCall("system", "user") {
		t.Fatal("expected last call assertion to pass")
	}

	if mock.AssertLastCall("wrong", "wrong") {
		t.Fatal("expected last call assertion to fail")
	}
}

// TestMockAIModelFluentAPI 测试流式API链式调用
func TestMockAIModelFluentAPI(t *testing.T) {
	mock := NewMockAIModel().
		SetResponse(`{"result": "ok"}`).
		SetLatency(50).
		SetHealthy(true)

	if !mock.HealthyOverride {
		t.Fatal("expected healthy=true")
	}

	if mock.LatencyMS != 50 {
		t.Fatalf("expected latency=50, got %d", mock.LatencyMS)
	}

	if mock.ResponseOverride != `{"result": "ok"}` {
		t.Fatalf("unexpected response: %s", mock.ResponseOverride)
	}
}

// TestModelErrorTypes 测试不同类型的模型错误
func TestModelErrorTypes(t *testing.T) {
	tests := []struct {
		name       string
		err        *ModelError
		expectCode string
		expectMsg  string
		retryable  bool
	}{
		{
			name:       "timeout error",
			err:        NewTimeoutError("request timeout"),
			expectCode: ErrorCodeTimeout,
			retryable:  true,
		},
		{
			name:       "api error - retryable",
			err:        NewAPIError("server error", 503),
			expectCode: ErrorCodeAPIError,
			retryable:  true,
		},
		{
			name:       "config error",
			err:        NewConfigError("missing api key"),
			expectCode: ErrorCodeBadConfig,
			retryable:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.err.Code != tt.expectCode {
				t.Fatalf("expected code %s, got %s", tt.expectCode, tt.err.Code)
			}
			if tt.err.Retryable != tt.retryable {
				t.Fatalf("expected retryable=%v, got %v", tt.retryable, tt.err.Retryable)
			}
		})
	}
}

// TestModelInfoStruct 测试ModelInfo结构体
func TestModelInfoStruct(t *testing.T) {
	info := ModelInfo{
		Name:          "test-model",
		Provider:      "TestProvider",
		Version:       "1.0",
		MaxTokens:     4000,
		ContextWindow: 16000,
		CostPerMTok:   0.001,
		LoadedAt:      time.Now(),
	}

	if info.Name == "" {
		t.Fatal("ModelInfo.Name should not be empty")
	}

	if info.ContextWindow <= info.MaxTokens {
		t.Fatal("ContextWindow should be larger than MaxTokens")
	}
}

// BenchmarkMockAIModelCallAPI 性能基准测试
func BenchmarkMockAIModelCallAPI(b *testing.B) {
	mock := NewMockAIModel()
	mock.SetLatency(0) // 禁用延迟以测试纯调用性能

	ctx := context.Background()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		mock.CallAPI(ctx, "system", "user")
	}
}

// BenchmarkMockAIModelHealth 性能基准测试 - 健康检查
func BenchmarkMockAIModelHealth(b *testing.B) {
	mock := NewMockAIModel()
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		mock.Health(ctx)
	}
}
