package mem0

import (
	"context"
	"time"
)

// QueryFilter 查询过滤条件
type QueryFilter struct {
	Field    string      // 字段名
	Operator string      // 操作符: "eq", "gt", "lt", "in", "contains"
	Value    interface{} // 值
}

// Query 统一查询结构
type Query struct {
	Type       string        // 查询类型: "semantic_search", "graph_query", "direct_lookup"
	Context    map[string]interface{} // 查询上下文
	Filters    []QueryFilter // 过滤条件
	Limit      int           // 返回记录数上限
	Similarity float64       // 最小相似度(0.0-1.0)
	Offset     int           // 偏移量
}

// Relationship 记忆之间的关系
type Relationship struct {
	Type   string  // 关系类型: "causes", "caused_by", "similar_to", "contradicts"
	Target string  // 目标Memory ID
	Weight float64 // 关系强度(0.0-1.0)
}

// Memory 记忆对象
type Memory struct {
	ID             string
	Content        string
	Type           string // "decision", "outcome", "reflection", "pattern"
	Similarity     float64
	Relationships  []Relationship
	Metadata       map[string]interface{}
	QualityScore   float64
	CreatedAt      time.Time
	UpdatedAt      time.Time
	Status         string // "generated", "applied", "evaluated"
	ReflectionID   *string // 关联的反思ID
}

// SaveOptions 保存选项
type SaveOptions struct {
	Async    bool          // 异步保存
	Timeout  time.Duration // 操作超时
	Priority int           // 优先级(1-10)
}

// MemoryStore 统一的记忆存储接口
type MemoryStore interface {
	// 基础操作
	Search(ctx context.Context, query Query) ([]Memory, error)
	Save(ctx context.Context, memory Memory, opts *SaveOptions) (string, error)
	Delete(ctx context.Context, id string) error
	GetByID(ctx context.Context, id string) (*Memory, error)
	UpdateStatus(ctx context.Context, id string, status string) error

	// 批量操作
	SaveBatch(ctx context.Context, memories []Memory, opts *SaveOptions) ([]string, error)
	GetByIDs(ctx context.Context, ids []string) ([]Memory, error)

	// 高级查询
	SearchByType(ctx context.Context, memType string, limit int) ([]Memory, error)
	GetRelationships(ctx context.Context, id string) ([]Relationship, error)
	SearchSimilar(ctx context.Context, id string, limit int) ([]Memory, error)

	// 统计和管理
	GetStats(ctx context.Context) (*MemoryStats, error)
	DeleteByType(ctx context.Context, memType string) error
	DeleteLowQuality(ctx context.Context, threshold float64) (int64, error)

	// 健康检查
	Health(ctx context.Context) error
	Close() error
}

// MemoryStats 记忆统计信息
type MemoryStats struct {
	TotalMemories        int64
	ByType               map[string]int64
	AverageQualityScore  float64
	OldestMemory         *time.Time
	NewestMemory         *time.Time
	TotalRelationships   int64
	LastUpdateTime       time.Time
}

// SaveResult 保存结果
type SaveResult struct {
	ID        string
	Success   bool
	Error     error
	Timestamp time.Time
}

// SearchResult 查询结果
type SearchResult struct {
	Memories  []Memory
	Total     int
	Timestamp time.Time
	Duration  time.Duration
}
