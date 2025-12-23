package mem0

import (
	"strings"
	"context"
	"log"
	"sort"
	"sync"
	"time"
)

// GlobalKnowledgeBase P0修复#3: 冷启动解决
// 作用: 为新交易者提供全局高质量参考案例
// 防止: 冷启动无历史记忆导致AI决策困难
// 策略: 维护全局记忆库 > 按交易类型和质量分 > 缓存热点数据
type GlobalKnowledgeBase struct {
	store               MemoryStore
	qualityThreshold    float64      // 最小质量分 (0.8+)
	referenceMemories   []Memory     // 缓存的参考案例
	updateInterval      time.Duration
	mu                  sync.RWMutex
	metrics             *KBMetrics
	lastSyncAt          *time.Time
	typeIndexes         map[string][]Memory // 按类型索引
}

// KBMetrics 知识库指标
type KBMetrics struct {
	TotalReferences    int64
	ByType             map[string]int64
	QualityDistribution map[string]int64 // "excellent"(>0.9) / "good"(0.8-0.9) / "fair"
	LastSyncAt         *time.Time
	SyncErrors         int64
	CacheHitRate       float64
	mu                 sync.RWMutex
}

// ReferenceCase 参考案例
type ReferenceCase struct {
	Memory          Memory
	TradeType       string  // "long" / "short" / "scalping" / "swing"
	MarketCondition string  // "bull" / "bear" / "ranging"
	Score           float64 // 综合评分
	UsageCount      int64   // 使用次数
	LastUsedAt      *time.Time
}

// NewGlobalKnowledgeBase 创建全局知识库
func NewGlobalKnowledgeBase(store MemoryStore) *GlobalKnowledgeBase {
	return &GlobalKnowledgeBase{
		store:            store,
		qualityThreshold: 0.8,  // 只保存>=0.8的高质量记忆
		updateInterval:   30 * time.Minute,
		referenceMemories: make([]Memory, 0),
		typeIndexes:      make(map[string][]Memory),
		metrics: &KBMetrics{
			ByType:              make(map[string]int64),
			QualityDistribution: make(map[string]int64),
		},
	}
}

// Initialize 初始化知识库(从Mem0加载高质量记忆)
func (kb *GlobalKnowledgeBase) Initialize(ctx context.Context) error {
	log.Println("🔄 初始化GlobalKnowledgeBase...")

	// Step 1: 查询所有高质量记忆(score >= 0.8)
	query := Query{
		Type: "graph_query",
		Filters: []QueryFilter{
			{Field: "quality_score", Operator: "gte", Value: kb.qualityThreshold},
			{Field: "status", Operator: "eq", Value: "evaluated"},
		},
		Limit: 10000,
	}

	memories, err := kb.store.Search(ctx, query)
	if err != nil {
		log.Printf("❌ 初始化失败: %v", err)
		kb.metrics.mu.Lock()
		kb.metrics.SyncErrors++
		kb.metrics.mu.Unlock()
		return err
	}

	// Step 2: 按类型索引
	kb.mu.Lock()
	kb.referenceMemories = memories
	kb.buildTypeIndexes()

	now := time.Now()
	kb.lastSyncAt = &now

	kb.mu.Unlock()

	// Step 3: 更新指标
	kb.updateMetrics(memories)

	log.Printf("✅ 知识库初始化完成: %d条高质量参考 (quality >= %.1f)",
		len(memories), kb.qualityThreshold)

	// Step 4: 启动定期同步
	go kb.syncLoop(ctx)

	return nil
}

// buildTypeIndexes 按类型构建索引
func (kb *GlobalKnowledgeBase) buildTypeIndexes() {
	kb.typeIndexes = make(map[string][]Memory)

	for _, m := range kb.referenceMemories {
		memType := m.Type
		if memType == "" {
			memType = "unknown"
		}

		kb.typeIndexes[memType] = append(kb.typeIndexes[memType], m)
	}

	log.Printf("  📑 类型索引: %d个类别", len(kb.typeIndexes))
	for memType, memories := range kb.typeIndexes {
		log.Printf("     • %s: %d条", memType, len(memories))
	}
}

// updateMetrics 更新指标
func (kb *GlobalKnowledgeBase) updateMetrics(memories []Memory) {
	kb.metrics.mu.Lock()
	defer kb.metrics.mu.Unlock()

	kb.metrics.TotalReferences = int64(len(memories))
	kb.metrics.ByType = make(map[string]int64)
	kb.metrics.QualityDistribution = make(map[string]int64)

	for _, m := range memories {
		// 按类型统计
		kb.metrics.ByType[m.Type]++

		// 按质量分布统计
		if m.QualityScore >= 0.9 {
			kb.metrics.QualityDistribution["excellent"]++
		} else if m.QualityScore >= 0.8 {
			kb.metrics.QualityDistribution["good"]++
		} else {
			kb.metrics.QualityDistribution["fair"]++
		}
	}

	now := time.Now()
	kb.metrics.LastSyncAt = &now
}

// GetReferencesForType 获取特定类型的参考案例
func (kb *GlobalKnowledgeBase) GetReferencesForType(tradeType string, limit int) []Memory {
	kb.mu.RLock()
	memories, exists := kb.typeIndexes[tradeType]
	kb.mu.RUnlock()

	if !exists {
		log.Printf("⚠️ 未找到%s类型的参考案例", tradeType)
		// 降级: 返回全局最高质量的记忆
		return kb.getTopQualityReferences(limit)
	}

	if limit > len(memories) {
		limit = len(memories)
	}

	// 返回前N条(按质量排序)
	result := make([]Memory, limit)
	for i := 0; i < limit; i++ {
		result[i] = memories[i]
	}

	log.Printf("✅ 返回%s参考案例: %d条", tradeType, limit)
	return result
}

// getTopQualityReferences 获取全局最高质量的记忆
func (kb *GlobalKnowledgeBase) getTopQualityReferences(limit int) []Memory {
	kb.mu.RLock()
	defer kb.mu.RUnlock()

	if len(kb.referenceMemories) == 0 {
		log.Printf("⚠️ 知识库为空")
		return []Memory{}
	}

	// 复制并排序
	sorted := make([]Memory, len(kb.referenceMemories))
	copy(sorted, kb.referenceMemories)

	// ✅ 修复: 使用sort.Slice O(n log n) 替代冒泡排序 O(n²)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i].QualityScore > sorted[j].QualityScore // 降序排列
	})

	if limit > len(sorted) {
		limit = len(sorted)
	}

	log.Printf("📊 知识库排序: %d条记忆, 返回前%d条最高质量", len(sorted), limit)

	return sorted[:limit]
}

// GetReferencesForColdStart 冷启动: 为新用户返回最佳参考
func (kb *GlobalKnowledgeBase) GetReferencesForColdStart(limit int) []Memory {
	kb.mu.RLock()
	defer kb.mu.RUnlock()

	if len(kb.referenceMemories) == 0 {
		log.Printf("⚠️ 冷启动: 知识库为空, 无参考案例")
		return []Memory{}
	}

	// 冷启动策略: 返回最高质量的记忆
	// 这些记忆应该是最通用和最成功的
	log.Printf("🆕 冷启动模式: 加载全局最优参考案例")

	if limit > 5 {
		limit = 5
	}

	return kb.getTopQualityReferences(limit)
}

// SearchSimilarInKB 在知识库中搜索相似案例
func (kb *GlobalKnowledgeBase) SearchSimilarInKB(context map[string]interface{}, limit int) []Memory {
	kb.mu.RLock()
	defer kb.mu.RUnlock()

	// 简单实现: 返回相同类型的参考案例
	tradeType, ok := context["trade_type"].(string)
	if !ok {
		tradeType = "unknown"
	}

	memories, exists := kb.typeIndexes[tradeType]
	if !exists || len(memories) == 0 {
		// 降级到全局最优
		return kb.getTopQualityReferences(limit)
	}

	if limit > len(memories) {
		limit = len(memories)
	}

	return memories[:limit]
}

// syncLoop 定期同步知识库
func (kb *GlobalKnowledgeBase) syncLoop(ctx context.Context) {
	ticker := time.NewTicker(kb.updateInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Println("🛑 知识库同步已停止")
			return
		case <-ticker.C:
			if err := kb.Initialize(ctx); err != nil {
				log.Printf("⚠️ 知识库同步失败: %v", err)
			}
		}
	}
}

// GetStats 获取知识库统计
func (kb *GlobalKnowledgeBase) GetStats() map[string]interface{} {
	kb.metrics.mu.RLock()
	defer kb.metrics.mu.RUnlock()

	return map[string]interface{}{
		"total_references":  kb.metrics.TotalReferences,
		"by_type":           kb.metrics.ByType,
		"quality_distribution": kb.metrics.QualityDistribution,
		"last_sync":         kb.metrics.LastSyncAt,
		"sync_errors":       kb.metrics.SyncErrors,
	}
}

// PrintStats 打印统计信息
func (kb *GlobalKnowledgeBase) PrintStats() {
	stats := kb.GetStats()

	log.Println("\n📚 全局知识库统计:")
	log.Println(strings.Repeat("═", 60))
	log.Printf("  总参考案例: %d条\n", stats["total_references"])

	byType := stats["by_type"].(map[string]int64)
	if len(byType) > 0 {
		log.Println("  按类型分布:")
		for memType, count := range byType {
			log.Printf("    • %s: %d条\n", memType, count)
		}
	}

	qualityDist := stats["quality_distribution"].(map[string]int64)
	if len(qualityDist) > 0 {
		log.Println("  按质量分布:")
		log.Printf("    • 优秀(>0.9): %d条\n", qualityDist["excellent"])
		log.Printf("    • 良好(0.8-0.9): %d条\n", qualityDist["good"])
		log.Printf("    • 一般(<0.8): %d条\n", qualityDist["fair"])
	}

	if lastSync, ok := stats["last_sync"].(*time.Time); ok && lastSync != nil {
		log.Printf("  最后同步: %s\n", lastSync.Format("2006-01-02 15:04:05"))
	}

	log.Printf("  同步错误: %d次\n", stats["sync_errors"])
	log.Println(strings.Repeat("═", 60))
}

// ColdStartFallback 冷启动降级方案
type ColdStartFallback struct {
	DefaultMemories []Memory // 硬编码的默认参考案例
	KB              *GlobalKnowledgeBase
}

// NewColdStartFallback 创建冷启动降级方案
func NewColdStartFallback(kb *GlobalKnowledgeBase) *ColdStartFallback {
	return &ColdStartFallback{
		KB: kb,
		DefaultMemories: []Memory{
			{
				ID:      "default_1",
				Content: "基于Kelly准则的稳健交易: 25%头寸规模,严格止损",
				Type:    "decision",
				QualityScore: 0.92,
				Metadata: map[string]interface{}{
					"kelly_fraction":  0.25,
					"stop_loss":       0.05,
					"risk_reward":     2.0,
					"success_rate":    0.88,
				},
			},
			{
				ID:      "default_2",
				Content: "趋势跟踪策略: 顺势而为,利用支撑压力位",
				Type:    "decision",
				QualityScore: 0.88,
				Metadata: map[string]interface{}{
					"strategy": "trend_following",
					"timeframe": "4h",
				},
			},
		},
	}
}

// GetFallbackReferences 获取降级参考
func (csf *ColdStartFallback) GetFallbackReferences() []Memory {
	// 首先尝试从知识库获取
	references := csf.KB.GetReferencesForColdStart(3)

	// 如果知识库无数据,使用默认参考
	if len(references) == 0 {
		log.Printf("⚠️ 知识库为空,使用默认参考案例 (%d条)", len(csf.DefaultMemories))
		references = csf.DefaultMemories
	}

	return references
}
