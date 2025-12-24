package ai

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"nofx/config"
	"testing"
	"time"
)

// createTestGeminiConfig 创建测试用的Gemini配置
func createTestGeminiConfig() *config.GeminiConfig {
	return &config.GeminiConfig{
		Enabled:                    true,
		APIKey:                     "test-api-key",
		APIURL:                     "https://generativelanguage.googleapis.com",
		APIVersion:                 "v1beta",
		Model:                      "gemini-pro",
		Temperature:                0.7,
		MaxTokens:                  2000,
		TopP:                       0.95,
		TopK:                       40,
		CacheEnabled:               true,
		CircuitBreakerEnabled:      true,
		CircuitBreakerThreshold:    3,
		CircuitBreakerTimeoutSeconds: 300,
		MetricsEnabled:             true,
		TimeoutSeconds:             30,
		RetryEnabled:               true,
		RetryMaxAttempts:           3,
		RetryBackoffMS:             500,
		RolloutPercentage:          100,
		AutoFallbackEnabled:        true,
		ErrorRateThreshold:         5.0,
	}
}

// TestNewGeminiModelSuccess 测试成功创建Gemini模型
func TestNewGeminiModelSuccess(t *testing.T) {
	cfg := createTestGeminiConfig()
	model, err := NewGeminiModel(cfg)

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if model == nil {
		t.Fatal("expected model to be created")
	}

	if model.config != cfg {
		t.Fatal("expected config to be set")
	}
}

// TestNewGeminiModelDisabled 测试创建禁用状态的Gemini模型
func TestNewGeminiModelDisabled(t *testing.T) {
	cfg := createTestGeminiConfig()
	cfg.Enabled = false

	model, err := NewGeminiModel(cfg)

	if err == nil {
		t.Fatal("expected error when disabled")
	}

	if model != nil {
		t.Fatal("expected model to be nil")
	}
}

// TestNewGeminiModelMissingAPIKey 测试缺少API Key
func TestNewGeminiModelMissingAPIKey(t *testing.T) {
	cfg := createTestGeminiConfig()
	cfg.APIKey = ""

	model, err := NewGeminiModel(cfg)

	if err == nil {
		t.Fatal("expected error for missing API key")
	}

	if model != nil {
		t.Fatal("expected model to be nil")
	}
}

// TestGeminiModelCallAPI 测试调用Gemini API
func TestGeminiModelCallAPI(t *testing.T) {
	// 创建mock服务器
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 验证请求
		if r.Header.Get("x-goog-api-key") != "test-api-key" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// 返回模拟响应
		resp := GeminiResponse{
			Candidates: []GeminiCandidate{
				{
					Content: GeminiContent{
						Role: "model",
						Parts: []GeminiPart{
							{Text: "test response"},
						},
					},
					FinishReason: "STOP",
				},
			},
			UsageData: GeminiUsageData{
				PromptTokenCount:     10,
				CandidatesTokenCount: 5,
				TotalTokenCount:      15,
			},
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	// 创建模型
	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	// 调用API
	ctx := context.Background()
	response, err := model.CallAPI(ctx, "system", "user")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if response != "test response" {
		t.Fatalf("expected 'test response', got %s", response)
	}
}

// TestGeminiModelCaching 测试缓存功能
func TestGeminiModelCaching(t *testing.T) {
	callCount := 0

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		resp := GeminiResponse{
			Candidates: []GeminiCandidate{
				{
					Content: GeminiContent{
						Role: "model",
						Parts: []GeminiPart{
							{Text: "test response"},
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	ctx := context.Background()

	// 第一次调用
	model.CallAPI(ctx, "system", "user")
	if callCount != 1 {
		t.Fatalf("expected 1 API call, got %d", callCount)
	}

	// 第二次调用相同提示 - 应该命中缓存
	model.CallAPI(ctx, "system", "user")
	if callCount != 1 {
		t.Fatalf("expected 1 API call (cached), got %d", callCount)
	}

	// 不同提示 - 应该触发新请求
	model.CallAPI(ctx, "system", "different")
	if callCount != 2 {
		t.Fatalf("expected 2 API calls, got %d", callCount)
	}
}

// TestGeminiModelHealthCheck 测试健康检查
func TestGeminiModelHealthCheck(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := GeminiResponse{
			Candidates: []GeminiCandidate{
				{
					Content: GeminiContent{
						Role: "model",
						Parts: []GeminiPart{
							{Text: "ok"},
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	ctx := context.Background()
	err = model.Health(ctx)

	if err != nil {
		t.Fatalf("expected healthy, got error: %v", err)
	}
}

// TestGeminiModelGetModelInfo 测试获取模型信息
func TestGeminiModelGetModelInfo(t *testing.T) {
	cfg := createTestGeminiConfig()
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	info := model.GetModelInfo()

	if info.Name != "gemini-pro" {
		t.Fatalf("expected name 'gemini-pro', got %s", info.Name)
	}

	if info.Provider != "Google Gemini" {
		t.Fatalf("expected provider 'Google Gemini', got %s", info.Provider)
	}

	if info.MaxTokens != 2000 {
		t.Fatalf("expected 2000 max tokens, got %d", info.MaxTokens)
	}
}

// TestGeminiModelMetrics 测试性能指标收集
func TestGeminiModelMetrics(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := GeminiResponse{
			Candidates: []GeminiCandidate{
				{
					Content: GeminiContent{
						Role: "model",
						Parts: []GeminiPart{
							{Text: "response"},
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	ctx := context.Background()
	model.CallAPI(ctx, "system", "user1")
	model.CallAPI(ctx, "system", "user1") // 缓存命中
	model.CallAPI(ctx, "system", "user2")

	metrics := model.GetMetrics()

	if metrics["call_count"].(int64) != 2 {
		t.Fatalf("expected 2 calls, got %v", metrics["call_count"])
	}

	if metrics["cache_hit_count"].(int64) != 1 {
		t.Fatalf("expected 1 cache hit, got %v", metrics["cache_hit_count"])
	}
}

// TestGeminiModelContextTimeout 测试context超时
func TestGeminiModelContextTimeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(100 * time.Millisecond)
		resp := GeminiResponse{
			Candidates: []GeminiCandidate{
				{
					Content: GeminiContent{
						Role: "model",
						Parts: []GeminiPart{
							{Text: "response"},
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()

	_, err = model.CallAPI(ctx, "system", "user")

	if err == nil {
		t.Fatal("expected timeout error")
	}
}

// TestGeminiModelAPIError 测试API错误处理
func TestGeminiModelAPIError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		resp := GeminiResponse{
			Error: &GeminiAPIError{
				Code:    500,
				Message: "Internal server error",
				Status:  "INTERNAL",
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	ctx := context.Background()
	_, err = model.CallAPI(ctx, "system", "user")

	if err == nil {
		t.Fatal("expected error")
	}
}

// TestGeminiModelCacheEviction 测试缓存淘汰
func TestGeminiModelCacheEviction(t *testing.T) {
	callCount := 0

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		resp := GeminiResponse{
			Candidates: []GeminiCandidate{
				{
					Content: GeminiContent{
						Role: "model",
						Parts: []GeminiPart{
							{Text: "response"},
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, err := NewGeminiModel(cfg)
	if err != nil {
		t.Fatalf("failed to create model: %v", err)
	}

	model.maxSize = 2 // 设置小缓存以测试淘汰

	ctx := context.Background()
	model.CallAPI(ctx, "system", "user1")
	model.CallAPI(ctx, "system", "user2")
	model.CallAPI(ctx, "system", "user3") // 应该淘汰user1

	// 重新调用user1 - 应该触发新请求
	model.CallAPI(ctx, "system", "user1")

	// 应该有4次API调用（3个初始 + 1个user1重复）
	if callCount != 4 {
		t.Fatalf("expected 4 API calls, got %d", callCount)
	}
}

// TestGeminiModelBuildURL 测试URL构建
func TestGeminiModelBuildURL(t *testing.T) {
	cfg := createTestGeminiConfig()
	model, _ := NewGeminiModel(cfg)

	url := model.buildAPIURL()
	expected := "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

	if url != expected {
		t.Fatalf("expected %s, got %s", expected, url)
	}
}

// BenchmarkGeminiModelCallAPI 性能基准测试
func BenchmarkGeminiModelCallAPI(b *testing.B) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resp := GeminiResponse{
			Candidates: []GeminiCandidate{
				{
					Content: GeminiContent{
						Role: "model",
						Parts: []GeminiPart{
							{Text: "response"},
						},
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := createTestGeminiConfig()
	cfg.APIURL = server.URL
	model, _ := NewGeminiModel(cfg)
	model.maxSize = 10000 // 足够大的缓存

	ctx := context.Background()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		model.CallAPI(ctx, "system", "user")
	}
}

// BenchmarkGeminiModelCache 缓存性能基准测试
func BenchmarkGeminiModelCache(b *testing.B) {
	cfg := createTestGeminiConfig()
	model, _ := NewGeminiModel(cfg)

	// 预填充缓存
	model.cache[hashPrompts("system", "user")] = "cached response"

	ctx := context.Background()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		model.CallAPI(ctx, "system", "user")
	}
}
