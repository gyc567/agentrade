package ai

import (
	"nofx/config"
	"testing"
)

// createTestFactory 创建测试工厂
func createTestFactory() *AIModelFactory {
	cfg := &config.Config{}
	return NewAIModelFactory(cfg, nil)
}

// TestAIModelFactoryCreate 测试创建模型
func TestAIModelFactoryCreate(t *testing.T) {
	factory := createTestFactory()

	// 创建Mock模型
	model, err := factory.CreateUnderstandingModel("mock")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if model == nil {
		t.Fatal("expected model instance")
	}
}

// TestAIModelFactoryUnsupportedModel 测试不支持的模型
func TestAIModelFactoryUnsupportedModel(t *testing.T) {
	factory := createTestFactory()

	model, err := factory.CreateUnderstandingModel("unsupported-model")

	if err == nil {
		t.Fatal("expected error for unsupported model")
	}

	if model != nil {
		t.Fatal("expected model to be nil")
	}
}

// TestAIModelFactoryCache 测试模型缓存
func TestAIModelFactoryCache(t *testing.T) {
	factory := createTestFactory()

	// 第一次创建
	model1, _ := factory.CreateUnderstandingModel("mock")

	// 第二次创建 - 应该返回缓存的实例
	model2, _ := factory.CreateUnderstandingModel("mock")

	// 应该是同一个实例
	if model1 != model2 {
		t.Fatal("expected cached instance to be returned")
	}
}

// TestAIModelFactoryClearCache 测试清空缓存
func TestAIModelFactoryClearCache(t *testing.T) {
	factory := createTestFactory()

	model1, _ := factory.CreateUnderstandingModel("mock")
	factory.ClearCache()
	model2, _ := factory.CreateUnderstandingModel("mock")

	// 清空缓存后应该创建新实例
	if model1 == model2 {
		t.Fatal("expected new instance after cache clear")
	}
}

// TestAIModelFactoryClearCacheEntry 测试清空单个缓存条目
func TestAIModelFactoryClearCacheEntry(t *testing.T) {
	factory := createTestFactory()

	model1, _ := factory.CreateUnderstandingModel("mock")
	factory.ClearCacheEntry("mock")
	model2, _ := factory.CreateUnderstandingModel("mock")

	// 清空特定条目后应该创建新实例
	if model1 == model2 {
		t.Fatal("expected new instance after cache entry clear")
	}
}

// TestAIModelFactoryCreateWithFallback 测试带降级的创建
func TestAIModelFactoryCreateWithFallback(t *testing.T) {
	factory := createTestFactory()

	// 主模型失败，降级到备用模型
	model, err := factory.CreateWithFallback("unsupported", "mock")

	if err != nil {
		t.Fatalf("expected fallback to work, got error: %v", err)
	}

	if model == nil {
		t.Fatal("expected model from fallback")
	}
}

// TestAIModelFactoryCreateWithFallbackBothFail 测试降级也失败
func TestAIModelFactoryCreateWithFallbackBothFail(t *testing.T) {
	factory := createTestFactory()

	// 两个都不支持
	model, err := factory.CreateWithFallback("unsupported1", "unsupported2")

	if err == nil {
		t.Fatal("expected error when both fail")
	}

	if model != nil {
		t.Fatal("expected model to be nil")
	}
}

// TestAIModelFactorySupportedModels 测试获取支持的模型列表
func TestAIModelFactorySupportedModels(t *testing.T) {
	factory := createTestFactory()

	models := factory.SupportedModels()

	if len(models) == 0 {
		t.Fatal("expected at least one supported model")
	}

	// 检查必要的模型
	hasGemini := false
	hasMock := false
	for _, m := range models {
		if m == "gemini" {
			hasGemini = true
		}
		if m == "mock" {
			hasMock = true
		}
	}

	if !hasGemini {
		t.Fatal("expected gemini to be supported")
	}

	if !hasMock {
		t.Fatal("expected mock to be supported")
	}
}

// TestAIModelFactoryIsModelSupported 测试模型支持检查
func TestAIModelFactoryIsModelSupported(t *testing.T) {
	factory := createTestFactory()

	tests := []struct {
		model     string
		supported bool
	}{
		{"mock", true},
		{"gemini", true},
		{"gpt-4", true},
		{"gpt4", true},
		{"deepseek", true},
		{"unsupported", false},
	}

	for _, tt := range tests {
		supported := factory.IsModelSupported(tt.model)
		if supported != tt.supported {
			t.Fatalf("for model %s: expected %v, got %v", tt.model, tt.supported, supported)
		}
	}
}

// TestAIModelFactoryGetModelInfo 测试获取模型信息
func TestAIModelFactoryGetModelInfo(t *testing.T) {
	factory := createTestFactory()

	info, err := factory.GetModelInfo("mock")

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if info.Name != "mock-model" {
		t.Fatalf("expected name 'mock-model', got %s", info.Name)
	}

	if info.Provider != "Mock Provider" {
		t.Fatalf("expected provider 'Mock Provider', got %s", info.Provider)
	}
}

// TestAIModelFactoryCreateDifferentModels 测试创建不同类型的模型
func TestAIModelFactoryCreateDifferentModels(t *testing.T) {
	factory := createTestFactory()

	tests := []string{"mock", "gpt-4", "deepseek"}

	for _, modelName := range tests {
		model, err := factory.CreateUnderstandingModel(modelName)

		if err != nil {
			t.Fatalf("failed to create %s: %v", modelName, err)
		}

		if model == nil {
			t.Fatalf("expected model for %s", modelName)
		}

		info := model.GetModelInfo()
		if info.Name == "" {
			t.Fatalf("expected model info for %s", modelName)
		}
	}
}

// BenchmarkAIModelFactoryCreate 性能基准测试
func BenchmarkAIModelFactoryCreate(b *testing.B) {
	factory := createTestFactory()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		factory.CreateUnderstandingModel("mock")
	}
}

// BenchmarkAIModelFactoryGetModelInfo 模型信息获取的性能基准
func BenchmarkAIModelFactoryGetModelInfo(b *testing.B) {
	factory := createTestFactory()
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		factory.GetModelInfo("mock")
	}
}
