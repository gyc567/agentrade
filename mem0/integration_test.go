package mem0

import (
	"context"
	"nofx/ai"
	"testing"
)

// TestMem0WithAIModelFactory 测试Mem0与AI模型工厂的集成
func TestMem0WithAIModelFactory(t *testing.T) {
	// 模拟配置
	cfg := &Config{
		Enabled: true,
		APIKey:  "test-key",
		APIURL:  "https://api.mem0.ai/v1",
		UserID:  "test-user",
		OrgID:   "test-org",

		// AI模型配置（新增）
		UnderstandingModel: "mock",      // 使用Mock模型进行测试
		FallbackModel:      "mock",      // 备用模型

		// 其他配置
		CacheTTLMinutes: 30,
		MetricsEnabled:  true,
	}

	// 创建AI模型工厂
	factory := ai.NewAIModelFactory(nil, nil)

	// 获取理解模型
	model, err := factory.CreateUnderstandingModel(cfg.UnderstandingModel)
	if err != nil {
		t.Fatalf("failed to create understanding model: %v", err)
	}

	if model == nil {
		t.Fatal("expected model instance")
	}

	// 验证模型可用
	ctx := context.Background()
	modelInfo := model.GetModelInfo()

	if modelInfo.Name == "" {
		t.Fatal("expected model name")
	}

	// 验证健康检查
	err = model.Health(ctx)
	if err != nil {
		t.Fatalf("health check failed: %v", err)
	}

	// 验证API调用
	response, err := model.CallAPI(ctx, "system prompt", "user prompt")
	if err != nil {
		t.Fatalf("API call failed: %v", err)
	}

	if response == "" {
		t.Fatal("expected non-empty response")
	}

	t.Logf("✅ Integration test passed")
	t.Logf("   Model: %s", modelInfo.Name)
	t.Logf("   Response: %s", response)
}

// TestMem0FallbackModel 测试Mem0的模型降级机制
func TestMem0FallbackModel(t *testing.T) {
	factory := ai.NewAIModelFactory(nil, nil)

	// 测试从不支持的模型降级到备用模型
	model, err := factory.CreateWithFallback("unsupported-model", "mock")

	if err != nil {
		t.Fatalf("expected fallback to work, got error: %v", err)
	}

	if model == nil {
		t.Fatal("expected model from fallback")
	}

	// 验证是Mock模型（备用模型）
	info := model.GetModelInfo()
	if info.Name != "mock-model" {
		t.Fatalf("expected mock model, got %s", info.Name)
	}

	t.Logf("✅ Fallback test passed - successfully fell back to mock model")
}

// TestMem0ConfigIntegration 测试Mem0配置与AI模型的集成
func TestMem0ConfigIntegration(t *testing.T) {
	// 创建模拟Config
	cfg := &Config{
		Enabled:            true,
		UnderstandingModel: "mock",
		FallbackModel:      "mock",
	}

	// 验证配置值
	if cfg.UnderstandingModel != "mock" {
		t.Fatalf("expected understanding model 'mock', got %s", cfg.UnderstandingModel)
	}

	if cfg.FallbackModel != "mock" {
		t.Fatalf("expected fallback model 'mock', got %s", cfg.FallbackModel)
	}

	// 创建工厂并验证可以创建指定的模型
	factory := ai.NewAIModelFactory(nil, nil)
	model, err := factory.CreateUnderstandingModel(cfg.UnderstandingModel)

	if err != nil {
		t.Fatalf("failed to create configured model: %v", err)
	}

	if model == nil {
		t.Fatal("expected model")
	}

	t.Logf("✅ Configuration integration test passed")
	t.Logf("   Understanding Model: %s", cfg.UnderstandingModel)
	t.Logf("   Fallback Model: %s", cfg.FallbackModel)
}

// BenchmarkMem0ModelCreation Mem0模型创建的性能基准
func BenchmarkMem0ModelCreation(b *testing.B) {
	factory := ai.NewAIModelFactory(nil, nil)
	cfg := &Config{
		UnderstandingModel: "mock",
		FallbackModel:      "mock",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		factory.CreateUnderstandingModel(cfg.UnderstandingModel)
	}
}

// BenchmarkMem0ModelWithFallback Mem0带降级的模型创建的性能基准
func BenchmarkMem0ModelWithFallback(b *testing.B) {
	factory := ai.NewAIModelFactory(nil, nil)
	cfg := &Config{
		UnderstandingModel: "mock",
		FallbackModel:      "mock",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		factory.CreateWithFallback(cfg.UnderstandingModel, cfg.FallbackModel)
	}
}
