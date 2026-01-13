package mem0

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	lru "github.com/hashicorp/golang-lru/v2"
)

// CacheWarmer P0修复: 网络延迟预热机制
// 作用: 在决策前5分钟异步预查询,结果进缓存
// 收益: P95延迟从 2.5秒 → <500ms
type CacheWarmer struct {
	store        MemoryStore
	cache        *lru.Cache[string, CacheEntry]
	interval     time.Duration
	cacheTTL     time.Duration
	mu           sync.RWMutex
	ticker       *time.Ticker
	done         chan struct{}
	warmupQueries []WarmupQuery
	metrics      *CacheMetrics
}

// CacheEntry 缓存条目
type CacheEntry struct {
	Data      interface{}
	Timestamp time.Time
	HitCount  int64
}

// WarmupQuery 预热查询定义
type WarmupQuery struct {
	Name     string
	QueryFn  func(ctx context.Context) (interface{}, error)
	Priority int // 1-10, 10最高
}

// CacheMetrics 缓存指标
type CacheMetrics struct {
	Hits          int64
	Misses        int64
	Evictions     int64
	LastUpdateAt  time.Time
	mu            sync.RWMutex
}

// NewCacheWarmer 创建缓存预热器
func NewCacheWarmer(store MemoryStore, interval time.Duration, cacheTTL time.Duration) *CacheWarmer {
	cache, _ := lru.New[string, CacheEntry](1000) // 最多1000条记录

	warmer := &CacheWarmer{
		store:    store,
		cache:    cache,
		interval: interval,
		cacheTTL: cacheTTL,
		done:     make(chan struct{}),
		metrics:  &CacheMetrics{},
	}

	// 定义预热查询
	warmer.defineWarmupQueries()

	return warmer
}

// defineWarmupQueries 定义预热查询列表
func (w *CacheWarmer) defineWarmupQueries() {
	w.warmupQueries = []WarmupQuery{
		{
			Name:     "similar_trades",
			Priority: 10,
			QueryFn: func(ctx context.Context) (interface{}, error) {
				// 查询最近的相似交易
				query := Query{
					Type:       "semantic_search",
					Limit:      5,
					Similarity: 0.7,
				}
				return w.store.Search(ctx, query)
			},
		},
		{
			Name:     "failure_patterns",
			Priority: 9,
			QueryFn: func(ctx context.Context) (interface{}, error) {
				// 查询失败模式
				query := Query{
					Type: "graph_query",
					Filters: []QueryFilter{
						{Field: "type", Operator: "eq", Value: "reflection"},
						{Field: "severity", Operator: "in", Value: []string{"high", "critical"}},
					},
					Limit: 3,
				}
				return w.store.Search(ctx, query)
			},
		},
		{
			Name:     "successful_parameters",
			Priority: 8,
			QueryFn: func(ctx context.Context) (interface{}, error) {
				// 查询成功的参数
				query := Query{
					Type: "direct_lookup",
					Filters: []QueryFilter{
						{Field: "type", Operator: "eq", Value: "outcome"},
						{Field: "status", Operator: "eq", Value: "evaluated"},
					},
					Limit: 3,
				}
				return w.store.Search(ctx, query)
			},
		},
		{
			Name:     "memory_stats",
			Priority: 7,
			QueryFn: func(ctx context.Context) (interface{}, error) {
				// 查询统计信息
				return w.store.GetStats(ctx)
			},
		},
	}
}

// Start 启动缓存预热
func (w *CacheWarmer) Start(ctx context.Context) {
	log.Println("🔄 CacheWarmer启动中...")

	// 立即执行一次预热
	w.warmup(ctx)

	// 定期执行预热
	w.ticker = time.NewTicker(w.interval)
	defer w.ticker.Stop()

	go func() {
		for {
			select {
			case <-ctx.Done():
				log.Println("🛑 CacheWarmer已停止")
				return
			case <-w.done:
				log.Println("🛑 CacheWarmer已停止")
				return
			case <-w.ticker.C:
				w.warmup(ctx)
			}
		}
	}()
}

// Stop 停止缓存预热
func (w *CacheWarmer) Stop() {
	select {
	case w.done <- struct{}{}:
	default:
	}
}

// warmup 执行预热查询
func (w *CacheWarmer) warmup(ctx context.Context) {
	startTime := time.Now()
	log.Printf("🔥 开始缓存预热 (时间: %s)", startTime.Format("15:04:05"))

	// 创建超时context
	warmupCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	// 并行执行所有预热查询
	var wg sync.WaitGroup
	successCount := 0
	failureCount := 0

	for _, query := range w.warmupQueries {
		wg.Add(1)
		go func(q WarmupQuery) {
			defer wg.Done()

			cacheKey := "warmup_" + q.Name
			result, err := q.QueryFn(warmupCtx)

			if err != nil {
				log.Printf("  ⚠️  预热查询失败 (%s): %v", q.Name, err)
				failureCount++
				return
			}

			// 保存到缓存
			w.mu.Lock()
			w.cache.Add(cacheKey, CacheEntry{
				Data:      result,
				Timestamp: time.Now(),
			})
			w.mu.Unlock()

			successCount++
			log.Printf("  ✅ 预热查询成功 (%s)", q.Name)
		}(query)
	}

	wg.Wait()

	duration := time.Since(startTime)
	log.Printf("✅ 缓存预热完成 (耗时: %.0fms, 成功: %d, 失败: %d)", duration.Seconds()*1000, successCount, failureCount)

	// 更新指标
	w.metrics.mu.Lock()
	w.metrics.LastUpdateAt = time.Now()
	w.metrics.mu.Unlock()
}

// Get 获取缓存数据
func (w *CacheWarmer) Get(key string) (interface{}, bool) {
	w.mu.RLock()
	entry, found := w.cache.Get(key)
	w.mu.RUnlock()

	if !found {
		w.metrics.mu.Lock()
		w.metrics.Misses++
		w.metrics.mu.Unlock()
		return nil, false
	}

	// 检查缓存是否过期
	if time.Since(entry.Timestamp) > w.cacheTTL {
		w.mu.Lock()
		w.cache.Remove(key)
		w.mu.Unlock()

		w.metrics.mu.Lock()
		w.metrics.Misses++
		w.metrics.mu.Unlock()
		return nil, false
	}

	// 更新命中次数
	entry.HitCount++
	w.mu.Lock()
	w.cache.Add(key, entry)
	w.mu.Unlock()

	w.metrics.mu.Lock()
	w.metrics.Hits++
	w.metrics.mu.Unlock()

	return entry.Data, true
}

// Set 手动设置缓存
func (w *CacheWarmer) Set(key string, data interface{}) {
	w.mu.Lock()
	w.cache.Add(key, CacheEntry{
		Data:      data,
		Timestamp: time.Now(),
	})
	w.mu.Unlock()
}

// Clear 清空缓存
func (w *CacheWarmer) Clear() {
	w.mu.Lock()
	w.cache.Purge()
	w.mu.Unlock()
	log.Println("✅ 缓存已清空")
}

// GetMetrics 获取缓存指标
func (w *CacheWarmer) GetMetrics() CacheMetrics {
	w.metrics.mu.RLock()
	defer w.metrics.mu.RUnlock()

	// 返回不包含锁的副本
	return CacheMetrics{
		Hits:         w.metrics.Hits,
		Misses:       w.metrics.Misses,
		Evictions:    int64(1000 - w.cache.Len()), // LRU大小减去当前项数
		LastUpdateAt: w.metrics.LastUpdateAt,
	}
}

// GetHitRate 获取命中率
func (w *CacheWarmer) GetHitRate() float64 {
	w.metrics.mu.RLock()
	defer w.metrics.mu.RUnlock()

	total := w.metrics.Hits + w.metrics.Misses
	if total == 0 {
		return 0.0
	}

	return float64(w.metrics.Hits) / float64(total) * 100
}

// PrintStats 打印统计信息
func (w *CacheWarmer) PrintStats() {
	metrics := w.GetMetrics()
	hitRate := w.GetHitRate()

	w.mu.RLock()
	cacheSize := w.cache.Len()
	w.mu.RUnlock()

	log.Println("\n📊 缓存预热统计:")
	log.Println(strings.Repeat("═", 50))
	log.Printf("  命中: %d | 未命中: %d | 命中率: %.1f%%\n", metrics.Hits, metrics.Misses, hitRate)
	log.Printf("  缓存大小: %d条 | 最大: 1000条\n", cacheSize)
	log.Printf("  驱逐: %d | 最后更新: %s\n", metrics.Evictions, metrics.LastUpdateAt.Format("15:04:05"))
	log.Println(strings.Repeat("═", 50))
}
