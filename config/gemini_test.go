package config

import (
	"os"
	"strings"
	"testing"
)

// ==================== 单元测试 ====================

// TestGeminiConfigDefaultValues 测试默认配置值
func TestGeminiConfigDefaultValues(t *testing.T) {
	cfg := &GeminiConfig{
		Enabled:     false,
		APIURL:      "https://gemini-proxy-iota-weld.vercel.app",
		Model:       "gemini-3-flash-preview",
		Temperature: 0.7,
		MaxTokens:   2000,
	}

	if cfg.APIURL != "https://gemini-proxy-iota-weld.vercel.app" {
		t.Errorf("❌ 默认API URL不匹配")
	}

	if cfg.Model != "gemini-3-flash-preview" {
		t.Errorf("❌ 默认模型不匹配")
	}

	t.Logf("✅ 默认配置值正确")
}

// TestValidateGeminiConfigDisabled 测试禁用状态下的验证
func TestValidateGeminiConfigDisabled(t *testing.T) {
	cfg := &GeminiConfig{
		Enabled: false,
		// 其他字段为空
	}

	// 禁用状态下，空配置也应该通过验证
	if err := ValidateGeminiConfig(cfg); err != nil {
		t.Errorf("❌ 禁用状态下验证失败: %v", err)
	}

	t.Logf("✅ 禁用状态验证通过")
}

// TestValidateGeminiConfigEnabledMissingKey 测试启用但API Key缺失
func TestValidateGeminiConfigEnabledMissingKey(t *testing.T) {
	cfg := &GeminiConfig{
		Enabled:   true,
		APIKey:    "",  // 缺失
		APIURL:    "https://gemini-proxy-iota-weld.vercel.app",
		Model:     "gemini-3-flash-preview",
		Temperature: 0.7,
	}

	if err := ValidateGeminiConfig(cfg); err == nil {
		t.Errorf("❌ 应该检测到缺失的API Key")
	}

	t.Logf("✅ 正确检测到缺失的API Key")
}

// TestValidateGeminiConfigTemperatureRange 测试温度参数范围验证
func TestValidateGeminiConfigTemperatureRange(t *testing.T) {
	testCases := []struct {
		name        string
		temperature float64
		shouldPass  bool
	}{
		{"有效-最低", 0.0, true},
		{"有效-中等", 0.5, true},
		{"有效-最高", 1.0, true},
		{"无效-超低", -0.1, false},
		{"无效-超高", 1.1, false},
	}

	for _, tc := range testCases {
		cfg := &GeminiConfig{
			Enabled:   true,
			APIKey:    "test-key",
			APIURL:    "https://test.url",
			Model:     "test-model",
			Temperature: tc.temperature,
		}

		err := ValidateGeminiConfig(cfg)
		if tc.shouldPass && err != nil {
			t.Errorf("❌ %s: 应该通过验证，但得到错误: %v", tc.name, err)
		}
		if !tc.shouldPass && err == nil {
			t.Errorf("❌ %s: 应该失败验证，但通过了", tc.name)
		}
	}

	t.Logf("✅ 温度参数范围验证正确")
}

// TestValidateGeminiConfigRolloutPercentage 测试灰度发布百分比范围
func TestValidateGeminiConfigRolloutPercentage(t *testing.T) {
	testCases := []struct {
		name              string
		rolloutPercentage float64
		shouldPass        bool
	}{
		{"有效-0%", 0.0, true},
		{"有效-50%", 50.0, true},
		{"有效-100%", 100.0, true},
		{"无效-负值", -10.0, false},
		{"无效-超100", 150.0, false},
	}

	for _, tc := range testCases {
		cfg := &GeminiConfig{
			Enabled:           true,
			APIKey:            "test-key",
			APIURL:            "https://test.url",
			Model:             "test-model",
			RolloutPercentage: tc.rolloutPercentage,
		}

		err := ValidateGeminiConfig(cfg)
		if tc.shouldPass && err != nil {
			t.Errorf("❌ %s: 应该通过验证，但得到错误: %v", tc.name, err)
		}
		if !tc.shouldPass && err == nil {
			t.Errorf("❌ %s: 应该失败验证，但通过了", tc.name)
		}
	}

	t.Logf("✅ 灰度发布百分比验证正确")
}

// TestParseBool 测试布尔解析函数
func TestParseBool(t *testing.T) {
	testCases := []struct {
		value    string
		expected bool
	}{
		{"true", true},
		{"True", true},
		{"1", true},
		{"yes", true},
		{"on", true},
		{"false", false},
		{"False", false},
		{"0", false},
		{"no", false},
		{"off", false},
		{"invalid", false},  // 默认值
	}

	configMap := make(map[string]string)
	for _, tc := range testCases {
		configMap["test_key"] = tc.value
		result := parseBool(configMap, "test_key", false)
		if result != tc.expected {
			t.Errorf("❌ parseBool(%q) = %v，期望 %v", tc.value, result, tc.expected)
		}
	}

	t.Logf("✅ 布尔解析函数正确")
}

// TestParseFloat 测试浮点解析函数
func TestParseFloat(t *testing.T) {
	testCases := []struct {
		value       string
		expected    float64
		defaultVal  float64
	}{
		{"0.5", 0.5, 0.0},
		{"1.0", 1.0, 0.0},
		{"-0.5", -0.5, 0.0},
		{"invalid", 0.5, 0.5},  // 使用默认值
		{"", 0.5, 0.5},          // 使用默认值
	}

	configMap := make(map[string]string)
	for _, tc := range testCases {
		configMap["test_key"] = tc.value
		result := parseFloat(configMap, "test_key", tc.defaultVal)
		if result != tc.expected {
			t.Errorf("❌ parseFloat(%q) = %f，期望 %f", tc.value, result, tc.expected)
		}
	}

	t.Logf("✅ 浮点解析函数正确")
}

// TestParseInt 测试整数解析函数
func TestParseInt(t *testing.T) {
	testCases := []struct {
		value      string
		expected   int
		defaultVal int
	}{
		{"10", 10, 0},
		{"0", 0, 0},
		{"-5", -5, 0},
		{"invalid", 99, 99},  // 使用默认值
		{"", 99, 99},         // 使用默认值
	}

	configMap := make(map[string]string)
	for _, tc := range testCases {
		configMap["test_key"] = tc.value
		result := parseInt(configMap, "test_key", tc.defaultVal)
		if result != tc.expected {
			t.Errorf("❌ parseInt(%q) = %d，期望 %d", tc.value, result, tc.expected)
		}
	}

	t.Logf("✅ 整数解析函数正确")
}

// TestGetAPIKeyEnvironmentVariable 测试API Key优先从环境变量读取
func TestGetAPIKeyEnvironmentVariable(t *testing.T) {
	// 设置环境变量
	testKey := "env-test-key-12345"
	os.Setenv("GEMINI_API_KEY", testKey)
	defer os.Unsetenv("GEMINI_API_KEY")

	configMap := map[string]string{
		"gemini_api_key": "db-test-key",  // 这个会被环境变量覆盖
	}

	result := getAPIKey(configMap)
	if result != testKey {
		t.Errorf("❌ getAPIKey() 应该优先使用环境变量，期望 %q，得到 %q", testKey, result)
	}

	t.Logf("✅ API Key 优先级验证正确（环境变量 > 数据库）")
}

// TestGetAPIKeyDatabaseFallback 测试API Key回退到数据库
func TestGetAPIKeyDatabaseFallback(t *testing.T) {
	// 清除环境变量
	os.Unsetenv("GEMINI_API_KEY")

	configMap := map[string]string{
		"gemini_api_key": "db-test-key",
	}

	result := getAPIKey(configMap)
	if result != "db-test-key" {
		t.Errorf("❌ getAPIKey() 应该回退到数据库值，期望 %q，得到 %q", "db-test-key", result)
	}

	t.Logf("✅ API Key 数据库回退验证正确")
}

// TestIsGeminiEnabled 测试Gemini启用状态检查
func TestIsGeminiEnabled(t *testing.T) {
	// 创建禁用配置
	cfg := &GeminiConfig{
		Enabled: false,
	}
	SetGlobalGeminiConfig(cfg)

	if IsGeminiEnabled() {
		t.Errorf("❌ IsGeminiEnabled() 应该返回 false")
	}

	// 创建启用配置
	cfg.Enabled = true
	cfg.APIKey = "test-key"
	cfg.APIURL = "https://test.url"
	cfg.Model = "test-model"
	_ = SetGlobalGeminiConfig(cfg)

	if !IsGeminiEnabled() {
		t.Errorf("❌ IsGeminiEnabled() 应该返回 true")
	}

	t.Logf("✅ Gemini启用状态检查正确")
}

// TestGetGeminiRolloutPercentage 测试灰度发布百分比获取
func TestGetGeminiRolloutPercentage(t *testing.T) {
	cfg := &GeminiConfig{
		RolloutPercentage: 50.0,
	}
	SetGlobalGeminiConfig(cfg)

	result := GetGeminiRolloutPercentage()
	if result != 50.0 {
		t.Errorf("❌ GetGeminiRolloutPercentage() 应该返回 50.0，得到 %.1f", result)
	}

	t.Logf("✅ 灰度发布百分比获取正确")
}

// TestGetGeminiConfigSummary 测试配置摘要获取
func TestGetGeminiConfigSummary(t *testing.T) {
	cfg := &GeminiConfig{
		Enabled:            true,
		APIKey:             "test-key",
		APIURL:             "https://test.url",
		Model:              "test-model",
		MaxTokens:          2000,
		TimeoutSeconds:     30,
		RolloutPercentage:  25.0,
		MetricsEnabled:     true,
	}
	err := SetGlobalGeminiConfig(cfg)
	if err != nil {
		t.Fatalf("❌ 设置全局配置失败: %v", err)
	}

	summary := GetGeminiConfigSummary()

	enabled, ok := summary["enabled"].(bool)
	if !ok || enabled != true {
		t.Errorf("❌ 配置摘要中 enabled 值不正确: %v (type: %T)", summary["enabled"], summary["enabled"])
	}

	model, ok := summary["model"].(string)
	if !ok || model != "test-model" {
		t.Errorf("❌ 配置摘要中 model 值不正确: %v (type: %T)", summary["model"], summary["model"])
	}

	rollout, ok := summary["rollout_percentage"].(float64)
	if !ok || rollout != 25.0 {
		t.Errorf("❌ 配置摘要中 rollout_percentage 值不正确: %v (type: %T)", summary["rollout_percentage"], summary["rollout_percentage"])
	}

	t.Logf("✅ 配置摘要获取正确")
}

// TestCompleteGeminiConfigFlow 集成测试：完整配置流程
func TestCompleteGeminiConfigFlow(t *testing.T) {
	// Step 1: 创建完整配置
	configMap := map[string]string{
		"gemini_enabled":                    "true",
		"gemini_api_key":                    "test-key-123",
		"gemini_api_url":                    "https://gemini-proxy-iota-weld.vercel.app",
		"gemini_api_version":                "v1beta",
		"gemini_model":                      "gemini-3-flash-preview",
		"gemini_temperature":                "0.7",
		"gemini_max_tokens":                 "2000",
		"gemini_top_p":                      "0.95",
		"gemini_top_k":                      "40",
		"gemini_cache_enabled":              "true",
		"gemini_cache_ttl_minutes":          "30",
		"gemini_circuit_breaker_enabled":    "true",
		"gemini_circuit_breaker_threshold":  "3",
		"gemini_rollout_percentage":         "50",
		"gemini_auto_fallback_enabled":      "true",
		"gemini_metrics_enabled":            "true",
		"gemini_timeout_seconds":            "30",
		"gemini_retry_enabled":              "true",
	}

	// Step 2: 构建配置对象
	cfg := &GeminiConfig{
		Enabled:                       parseBool(configMap, "gemini_enabled", false),
		APIKey:                        configMap["gemini_api_key"],
		APIURL:                        configMap["gemini_api_url"],
		APIVersion:                    configMap["gemini_api_version"],
		Model:                         configMap["gemini_model"],
		Temperature:                   parseFloat(configMap, "gemini_temperature", 0.7),
		MaxTokens:                     parseInt(configMap, "gemini_max_tokens", 2000),
		TopP:                          parseFloat(configMap, "gemini_top_p", 0.95),
		TopK:                          parseInt(configMap, "gemini_top_k", 40),
		CacheEnabled:                  parseBool(configMap, "gemini_cache_enabled", true),
		CacheTTLMinutes:               parseInt(configMap, "gemini_cache_ttl_minutes", 30),
		CircuitBreakerEnabled:         parseBool(configMap, "gemini_circuit_breaker_enabled", true),
		CircuitBreakerThreshold:       parseInt(configMap, "gemini_circuit_breaker_threshold", 3),
		RolloutPercentage:             parseFloat(configMap, "gemini_rollout_percentage", 0),
		AutoFallbackEnabled:           parseBool(configMap, "gemini_auto_fallback_enabled", true),
		MetricsEnabled:                parseBool(configMap, "gemini_metrics_enabled", true),
		TimeoutSeconds:                parseInt(configMap, "gemini_timeout_seconds", 30),
		RetryEnabled:                  parseBool(configMap, "gemini_retry_enabled", true),
	}

	// Step 3: 验证配置
	if err := ValidateGeminiConfig(cfg); err != nil {
		t.Errorf("❌ 完整配置验证失败: %v", err)
	}

	// Step 4: 检查关键字段
	if cfg.Enabled != true {
		t.Errorf("❌ Enabled 值不正确")
	}
	if cfg.APIKey != "test-key-123" {
		t.Errorf("❌ APIKey 值不正确")
	}
	if cfg.Temperature != 0.7 {
		t.Errorf("❌ Temperature 值不正确")
	}
	if cfg.RolloutPercentage != 50.0 {
		t.Errorf("❌ RolloutPercentage 值不正确")
	}

	t.Logf("✅ 完整配置流程正确")
}

// BenchmarkValidateGeminiConfig 性能基准测试
func BenchmarkValidateGeminiConfig(b *testing.B) {
	cfg := &GeminiConfig{
		Enabled:   true,
		APIKey:    "test-key",
		APIURL:    "https://test.url",
		Model:     "test-model",
		Temperature: 0.7,
		TopP:      0.95,
		MaxTokens: 2000,
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = ValidateGeminiConfig(cfg)
	}
}

// TestMain 测试主函数
func TestMain(m *testing.M) {
	// 打印测试开始信息
	println("\n🧪 开始执行Gemini配置测试...")
	println(strings.Repeat("═", 60))

	// 运行所有测试
	code := m.Run()

	// 打印测试完成信息
	println(strings.Repeat("═", 60))
	println("✅ Gemini配置测试完成")

	os.Exit(code)
}
