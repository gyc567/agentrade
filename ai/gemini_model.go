package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"nofx/config"
	"sync"
	"time"
)

// GeminiModel Google Gemini AI模型的实现
type GeminiModel struct {
	config *config.GeminiConfig
	client *http.Client

	// 缓存机制 - 防止OOM
	cacheMu sync.RWMutex
	cache   map[string]string // key = hash(systemPrompt+userPrompt), value = response
	maxSize int               // 最大缓存条数

	// 监控指标
	metricsEnabled bool
	callCount      int64
	errorCount     int64
	cacheHitCount  int64
}

// GeminiRequest Gemini API请求体
type GeminiRequest struct {
	Contents            []GeminiContent       `json:"contents"`
	GenerationConfig    GeminiGenerationConfig `json:"generationConfig"`
	SystemInstructions  string                `json:"systemInstructions,omitempty"`
}

// GeminiContent Gemini内容块
type GeminiContent struct {
	Role  string        `json:"role"`
	Parts []GeminiPart  `json:"parts"`
}

// GeminiPart Gemini的文本部分
type GeminiPart struct {
	Text string `json:"text"`
}

// GeminiGenerationConfig Gemini的生成配置
type GeminiGenerationConfig struct {
	Temperature      float64 `json:"temperature"`
	MaxOutputTokens  int     `json:"maxOutputTokens"`
	TopP             float64 `json:"topP"`
	TopK             int     `json:"topK"`
	StopSequences    []string `json:"stopSequences,omitempty"`
}

// GeminiResponse Gemini API响应体
type GeminiResponse struct {
	Candidates []GeminiCandidate `json:"candidates"`
	UsageData  GeminiUsageData   `json:"usageMetadata"`
	Error      *GeminiAPIError   `json:"error,omitempty"`
}

// GeminiCandidate 候选响应
type GeminiCandidate struct {
	Content       GeminiContent       `json:"content"`
	FinishReason  string              `json:"finishReason"`
	SafetyRatings []GeminiSafetyRating `json:"safetyRatings,omitempty"`
}

// GeminiSafetyRating 安全评分
type GeminiSafetyRating struct {
	Category    string `json:"category"`
	Probability string `json:"probability"`
}

// GeminiUsageData 使用数据
type GeminiUsageData struct {
	PromptTokenCount     int `json:"promptTokenCount"`
	CandidatesTokenCount int `json:"candidatesTokenCount"`
	TotalTokenCount      int `json:"totalTokenCount"`
}

// GeminiAPIError Gemini API错误信息
type GeminiAPIError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Status  string `json:"status"`
}

// NewGeminiModel 创建Gemini模型实例
func NewGeminiModel(cfg *config.GeminiConfig) (*GeminiModel, error) {
	// 验证配置
	if cfg == nil {
		return nil, NewConfigError("GeminiConfig is nil")
	}

	if !cfg.Enabled {
		return nil, NewConfigError("Gemini is not enabled")
	}

	if cfg.APIKey == "" {
		return nil, NewConfigError("Gemini API key is empty")
	}

	if cfg.APIURL == "" {
		return nil, NewConfigError("Gemini API URL is empty")
	}

	if cfg.Model == "" {
		return nil, NewConfigError("Gemini model name is empty")
	}

	return &GeminiModel{
		config:         cfg,
		client:         createHTTPClient(time.Duration(cfg.TimeoutSeconds) * time.Second),
		cache:          make(map[string]string),
		maxSize:        100, // 最多缓存100条响应
		metricsEnabled: cfg.MetricsEnabled,
		callCount:      0,
		errorCount:     0,
		cacheHitCount:  0,
	}, nil
}

// CallAPI 实现AIModel接口 - 调用Gemini API
func (g *GeminiModel) CallAPI(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	// 生成缓存键
	cacheKey := hashPrompts(systemPrompt, userPrompt)

	// 检查缓存
	g.cacheMu.RLock()
	if cached, ok := g.cache[cacheKey]; ok {
		g.cacheHitCount++
		g.cacheMu.RUnlock()
		return cached, nil
	}
	g.cacheMu.RUnlock()

	// 构建请求
	req := g.buildRequest(systemPrompt, userPrompt)
	reqBytes, err := json.Marshal(req)
	if err != nil {
		g.recordError()
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// 调用API
	httpReq, err := http.NewRequestWithContext(ctx, "POST", g.buildAPIURL(), bytes.NewReader(reqBytes))
	if err != nil {
		g.recordError()
		return "", fmt.Errorf("failed to create HTTP request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-goog-api-key", g.config.APIKey)

	// 发送请求
	httpResp, err := g.client.Do(httpReq)
	if err != nil {
		g.recordError()

		// 根据错误类型返回可重试或不可重试的错误
		if ctx.Err() != nil {
			return "", NewTimeoutError(fmt.Sprintf("context error: %v", ctx.Err()))
		}

		return "", NewAPIError(fmt.Sprintf("HTTP request failed: %v", err), 0)
	}
	defer httpResp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(httpResp.Body)
	if err != nil {
		g.recordError()
		return "", NewAPIError(fmt.Sprintf("failed to read response body: %v", err), httpResp.StatusCode)
	}

	// 解析响应
	var resp GeminiResponse
	if err := json.Unmarshal(body, &resp); err != nil {
		g.recordError()
		return "", NewAPIError(fmt.Sprintf("failed to parse response: %v", err), httpResp.StatusCode)
	}

	// 检查API错误
	if resp.Error != nil {
		g.recordError()
		return "", NewAPIError(resp.Error.Message, resp.Error.Code)
	}

	// 检查HTTP错误
	if httpResp.StatusCode != http.StatusOK {
		g.recordError()
		return "", NewAPIError(fmt.Sprintf("API returned status %d", httpResp.StatusCode), httpResp.StatusCode)
	}

	// 提取响应文本
	if len(resp.Candidates) == 0 {
		g.recordError()
		return "", NewAPIError("no candidates in response", http.StatusOK)
	}

	candidate := resp.Candidates[0]
	if len(candidate.Content.Parts) == 0 {
		g.recordError()
		return "", NewAPIError("no parts in candidate", http.StatusOK)
	}

	response := candidate.Content.Parts[0].Text

	// 缓存结果
	g.cacheMu.Lock()
	defer g.cacheMu.Unlock()

	// LRU淘汰机制 - 防止缓存无限增长
	if len(g.cache) >= g.maxSize {
		// 删除第一个条目（实际项目应使用真正的LRU）
		for k := range g.cache {
			delete(g.cache, k)
			break
		}
	}

	g.cache[cacheKey] = response
	g.callCount++

	return response, nil
}

// GetModelInfo 实现AIModel接口 - 获取模型信息
func (g *GeminiModel) GetModelInfo() ModelInfo {
	return ModelInfo{
		Name:          g.config.Model,
		Provider:      "Google Gemini",
		Version:       g.config.APIVersion,
		MaxTokens:     g.config.MaxTokens,
		ContextWindow: 128000, // Gemini-3 的上下文窗口
		CostPerMTok:   0.00003, // 示例成本
		LoadedAt:      time.Now(),
	}
}

// Health 实现AIModel接口 - 健康检查
func (g *GeminiModel) Health(ctx context.Context) error {
	// 简单的健康检查 - 发送一个空请求
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req := g.buildRequest("", "health check")
	reqBytes, _ := json.Marshal(req)

	httpReq, _ := http.NewRequestWithContext(ctx, "POST", g.buildAPIURL(), bytes.NewReader(reqBytes))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("x-goog-api-key", g.config.APIKey)

	resp, err := g.client.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("health check failed with status %d", resp.StatusCode)
	}

	return nil
}

// 私有辅助方法

// buildAPIURL 构建API URL
func (g *GeminiModel) buildAPIURL() string {
	// Gemini API格式: {baseURL}/v1beta/models/{modelName}:generateContent
	return fmt.Sprintf("%s/%s/models/%s:generateContent",
		g.config.APIURL,
		g.config.APIVersion,
		g.config.Model,
	)
}

// buildRequest 构建Gemini API请求
func (g *GeminiModel) buildRequest(systemPrompt, userPrompt string) GeminiRequest {
	return GeminiRequest{
		Contents: []GeminiContent{
			{
				Role: "user",
				Parts: []GeminiPart{
					{
						Text: fmt.Sprintf("%s\n\n%s", systemPrompt, userPrompt),
					},
				},
			},
		},
		GenerationConfig: GeminiGenerationConfig{
			Temperature:     g.config.Temperature,
			MaxOutputTokens: g.config.MaxTokens,
			TopP:            g.config.TopP,
			TopK:            g.config.TopK,
		},
	}
}

// recordError 记录错误
func (g *GeminiModel) recordError() {
	if g.metricsEnabled {
		g.errorCount++
	}
}

// GetMetrics 获取性能指标
func (g *GeminiModel) GetMetrics() map[string]interface{} {
	return map[string]interface{}{
		"call_count":      g.callCount,
		"error_count":     g.errorCount,
		"cache_hit_count": g.cacheHitCount,
		"cache_size":      len(g.cache),
		"model":           g.config.Model,
	}
}

// ClearCache 清空缓存
func (g *GeminiModel) ClearCache() {
	g.cacheMu.Lock()
	defer g.cacheMu.Unlock()
	g.cache = make(map[string]string)
}

// createHTTPClient 创建HTTP客户端
func createHTTPClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout: timeout,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     30 * time.Second,
		},
	}
}

// hashPrompts 哈希提示词用于缓存键
// 注：实际生产中应使用更强的哈希函数（SHA256）
func hashPrompts(systemPrompt, userPrompt string) string {
	return fmt.Sprintf("%d", hashString(systemPrompt+"|"+userPrompt))
}

// hashString 简单的哈希函数
func hashString(s string) int32 {
	h := int32(0)
	for _, ch := range s {
		h = h*31 + int32(ch)
	}
	return h
}
