package ai

import (
	"context"
	"fmt"
	"time"
)

// AIModel 统一的AI模型接口
// 所有AI模型提供商（Gemini、GPT-4、DeepSeek等）都必须实现此接口
// 这样可以在运行时动态切换模型，符合Strategy设计模式
type AIModel interface {
	// CallAPI 调用AI模型生成响应
	// systemPrompt: 系统级指令（决定模型行为的核心提示）
	// userPrompt: 用户输入（具体的查询或决策上下文）
	// 返回值: 模型的响应文本，或错误信息
	CallAPI(ctx context.Context, systemPrompt, userPrompt string) (string, error)

	// GetModelInfo 获取模型的元信息
	// 用于日志、监控、调试，以及在故障转移时选择备用模型
	GetModelInfo() ModelInfo

	// Health 健康检查
	// 用于断路器检测、监控系统状态、决定是否降级
	Health(ctx context.Context) error
}

// ModelInfo 模型的元信息
type ModelInfo struct {
	Name          string    // 模型名称，如"gemini-3-flash-preview"
	Provider      string    // 提供商名称，如"Google Gemini"、"OpenAI"、"DeepSeek"
	Version       string    // API版本，如"v1beta"、"v1"
	MaxTokens     int       // 单次调用的最大输出token数
	ContextWindow int       // 上下文窗口大小（输入+输出）
	CostPerMTok   float64   // 成本（美元/百万token）
	LoadedAt      time.Time // 模型加载时间
}

// CallAPIResponse 标准化的API响应
// 便于在不同模型之间进行统一的结果处理
type CallAPIResponse struct {
	Content     string
	TokensUsed  int
	LatencyMS   int
	CacheHit    bool
	ErrorRate   float64  // 错误率（用于断路器决策）
	RetryCount  int      // 重试次数
	Timestamp   time.Time
}

// HealthStatus 健康检查的状态枚举
type HealthStatus string

const (
	HealthHealthy   HealthStatus = "healthy"
	HealthDegraded  HealthStatus = "degraded"
	HealthUnhealthy HealthStatus = "unhealthy"
)

// HealthCheckResult 健康检查的详细结果
type HealthCheckResult struct {
	Status      HealthStatus
	Message     string
	LatencyMS   int
	LastChecked time.Time
	Details     map[string]interface{}
}

// ModelError 模型调用时的标准错误类型
type ModelError struct {
	Code       string // 错误代码，如"TIMEOUT"、"API_ERROR"、"RATE_LIMIT"
	Message    string // 人类可读的错误信息
	Retryable  bool   // 是否可重试
	StatusCode int    // HTTP状态码（如果适用）
}

func (e *ModelError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// 标准错误码
const (
	ErrorCodeTimeout    = "TIMEOUT"
	ErrorCodeAPIError   = "API_ERROR"
	ErrorCodeRateLimit  = "RATE_LIMIT"
	ErrorCodeBadConfig  = "BAD_CONFIG"
	ErrorCodeUnknown    = "UNKNOWN"
)

// NewModelError 创建一个新的模型错误
func NewModelError(code, message string, retryable bool) *ModelError {
	return &ModelError{
		Code:      code,
		Message:   message,
		Retryable: retryable,
	}
}

// NewTimeoutError 创建超时错误
func NewTimeoutError(message string) *ModelError {
	return &ModelError{
		Code:      ErrorCodeTimeout,
		Message:   message,
		Retryable: true,
		StatusCode: 408,
	}
}

// NewAPIError 创建API错误
func NewAPIError(message string, statusCode int) *ModelError {
	retryable := statusCode >= 500 || statusCode == 429 // 服务器错误或限流可重试
	return &ModelError{
		Code:       ErrorCodeAPIError,
		Message:    message,
		Retryable:  retryable,
		StatusCode: statusCode,
	}
}

// NewConfigError 创建配置错误
func NewConfigError(message string) *ModelError {
	return &ModelError{
		Code:      ErrorCodeBadConfig,
		Message:   message,
		Retryable: false,
	}
}
