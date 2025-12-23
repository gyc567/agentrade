package mem0

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
)

// HTTPStore Mem0的HTTP客户端实现
type HTTPStore struct {
	endpoint   string
	apiKey     string
	userID     string
	orgID      string
	httpClient *http.Client
	mu         sync.RWMutex
	requestID  uint64
}

// NewHTTPStore 创建HTTP客户端
func NewHTTPStore(endpoint, apiKey, userID, orgID string) *HTTPStore {
	return &HTTPStore{
		endpoint: endpoint,
		apiKey:   apiKey,
		userID:   userID,
		orgID:    orgID,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
}

// Search 搜索记忆
func (h *HTTPStore) Search(ctx context.Context, query Query) ([]Memory, error) {
	return h.search(ctx, query)
}

// search 内部搜索实现
func (h *HTTPStore) search(ctx context.Context, query Query) ([]Memory, error) {
	startTime := time.Now()

	// 构建请求体
	reqBody := map[string]interface{}{
		"type":       query.Type,
		"context":    query.Context,
		"filters":    query.Filters,
		"limit":      query.Limit,
		"similarity": query.Similarity,
		"user_id":    h.userID,
		"org_id":     h.orgID,
	}

	reqBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("❌ 编码请求失败: %w", err)
	}

	// 发送请求
	req, err := http.NewRequestWithContext(ctx, "POST", h.endpoint+"/memories/search", bytes.NewReader(reqBytes))
	if err != nil {
		return nil, fmt.Errorf("❌ 创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("❌ 请求Mem0失败: %w", err)
	}
	defer resp.Body.Close()

	// 解析响应
	var result struct {
		Data      []Memory `json:"data"`
		Error     string   `json:"error"`
		Status    int      `json:"status"`
		Timestamp string   `json:"timestamp"`
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("❌ 读取响应失败: %w", err)
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("❌ 解析响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("❌ Mem0 API错误 (%d): %s", resp.StatusCode, result.Error)
	}

	duration := time.Since(startTime)
	log.Printf("✅ Mem0查询成功 (耗时: %.0fms, 结果: %d条)", duration.Seconds()*1000, len(result.Data))

	return result.Data, nil
}

// Save 保存记忆
func (h *HTTPStore) Save(ctx context.Context, memory Memory, opts *SaveOptions) (string, error) {
	startTime := time.Now()

	// 构建请求体
	reqBody := map[string]interface{}{
		"id":           memory.ID,
		"content":      memory.Content,
		"type":         memory.Type,
		"metadata":     memory.Metadata,
		"status":       memory.Status,
		"user_id":      h.userID,
		"org_id":       h.orgID,
		"quality_score": memory.QualityScore,
	}

	if memory.ReflectionID != nil {
		reqBody["reflection_id"] = *memory.ReflectionID
	}

	reqBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("❌ 编码请求失败: %w", err)
	}

	// 发送请求
	req, err := http.NewRequestWithContext(ctx, "POST", h.endpoint+"/memories", bytes.NewReader(reqBytes))
	if err != nil {
		return "", fmt.Errorf("❌ 创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("❌ 请求Mem0失败: %w", err)
	}
	defer resp.Body.Close()

	// 解析响应
	var result struct {
		ID    string `json:"id"`
		Error string `json:"error"`
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("❌ 读取响应失败: %w", err)
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("❌ 解析响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("❌ Mem0 API错误 (%d): %s", resp.StatusCode, result.Error)
	}

	duration := time.Since(startTime)
	log.Printf("✅ 记忆保存成功 (ID: %s, 耗时: %.0fms)", result.ID, duration.Seconds()*1000)

	return result.ID, nil
}

// Delete 删除记忆
func (h *HTTPStore) Delete(ctx context.Context, id string) error {
	req, err := http.NewRequestWithContext(ctx, "DELETE", h.endpoint+"/memories/"+id, nil)
	if err != nil {
		return fmt.Errorf("❌ 创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.apiKey)

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("❌ 请求Mem0失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("❌ Mem0 API错误 (%d)", resp.StatusCode)
	}

	return nil
}

// GetByID 按ID获取记忆
func (h *HTTPStore) GetByID(ctx context.Context, id string) (*Memory, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", h.endpoint+"/memories/"+id, nil)
	if err != nil {
		return nil, fmt.Errorf("❌ 创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.apiKey)

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("❌ 请求Mem0失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("❌ 记忆不存在: %s", id)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("❌ Mem0 API错误 (%d)", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("❌ 读取响应失败: %w", err)
	}

	var memory Memory
	if err := json.Unmarshal(body, &memory); err != nil {
		return nil, fmt.Errorf("❌ 解析响应失败: %w", err)
	}

	return &memory, nil
}

// UpdateStatus 更新记忆状态
func (h *HTTPStore) UpdateStatus(ctx context.Context, id string, status string) error {
	reqBody := map[string]string{"status": status}
	reqBytes, _ := json.Marshal(reqBody)

	req, err := http.NewRequestWithContext(ctx, "PATCH", h.endpoint+"/memories/"+id, bytes.NewReader(reqBytes))
	if err != nil {
		return fmt.Errorf("❌ 创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("❌ 请求Mem0失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("❌ Mem0 API错误 (%d)", resp.StatusCode)
	}

	return nil
}

// SaveBatch 批量保存记忆
func (h *HTTPStore) SaveBatch(ctx context.Context, memories []Memory, opts *SaveOptions) ([]string, error) {
	var ids []string
	for _, memory := range memories {
		id, err := h.Save(ctx, memory, opts)
		if err != nil {
			log.Printf("⚠️ 保存记忆失败 (%s): %v", memory.ID, err)
			continue
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// GetByIDs 批量获取记忆
func (h *HTTPStore) GetByIDs(ctx context.Context, ids []string) ([]Memory, error) {
	var memories []Memory
	for _, id := range ids {
		memory, err := h.GetByID(ctx, id)
		if err != nil {
			log.Printf("⚠️ 获取记忆失败 (%s): %v", id, err)
			continue
		}
		if memory != nil {
			memories = append(memories, *memory)
		}
	}
	return memories, nil
}

// SearchByType 按类型搜索记忆
func (h *HTTPStore) SearchByType(ctx context.Context, memType string, limit int) ([]Memory, error) {
	query := Query{
		Type: "direct_lookup",
		Filters: []QueryFilter{
			{Field: "type", Operator: "eq", Value: memType},
		},
		Limit: limit,
	}
	return h.Search(ctx, query)
}

// GetRelationships 获取记忆关系
func (h *HTTPStore) GetRelationships(ctx context.Context, id string) ([]Relationship, error) {
	memory, err := h.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if memory == nil {
		return nil, fmt.Errorf("❌ 记忆不存在: %s", id)
	}
	return memory.Relationships, nil
}

// SearchSimilar 搜索相似记忆
func (h *HTTPStore) SearchSimilar(ctx context.Context, id string, limit int) ([]Memory, error) {
	memory, err := h.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if memory == nil {
		return nil, fmt.Errorf("❌ 记忆不存在: %s", id)
	}

	query := Query{
		Type:       "semantic_search",
		Context:    memory.Metadata,
		Limit:      limit,
		Similarity: 0.7,
	}
	return h.Search(ctx, query)
}

// GetStats 获取统计信息
func (h *HTTPStore) GetStats(ctx context.Context) (*MemoryStats, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", h.endpoint+"/memories/stats", nil)
	if err != nil {
		return nil, fmt.Errorf("❌ 创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.apiKey)

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("❌ 请求Mem0失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("❌ Mem0 API错误 (%d)", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("❌ 读取响应失败: %w", err)
	}

	var stats MemoryStats
	if err := json.Unmarshal(body, &stats); err != nil {
		return nil, fmt.Errorf("❌ 解析响应失败: %w", err)
	}

	return &stats, nil
}

// DeleteByType 按类型删除记忆
func (h *HTTPStore) DeleteByType(ctx context.Context, memType string) error {
	memories, err := h.SearchByType(ctx, memType, 1000)
	if err != nil {
		return err
	}

	for _, memory := range memories {
		if err := h.Delete(ctx, memory.ID); err != nil {
			log.Printf("⚠️ 删除记忆失败 (%s): %v", memory.ID, err)
		}
	}

	return nil
}

// DeleteLowQuality 删除低质量记忆
func (h *HTTPStore) DeleteLowQuality(ctx context.Context, threshold float64) (int64, error) {
	query := Query{
		Type: "graph_query",
		Filters: []QueryFilter{
			{Field: "quality_score", Operator: "lt", Value: threshold},
		},
		Limit: 10000,
	}

	memories, err := h.Search(ctx, query)
	if err != nil {
		return 0, err
	}

	var deleted int64
	for _, memory := range memories {
		if err := h.Delete(ctx, memory.ID); err != nil {
			log.Printf("⚠️ 删除记忆失败 (%s): %v", memory.ID, err)
		} else {
			deleted++
		}
	}

	log.Printf("✅ 删除低质量记忆完成: %d条", deleted)
	return deleted, nil
}

// Health 健康检查
func (h *HTTPStore) Health(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "GET", h.endpoint+"/health", nil)
	if err != nil {
		return fmt.Errorf("❌ 创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+h.apiKey)

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("❌ 请求Mem0失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("❌ Mem0服务不健康 (%d)", resp.StatusCode)
	}

	log.Println("✅ Mem0服务健康检查通过")
	return nil
}

// Close 关闭客户端
func (h *HTTPStore) Close() error {
	h.httpClient.CloseIdleConnections()
	return nil
}
