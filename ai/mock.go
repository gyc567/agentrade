package ai

import (
	"context"
	"time"
)

// MockAIModel 用于测试的AI模型mock实现
// 可以配置响应、错误、延迟等，用于单元测试
type MockAIModel struct {
	// 配置
	ResponseOverride string
	ErrorOverride    error
	LatencyMS        int
	HealthyOverride  bool

	// 跟踪调用
	CallCount        int
	LastCallContext  context.Context
	LastSystemPrompt string
	LastUserPrompt   string
	CallHistory      []MockCallRecord
}

// MockCallRecord 记录每次API调用
type MockCallRecord struct {
	Timestamp     time.Time
	SystemPrompt  string
	UserPrompt    string
	Response      string
	Error         error
	LatencyMS     int
	CacheHit      bool
}

// NewMockAIModel 创建一个新的mock模型
func NewMockAIModel() *MockAIModel {
	return &MockAIModel{
		ResponseOverride: `{"decisions":[],"cot_trace":"mock response"}`,
		ErrorOverride:    nil,
		LatencyMS:        100,
		HealthyOverride:  true,
		CallCount:        0,
		CallHistory:      make([]MockCallRecord, 0),
	}
}

// CallAPI 实现AIModel接口 - 调用API
func (m *MockAIModel) CallAPI(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	// 模拟延迟
	if m.LatencyMS > 0 {
		select {
		case <-time.After(time.Duration(m.LatencyMS) * time.Millisecond):
		case <-ctx.Done():
			return "", ctx.Err()
		}
	}

	m.CallCount++
	m.LastCallContext = ctx
	m.LastSystemPrompt = systemPrompt
	m.LastUserPrompt = userPrompt

	record := MockCallRecord{
		Timestamp:    time.Now(),
		SystemPrompt: systemPrompt,
		UserPrompt:   userPrompt,
		LatencyMS:    m.LatencyMS,
		CacheHit:     false,
	}

	// 如果设置了错误，返回错误
	if m.ErrorOverride != nil {
		record.Error = m.ErrorOverride
		m.CallHistory = append(m.CallHistory, record)
		return "", m.ErrorOverride
	}

	// 返回覆盖的响应或默认响应
	response := m.ResponseOverride
	if response == "" {
		response = `{"decisions":[]}`
	}

	record.Response = response
	m.CallHistory = append(m.CallHistory, record)
	return response, nil
}

// GetModelInfo 实现AIModel接口 - 获取模型信息
func (m *MockAIModel) GetModelInfo() ModelInfo {
	return ModelInfo{
		Name:          "mock-model",
		Provider:      "Mock Provider",
		Version:       "1.0",
		MaxTokens:     2000,
		ContextWindow: 8000,
		CostPerMTok:   0.0,
		LoadedAt:      time.Now(),
	}
}

// Health 实现AIModel接口 - 健康检查
func (m *MockAIModel) Health(ctx context.Context) error {
	if !m.HealthyOverride {
		return NewAPIError("mock unhealthy", 503)
	}
	return nil
}

// Reset 重置mock状态（用于测试之间的清理）
func (m *MockAIModel) Reset() {
	m.CallCount = 0
	m.CallHistory = make([]MockCallRecord, 0)
	m.ErrorOverride = nil
	m.LastSystemPrompt = ""
	m.LastUserPrompt = ""
}

// SetError 设置模型返回错误
func (m *MockAIModel) SetError(err error) *MockAIModel {
	m.ErrorOverride = err
	return m
}

// SetResponse 设置模型返回响应
func (m *MockAIModel) SetResponse(response string) *MockAIModel {
	m.ResponseOverride = response
	return m
}

// SetLatency 设置模拟延迟（毫秒）
func (m *MockAIModel) SetLatency(ms int) *MockAIModel {
	m.LatencyMS = ms
	return m
}

// SetHealthy 设置模型健康状态
func (m *MockAIModel) SetHealthy(healthy bool) *MockAIModel {
	m.HealthyOverride = healthy
	return m
}

// GetLastCall 获取最后一次调用的记录
func (m *MockAIModel) GetLastCall() *MockCallRecord {
	if len(m.CallHistory) == 0 {
		return nil
	}
	return &m.CallHistory[len(m.CallHistory)-1]
}

// GetCallsBySystemPrompt 获取与系统提示匹配的所有调用
func (m *MockAIModel) GetCallsBySystemPrompt(prompt string) []MockCallRecord {
	var results []MockCallRecord
	for _, record := range m.CallHistory {
		if record.SystemPrompt == prompt {
			results = append(results, record)
		}
	}
	return results
}

// AssertCallCount 用于测试 - 断言调用次数
func (m *MockAIModel) AssertCallCount(expected int) bool {
	return m.CallCount == expected
}

// AssertLastCall 用于测试 - 断言最后一次调用的参数
func (m *MockAIModel) AssertLastCall(expectedSystem, expectedUser string) bool {
	return m.LastSystemPrompt == expectedSystem && m.LastUserPrompt == expectedUser
}
