package config

import (
	"database/sql"
	"fmt"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// GeminiConfig Gemini AI模型配置
// 对标Mem0的配置方式，保持结构一致性（Linus的"有品味的设计"）
type GeminiConfig struct {
	// ==================== 核心开关 ====================
	Enabled bool

	// ==================== API认证 ====================
	APIKey     string
	APIURL     string
	APIVersion string

	// ==================== 模型参数 ====================
	Model       string
	Temperature float64
	MaxTokens   int

	// ==================== 高级采样参数 ====================
	TopP float64
	TopK int

	// ==================== 缓存和性能 ====================
	CacheEnabled      bool
	CacheTTLMinutes   int

	// ==================== 容错机制 ====================
	CircuitBreakerEnabled   bool
	CircuitBreakerThreshold int
	CircuitBreakerTimeoutSeconds int

	// ==================== 监控和日志 ====================
	MetricsEnabled   bool
	VerboseLogging   bool
	LogRequests      bool

	// ==================== 灰度发布 ====================
	RolloutPercentage     float64
	AutoFallbackEnabled   bool
	ErrorRateThreshold    float64

	// ==================== 超时配置 ====================
	TimeoutSeconds        int
	ConnectTimeoutSeconds int

	// ==================== 重试策略 ====================
	RetryEnabled      bool
	RetryMaxAttempts  int
	RetryBackoffMS    int

	// ==================== 元数据 ====================
	LoadedAt  time.Time
	UpdatedAt time.Time
	mu        sync.RWMutex
}

var (
	// 全局Gemini配置实例
	globalGeminiConfig *GeminiConfig
	geminiMutex        sync.RWMutex
)

// LoadGeminiConfig 从system_config表加载Gemini配置
// 关键设计：
// 1. 敏感信息（API Key）优先从环境变量读取，覆盖数据库值
// 2. 配置验证在加载时进行，早期发现错误
// 3. 返回的配置对象是不可变的（通过mutex保护）
func LoadGeminiConfig(db *sql.DB) (*GeminiConfig, error) {
	cfg := &GeminiConfig{
		LoadedAt: time.Now(),
	}

	// Step 1: 从数据库加载所有gemini_*配置
	rows, err := db.Query(`
		SELECT key, value
		FROM system_config
		WHERE key LIKE 'gemini_%'
		ORDER BY key
	`)
	if err != nil {
		return nil, fmt.Errorf("❌ 查询Gemini配置失败: %w", err)
	}
	defer rows.Close()

	// Step 2: 解析配置值
	configMap := make(map[string]string)
	for rows.Next() {
		var key, value string
		if err := rows.Scan(&key, &value); err != nil {
			return nil, fmt.Errorf("❌ 读取配置项失败: %w", err)
		}
		configMap[key] = value
	}

	// Step 3: 将配置值映射到结构体字段
	cfg.Enabled = parseBool(configMap, "gemini_enabled", false)

	// 核心API配置
	cfg.APIKey = getAPIKey(configMap)  // 关键：环境变量覆盖
	cfg.APIURL = configMap["gemini_api_url"]
	cfg.APIVersion = configMap["gemini_api_version"]

	// 模型参数
	cfg.Model = configMap["gemini_model"]
	cfg.Temperature = parseFloat(configMap, "gemini_temperature", 0.7)
	cfg.MaxTokens = parseInt(configMap, "gemini_max_tokens", 2000)

	// 高级参数
	cfg.TopP = parseFloat(configMap, "gemini_top_p", 0.95)
	cfg.TopK = parseInt(configMap, "gemini_top_k", 40)

	// 缓存
	cfg.CacheEnabled = parseBool(configMap, "gemini_cache_enabled", true)
	cfg.CacheTTLMinutes = parseInt(configMap, "gemini_cache_ttl_minutes", 30)

	// 断路器
	cfg.CircuitBreakerEnabled = parseBool(configMap, "gemini_circuit_breaker_enabled", true)
	cfg.CircuitBreakerThreshold = parseInt(configMap, "gemini_circuit_breaker_threshold", 3)
	cfg.CircuitBreakerTimeoutSeconds = parseInt(configMap, "gemini_circuit_breaker_timeout_seconds", 300)

	// 监控
	cfg.MetricsEnabled = parseBool(configMap, "gemini_metrics_enabled", true)
	cfg.VerboseLogging = parseBool(configMap, "gemini_verbose_logging", false)
	cfg.LogRequests = parseBool(configMap, "gemini_log_requests", false)

	// 灰度发布
	cfg.RolloutPercentage = parseFloat(configMap, "gemini_rollout_percentage", 0.0)
	cfg.AutoFallbackEnabled = parseBool(configMap, "gemini_auto_fallback_enabled", true)
	cfg.ErrorRateThreshold = parseFloat(configMap, "gemini_error_rate_threshold", 5.0)

	// 超时
	cfg.TimeoutSeconds = parseInt(configMap, "gemini_timeout_seconds", 30)
	cfg.ConnectTimeoutSeconds = parseInt(configMap, "gemini_connect_timeout_seconds", 10)

	// 重试
	cfg.RetryEnabled = parseBool(configMap, "gemini_retry_enabled", true)
	cfg.RetryMaxAttempts = parseInt(configMap, "gemini_retry_max_attempts", 3)
	cfg.RetryBackoffMS = parseInt(configMap, "gemini_retry_backoff_ms", 500)

	cfg.UpdatedAt = time.Now()

	// Step 4: 验证配置有效性
	if err := ValidateGeminiConfig(cfg); err != nil {
		return nil, err
	}

	// Step 5: 日志输出（不输出API Key）
	logGeminiConfig(cfg)

	return cfg, nil
}

// ValidateGeminiConfig 验证Gemini配置的有效性
// 关键设计：
// - 如果Gemini被禁用，跳过大部分验证（早期返回）
// - 只验证实际会被使用的参数
// - 提供清晰的错误信息供管理员调试
func ValidateGeminiConfig(cfg *GeminiConfig) error {
	if !cfg.Enabled {
		return nil  // 禁用状态下不需要验证
	}

	// 必填项验证
	if cfg.APIKey == "" {
		return fmt.Errorf("❌ gemini_api_key 不能为空，请设置环境变量 GEMINI_API_KEY")
	}

	if cfg.APIURL == "" {
		return fmt.Errorf("❌ gemini_api_url 不能为空")
	}

	if cfg.Model == "" {
		return fmt.Errorf("❌ gemini_model 不能为空")
	}

	// 参数范围验证
	if cfg.Temperature < 0 || cfg.Temperature > 1 {
		return fmt.Errorf("❌ gemini_temperature 必须在 0-1 之间，当前: %.2f", cfg.Temperature)
	}

	if cfg.TopP < 0 || cfg.TopP > 1 {
		return fmt.Errorf("❌ gemini_top_p 必须在 0-1 之间，当前: %.2f", cfg.TopP)
	}

	if cfg.TopK < 0 {
		return fmt.Errorf("❌ gemini_top_k 必须大于0，当前: %d", cfg.TopK)
	}

	if cfg.MaxTokens <= 0 {
		return fmt.Errorf("❌ gemini_max_tokens 必须大于0，当前: %d", cfg.MaxTokens)
	}

	if cfg.RolloutPercentage < 0 || cfg.RolloutPercentage > 100 {
		return fmt.Errorf("❌ gemini_rollout_percentage 必须在 0-100 之间，当前: %.1f", cfg.RolloutPercentage)
	}

	if cfg.TimeoutSeconds <= 0 {
		return fmt.Errorf("❌ gemini_timeout_seconds 必须大于0，当前: %d", cfg.TimeoutSeconds)
	}

	return nil
}

// GetGlobalGeminiConfig 获取全局Gemini配置实例
// 使用模式：线程安全的单例读取
func GetGlobalGeminiConfig() *GeminiConfig {
	geminiMutex.RLock()
	defer geminiMutex.RUnlock()

	if globalGeminiConfig == nil {
		return &GeminiConfig{
			Enabled: false,  // 默认禁用
		}
	}

	return globalGeminiConfig
}

// SetGlobalGeminiConfig 设置全局Gemini配置实例
// 用于初始化或配置热重载
func SetGlobalGeminiConfig(cfg *GeminiConfig) error {
	if err := ValidateGeminiConfig(cfg); err != nil {
		return err
	}

	geminiMutex.Lock()
	defer geminiMutex.Unlock()

	globalGeminiConfig = cfg
	return nil
}

// ReloadGeminiConfig 重新加载Gemini配置（支持热更新）
// 使用场景：管理员更新system_config后无需重启服务
func ReloadGeminiConfig(db *sql.DB) error {
	cfg, err := LoadGeminiConfig(db)
	if err != nil {
		return fmt.Errorf("❌ 重载Gemini配置失败: %w", err)
	}

	return SetGlobalGeminiConfig(cfg)
}

// IsGeminiEnabled 检查Gemini是否启用
func IsGeminiEnabled() bool {
	return GetGlobalGeminiConfig().Enabled
}

// GetGeminiRolloutPercentage 获取灰度发布百分比
// 用于决定是否将流量路由到Gemini
func GetGeminiRolloutPercentage() float64 {
	return GetGlobalGeminiConfig().RolloutPercentage
}

// ==================== 辅助函数 ====================

// getAPIKey 获取API Key（优先级：环境变量 > 数据库）
// 关键设计：敏感信息绝不hardcode在代码中
func getAPIKey(configMap map[string]string) string {
	// Step 1: 优先从环境变量读取（安全做法）
	if envKey := os.Getenv("GEMINI_API_KEY"); envKey != "" {
		return envKey
	}

	// Step 2: 回退到数据库值
	if dbKey := configMap["gemini_api_key"]; dbKey != "" {
		return dbKey
	}

	return ""
}

// parseBool 解析布尔配置值
func parseBool(configMap map[string]string, key string, defaultVal bool) bool {
	val, ok := configMap[key]
	if !ok {
		return defaultVal
	}

	val = strings.ToLower(strings.TrimSpace(val))
	switch val {
	case "true", "1", "yes", "on":
		return true
	case "false", "0", "no", "off":
		return false
	default:
		return defaultVal
	}
}

// parseInt 解析整数配置值
func parseInt(configMap map[string]string, key string, defaultVal int) int {
	val, ok := configMap[key]
	if !ok {
		return defaultVal
	}

	intVal, err := strconv.Atoi(strings.TrimSpace(val))
	if err != nil {
		return defaultVal
	}

	return intVal
}

// parseFloat 解析浮点配置值
func parseFloat(configMap map[string]string, key string, defaultVal float64) float64 {
	val, ok := configMap[key]
	if !ok {
		return defaultVal
	}

	floatVal, err := strconv.ParseFloat(strings.TrimSpace(val), 64)
	if err != nil {
		return defaultVal
	}

	return floatVal
}

// logGeminiConfig 输出Gemini配置信息（不包含敏感信息）
func logGeminiConfig(cfg *GeminiConfig) {
	fmt.Println("\n📋 Gemini配置加载完成:")
	fmt.Println(strings.Repeat("═", 60))

	fmt.Printf("  核心配置:\n")
	fmt.Printf("    ├─ 启用: %v\n", cfg.Enabled)
	fmt.Printf("    ├─ API URL: %s\n", cfg.APIURL)
	fmt.Printf("    ├─ API版本: %s\n", cfg.APIVersion)
	fmt.Printf("    └─ 模型: %s\n", cfg.Model)

	fmt.Printf("  模型参数:\n")
	fmt.Printf("    ├─ 温度: %.2f\n", cfg.Temperature)
	fmt.Printf("    ├─ 最大令牌: %d\n", cfg.MaxTokens)
	fmt.Printf("    ├─ TopP: %.2f\n", cfg.TopP)
	fmt.Printf("    └─ TopK: %d\n", cfg.TopK)

	fmt.Printf("  性能配置:\n")
	fmt.Printf("    ├─ 缓存: %v (TTL: %d分钟)\n", cfg.CacheEnabled, cfg.CacheTTLMinutes)
	fmt.Printf("    ├─ 断路器: %v (阈值: %d次失败)\n", cfg.CircuitBreakerEnabled, cfg.CircuitBreakerThreshold)
	fmt.Printf("    └─ 超时: %d秒\n", cfg.TimeoutSeconds)

	fmt.Printf("  灰度发布:\n")
	fmt.Printf("    ├─ 发布百分比: %.1f%%\n", cfg.RolloutPercentage)
	fmt.Printf("    └─ 自动降级: %v\n", cfg.AutoFallbackEnabled)

	fmt.Printf("  监控:\n")
	fmt.Printf("    ├─ 指标收集: %v\n", cfg.MetricsEnabled)
	fmt.Printf("    └─ 详细日志: %v\n", cfg.VerboseLogging)

	fmt.Printf("  加载时间: %s\n", cfg.LoadedAt.Format("2006-01-02 15:04:05"))
	fmt.Println(strings.Repeat("═", 60))

	// 警告提示
	if cfg.Enabled && cfg.APIKey == "" {
		fmt.Println("\n⚠️  警告：Gemini已启用但API Key为空！")
		fmt.Println("   请设置环境变量: export GEMINI_API_KEY=<your-key>")
	}

	if cfg.RolloutPercentage == 0 {
		fmt.Println("\n📊 灰度发布未启用 (rollout_percentage = 0%)")
	}
}

// GetGeminiConfigSummary 获取Gemini配置摘要（用于日志和监控）
func GetGeminiConfigSummary() map[string]interface{} {
	cfg := GetGlobalGeminiConfig()

	return map[string]interface{}{
		"enabled":                      cfg.Enabled,
		"api_url":                      cfg.APIURL,
		"api_version":                  cfg.APIVersion,
		"model":                        cfg.Model,
		"temperature":                  cfg.Temperature,
		"cache_enabled":                cfg.CacheEnabled,
		"circuit_breaker_enabled":      cfg.CircuitBreakerEnabled,
		"rollout_percentage":           cfg.RolloutPercentage,
		"auto_fallback_enabled":        cfg.AutoFallbackEnabled,
		"metrics_enabled":              cfg.MetricsEnabled,
		"loaded_at":                    cfg.LoadedAt,
	}
}
