package mem0

import (
	"fmt"
	"log"
	"strconv"
)

// StateStore 定义数据库配置读取接口
type StateStore interface {
	GetSystemConfig(key string) (string, error)
	SetSystemConfig(key, value string) error
}

// Config Mem0系统的完整配置结构
type Config struct {
	// 核心开关
	Enabled bool

	// API认证
	APIKey  string
	APIURL  string
	UserID  string
	OrgID   string

	// AI模型选择 (新增 - 支持Gemini、GPT-4等)
	UnderstandingModel string // 用于理解决策的AI模型："gemini", "gpt-4", "deepseek"
	FallbackModel      string // 备用模型，如果主模型失败则使用此模型

	// AI模型参数
	Model       string
	Temperature float64
	MaxTokens   int

	// 记忆存储
	MemoryLimit        int
	VectorDim          int
	SimilarityThreshold float64

	// 缓存和预热
	CacheTTLMinutes    int
	WarmupInterval     int
	WarmupEnabled      bool

	// 断路器
	CircuitBreakerEnabled      bool
	CircuitBreakerThreshold    int
	CircuitBreakerTimeoutSecs  int

	// 压缩和过滤
	ContextCompressionEnabled bool
	MaxPromptTokens          int
	QualityFilterEnabled     bool
	QualityScoreThreshold    float64

	// 反思和学习
	ReflectionEnabled       bool
	ReflectionStatusTracking bool
	EvaluationDelayDays     int

	// 监控
	MetricsEnabled bool
	MetricsInterval int
	VerboseLogging bool

	// 灰度发布
	RolloutPercentage   int
	AutoRollbackEnabled bool
	ErrorRateThreshold  float64
	LatencyThresholdMs  int

	// A/B测试
	ABTestEnabled            bool
	ABTestControlPercentage  int
	ABTestDurationDays       int
}

// LoadConfig 从数据库加载Mem0配置
func LoadConfig(store StateStore) (*Config, error) {
	cfg := &Config{}

	// 1. 读取核心开关
	enabledStr, _ := store.GetSystemConfig("mem0_enabled")
	cfg.Enabled = enabledStr == "true"

	if !cfg.Enabled {
		log.Println("🔕 Mem0集成未启用 (mem0_enabled=false)")
		return cfg, nil
	}

	// 2. 读取API认证(必需)
	var missingKeys []string

	cfg.APIKey, _ = store.GetSystemConfig("mem0_api_key")
	if cfg.APIKey == "" {
		missingKeys = append(missingKeys, "mem0_api_key")
	}

	cfg.UserID, _ = store.GetSystemConfig("mem0_user_id")
	if cfg.UserID == "" {
		missingKeys = append(missingKeys, "mem0_user_id")
	}

	cfg.OrgID, _ = store.GetSystemConfig("mem0_organization_id")
	if cfg.OrgID == "" {
		missingKeys = append(missingKeys, "mem0_organization_id")
	}

	if len(missingKeys) > 0 {
		return nil, fmt.Errorf("❌ Mem0关键配置缺失: %v (需要在system_config中配置)", missingKeys)
	}

	cfg.APIURL, _ = store.GetSystemConfig("mem0_api_url")
	if cfg.APIURL == "" {
		cfg.APIURL = "https://api.mem0.ai/v1" // 默认值
	}

	// 3. 读取AI模型配置
	cfg.Model, _ = store.GetSystemConfig("mem0_model")
	if cfg.Model == "" {
		cfg.Model = "gpt-4"
	}

	tempStr, _ := store.GetSystemConfig("mem0_temperature")
	cfg.Temperature = 0.7
	if val, err := strconv.ParseFloat(tempStr, 64); err == nil && val >= 0 && val <= 1 {
		cfg.Temperature = val
	}

	maxTokenStr, _ := store.GetSystemConfig("mem0_max_tokens")
	cfg.MaxTokens = 2000
	if val, err := strconv.Atoi(maxTokenStr); err == nil && val > 0 {
		cfg.MaxTokens = val
	}

	// 4. 读取记忆存储参数
	memoryStr, _ := store.GetSystemConfig("mem0_memory_limit")
	cfg.MemoryLimit = 8000
	if val, err := strconv.Atoi(memoryStr); err == nil && val > 0 {
		cfg.MemoryLimit = val
	}

	vectorStr, _ := store.GetSystemConfig("mem0_vector_dim")
	cfg.VectorDim = 1536
	if val, err := strconv.Atoi(vectorStr); err == nil && val > 0 {
		cfg.VectorDim = val
	}

	similarityStr, _ := store.GetSystemConfig("mem0_similarity_threshold")
	cfg.SimilarityThreshold = 0.6
	if val, err := strconv.ParseFloat(similarityStr, 64); err == nil && val >= 0 && val <= 1 {
		cfg.SimilarityThreshold = val
	}

	// 5. 读取缓存配置
	cacheTTLStr, _ := store.GetSystemConfig("mem0_cache_ttl_minutes")
	cfg.CacheTTLMinutes = 30
	if val, err := strconv.Atoi(cacheTTLStr); err == nil && val > 0 {
		cfg.CacheTTLMinutes = val
	}

	warmupStr, _ := store.GetSystemConfig("mem0_warmup_interval_minutes")
	cfg.WarmupInterval = 5
	if val, err := strconv.Atoi(warmupStr); err == nil && val > 0 {
		cfg.WarmupInterval = val
	}

	warmupEnabledStr, _ := store.GetSystemConfig("mem0_warmup_enabled")
	cfg.WarmupEnabled = warmupEnabledStr == "true"

	// 6. 读取断路器配置
	cbEnabledStr, _ := store.GetSystemConfig("mem0_circuit_breaker_enabled")
	cfg.CircuitBreakerEnabled = cbEnabledStr != "false" // 默认启用

	cbThresholdStr, _ := store.GetSystemConfig("mem0_circuit_breaker_threshold")
	cfg.CircuitBreakerThreshold = 3
	if val, err := strconv.Atoi(cbThresholdStr); err == nil && val > 0 {
		cfg.CircuitBreakerThreshold = val
	}

	cbTimeoutStr, _ := store.GetSystemConfig("mem0_circuit_breaker_timeout_seconds")
	cfg.CircuitBreakerTimeoutSecs = 300
	if val, err := strconv.Atoi(cbTimeoutStr); err == nil && val > 0 {
		cfg.CircuitBreakerTimeoutSecs = val
	}

	// 7. 读取压缩和过滤配置
	compressionStr, _ := store.GetSystemConfig("mem0_context_compression_enabled")
	cfg.ContextCompressionEnabled = compressionStr != "false" // 默认启用

	maxPromptStr, _ := store.GetSystemConfig("mem0_max_prompt_tokens")
	cfg.MaxPromptTokens = 2500
	if val, err := strconv.Atoi(maxPromptStr); err == nil && val > 0 {
		cfg.MaxPromptTokens = val
	}

	filterStr, _ := store.GetSystemConfig("mem0_quality_filter_enabled")
	cfg.QualityFilterEnabled = filterStr != "false" // 默认启用

	filterThresholdStr, _ := store.GetSystemConfig("mem0_quality_score_threshold")
	cfg.QualityScoreThreshold = 0.3
	if val, err := strconv.ParseFloat(filterThresholdStr, 64); err == nil && val >= 0 && val <= 1 {
		cfg.QualityScoreThreshold = val
	}

	// 8. 读取反思配置
	reflectionStr, _ := store.GetSystemConfig("mem0_reflection_enabled")
	cfg.ReflectionEnabled = reflectionStr != "false" // 默认启用

	reflectionSMStr, _ := store.GetSystemConfig("mem0_reflection_status_tracking")
	cfg.ReflectionStatusTracking = reflectionSMStr != "false" // 默认启用

	evalDelayStr, _ := store.GetSystemConfig("mem0_evaluation_delay_days")
	cfg.EvaluationDelayDays = 3
	if val, err := strconv.Atoi(evalDelayStr); err == nil && val > 0 {
		cfg.EvaluationDelayDays = val
	}

	// 9. 读取监控配置
	metricsStr, _ := store.GetSystemConfig("mem0_metrics_enabled")
	cfg.MetricsEnabled = metricsStr != "false" // 默认启用

	metricsIntervalStr, _ := store.GetSystemConfig("mem0_metrics_interval_minutes")
	cfg.MetricsInterval = 1
	if val, err := strconv.Atoi(metricsIntervalStr); err == nil && val > 0 {
		cfg.MetricsInterval = val
	}

	verboseStr, _ := store.GetSystemConfig("mem0_verbose_logging")
	cfg.VerboseLogging = verboseStr == "true"

	// 10. 读取灰度发布配置
	rolloutStr, _ := store.GetSystemConfig("mem0_rollout_percentage")
	cfg.RolloutPercentage = 0 // 默认0%
	if val, err := strconv.Atoi(rolloutStr); err == nil && val >= 0 && val <= 100 {
		cfg.RolloutPercentage = val
	}

	autoRollbackStr, _ := store.GetSystemConfig("mem0_auto_rollback_enabled")
	cfg.AutoRollbackEnabled = autoRollbackStr != "false" // 默认启用

	errorRateStr, _ := store.GetSystemConfig("mem0_error_rate_threshold")
	cfg.ErrorRateThreshold = 5.0
	if val, err := strconv.ParseFloat(errorRateStr, 64); err == nil && val > 0 {
		cfg.ErrorRateThreshold = val
	}

	latencyStr, _ := store.GetSystemConfig("mem0_latency_threshold_ms")
	cfg.LatencyThresholdMs = 2000
	if val, err := strconv.Atoi(latencyStr); err == nil && val > 0 {
		cfg.LatencyThresholdMs = val
	}

	// 11. 读取A/B测试配置
	abTestStr, _ := store.GetSystemConfig("mem0_ab_test_enabled")
	cfg.ABTestEnabled = abTestStr == "true"

	controlPctStr, _ := store.GetSystemConfig("mem0_ab_test_control_percentage")
	cfg.ABTestControlPercentage = 50
	if val, err := strconv.Atoi(controlPctStr); err == nil && val >= 0 && val <= 100 {
		cfg.ABTestControlPercentage = val
	}

	durationStr, _ := store.GetSystemConfig("mem0_ab_test_duration_days")
	cfg.ABTestDurationDays = 7
	if val, err := strconv.Atoi(durationStr); err == nil && val > 0 {
		cfg.ABTestDurationDays = val
	}

	// 日志输出
	log.Println("✅ Mem0配置加载完成:")
	log.Printf("   - API URL: %s", cfg.APIURL)
	log.Printf("   - 用户ID: %s", maskString(cfg.UserID, 4))
	log.Printf("   - 模型: %s (温度: %.1f)", cfg.Model, cfg.Temperature)
	log.Printf("   - 缓存TTL: %d分钟", cfg.CacheTTLMinutes)
	log.Printf("   - 断路器: %v (阈值: %d)", cfg.CircuitBreakerEnabled, cfg.CircuitBreakerThreshold)
	log.Printf("   - 灰度: %d%% (自动回滚: %v)", cfg.RolloutPercentage, cfg.AutoRollbackEnabled)
	log.Printf("   - A/B测试: %v", cfg.ABTestEnabled)
	log.Printf("   - 详细日志: %v", cfg.VerboseLogging)

	// 6. 读取AI模型选择配置 (新增 - 支持使用Gemini作为理解模型)
	cfg.UnderstandingModel, _ = store.GetSystemConfig("mem0_understanding_model")
	if cfg.UnderstandingModel == "" {
		cfg.UnderstandingModel = "gemini" // 默认使用Gemini
	}

	cfg.FallbackModel, _ = store.GetSystemConfig("mem0_fallback_model")
	if cfg.FallbackModel == "" {
		cfg.FallbackModel = "gpt-4" // 默认备用模型
	}

	log.Printf("✅ Mem0配置加载完成")
	log.Printf("   - 理解模型: %s (备用: %s)", cfg.UnderstandingModel, cfg.FallbackModel)

	return cfg, nil
}

// maskString 掩码敏感信息(只显示最后N个字符)
func maskString(s string, suffix int) string {
	if len(s) <= suffix {
		return "****"
	}
	return "***" + s[len(s)-suffix:]
}

// UpdateConfig 动态更新配置到数据库
func UpdateConfig(store StateStore, key, value string) error {
	if err := store.SetSystemConfig(key, value); err != nil {
		return fmt.Errorf("❌ 更新配置 %s 失败: %w", key, err)
	}
	log.Printf("✅ 配置已更新: %s = %s", key, value)
	return nil
}

// PrintConfig 打印完整配置(用于调试)
func (c *Config) PrintConfig() {
	log.Println("📋 Mem0配置详情:")
	log.Printf("  Enabled: %v", c.Enabled)
	log.Printf("  API URL: %s", c.APIURL)
	log.Printf("  User ID: %s", maskString(c.UserID, 4))
	log.Printf("  Org ID: %s", maskString(c.OrgID, 4))
	log.Printf("  Model: %s", c.Model)
	log.Printf("  Temperature: %.2f", c.Temperature)
	log.Printf("  Max Tokens: %d", c.MaxTokens)
	log.Printf("  Memory Limit: %d tokens", c.MemoryLimit)
	log.Printf("  Vector Dim: %d", c.VectorDim)
	log.Printf("  Similarity Threshold: %.2f", c.SimilarityThreshold)
	log.Printf("  Cache TTL: %d min", c.CacheTTLMinutes)
	log.Printf("  Warmup Enabled: %v (interval: %d min)", c.WarmupEnabled, c.WarmupInterval)
	log.Printf("  Circuit Breaker: %v (threshold: %d, timeout: %d sec)", c.CircuitBreakerEnabled, c.CircuitBreakerThreshold, c.CircuitBreakerTimeoutSecs)
	log.Printf("  Context Compression: %v (max tokens: %d)", c.ContextCompressionEnabled, c.MaxPromptTokens)
	log.Printf("  Quality Filter: %v (threshold: %.2f)", c.QualityFilterEnabled, c.QualityScoreThreshold)
	log.Printf("  Reflection: %v (status tracking: %v, eval delay: %d days)", c.ReflectionEnabled, c.ReflectionStatusTracking, c.EvaluationDelayDays)
	log.Printf("  Metrics: %v (interval: %d min)", c.MetricsEnabled, c.MetricsInterval)
	log.Printf("  Verbose Logging: %v", c.VerboseLogging)
	log.Printf("  Rollout: %d%% (auto rollback: %v)", c.RolloutPercentage, c.AutoRollbackEnabled)
	log.Printf("  Error Rate Threshold: %.1f%% | Latency Threshold: %d ms", c.ErrorRateThreshold, c.LatencyThresholdMs)
	log.Printf("  A/B Test: %v (control: %d%%, duration: %d days)", c.ABTestEnabled, c.ABTestControlPercentage, c.ABTestDurationDays)
}
