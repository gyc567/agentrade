package mem0

import (
	"strings"
	"fmt"
	"log"
	"sort"
	"sync"
	"time"
)

// MetricsCollector P0修复: 监控指标收集
// 作用: 聚合所有组件的性能指标,导出到Grafana/Prometheus
// 收益: 实时可视化系统状态,快速发现性能问题
type MetricsCollector struct {
	// 基础指标
	requestCount      int64
	requestDuration   []time.Duration // 保留最近1000个请求的耗时
	errorCount        int64
	successCount      int64
	circuitBreakerOps int64

	// 缓存指标
	cacheHits   int64
	cacheMisses int64

	// API指标
	apiLatencies  []time.Duration // P50/P95/P99计算
	apiErrors     int64
	apiSuccesses  int64
	lastAPICall   *time.Time
	apiStatusCode map[int]int64 // 统计各HTTP状态码

	// 断路器指标
	circuitTrips      int64
	circuitRecoveries int64
	currentCircuitState string

	// 时间戳
	startTime     time.Time
	lastResetAt   time.Time
	collectionAt  *time.Time

	// 并发安全
	mu sync.RWMutex

	// 配置
	maxSamples int // 最多保留的样本数
}

// MetricsSnapshot 指标快照(用于Prometheus导出)
type MetricsSnapshot struct {
	Timestamp          time.Time
	RequestCount       int64
	RequestAverageLat  float64 // ms
	RequestP50Lat      float64 // ms
	RequestP95Lat      float64 // ms
	RequestP99Lat      float64 // ms
	ErrorRate          float64 // %
	CacheHitRate       float64 // %
	APILatencyP95      float64 // ms
	APIErrorRate       float64 // %
	CircuitBreakerTrips int64
	CircuitBreakerState string
	Uptime             time.Duration
	LastAPICall        *time.Time
}

// NewMetricsCollector 创建指标收集器
func NewMetricsCollector() *MetricsCollector {
	now := time.Now()
	return &MetricsCollector{
		requestDuration:   make([]time.Duration, 0, 1000),
		apiLatencies:      make([]time.Duration, 0, 1000),
		apiStatusCode:     make(map[int]int64),
		startTime:         now,
		lastResetAt:       now,
		currentCircuitState: "closed",
		maxSamples:        1000,
	}
}

// RecordRequest 记录一个请求
func (mc *MetricsCollector) RecordRequest(duration time.Duration, err error) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	mc.requestCount++

	// 保留最近1000个请求的耗时
	if len(mc.requestDuration) >= mc.maxSamples {
		mc.requestDuration = mc.requestDuration[1:]
	}
	mc.requestDuration = append(mc.requestDuration, duration)

	if err != nil {
		mc.errorCount++
	} else {
		mc.successCount++
	}
}

// RecordCacheHit 记录缓存命中
func (mc *MetricsCollector) RecordCacheHit() {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.cacheHits++
}

// RecordCacheMiss 记录缓存未命中
func (mc *MetricsCollector) RecordCacheMiss() {
	mc.mu.Lock()
	defer mc.mu.Unlock()
	mc.cacheMisses++
}

// RecordAPICall 记录API调用
func (mc *MetricsCollector) RecordAPICall(duration time.Duration, statusCode int, err error) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	now := time.Now()
	mc.lastAPICall = &now

	// 保留最近1000个API调用的耗时
	if len(mc.apiLatencies) >= mc.maxSamples {
		mc.apiLatencies = mc.apiLatencies[1:]
	}
	mc.apiLatencies = append(mc.apiLatencies, duration)

	// 统计状态码
	mc.apiStatusCode[statusCode]++

	if err != nil {
		mc.apiErrors++
	} else {
		mc.apiSuccesses++
	}
}

// RecordCircuitBreakerState 记录断路器状态
func (mc *MetricsCollector) RecordCircuitBreakerState(state CircuitState) {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	oldState := mc.currentCircuitState
	mc.currentCircuitState = string(state)

	if state == StateOpen && oldState != string(StateOpen) {
		mc.circuitTrips++
		log.Printf("🚨 断路器打开, 总触发次数: %d", mc.circuitTrips)
	} else if state == StateClosed && oldState != string(StateClosed) {
		mc.circuitRecoveries++
		log.Printf("✅ 断路器恢复, 总恢复次数: %d", mc.circuitRecoveries)
	}
}

// GetMetricsSnapshot 获取指标快照
func (mc *MetricsCollector) GetMetricsSnapshot() MetricsSnapshot {
	mc.mu.RLock()
	defer mc.mu.RUnlock()

	snapshot := MetricsSnapshot{
		Timestamp:           time.Now(),
		RequestCount:        mc.requestCount,
		CircuitBreakerTrips: mc.circuitTrips,
		CircuitBreakerState: mc.currentCircuitState,
		Uptime:              time.Since(mc.startTime),
		LastAPICall:         mc.lastAPICall,
	}

	// 计算请求相关指标
	if mc.requestCount > 0 {
		snapshot.ErrorRate = float64(mc.errorCount) / float64(mc.requestCount) * 100
		snapshot.RequestAverageLat = mc.calculateAverageLat(mc.requestDuration)
		snapshot.RequestP50Lat = mc.calculatePercentileLat(mc.requestDuration, 50)
		snapshot.RequestP95Lat = mc.calculatePercentileLat(mc.requestDuration, 95)
		snapshot.RequestP99Lat = mc.calculatePercentileLat(mc.requestDuration, 99)
	}

	// 计算缓存指标
	totalCacheOps := mc.cacheHits + mc.cacheMisses
	if totalCacheOps > 0 {
		snapshot.CacheHitRate = float64(mc.cacheHits) / float64(totalCacheOps) * 100
	}

	// 计算API指标
	totalAPIOps := mc.apiSuccesses + mc.apiErrors
	if totalAPIOps > 0 {
		snapshot.APIErrorRate = float64(mc.apiErrors) / float64(totalAPIOps) * 100
		snapshot.APILatencyP95 = mc.calculatePercentileLat(mc.apiLatencies, 95)
	}

	return snapshot
}

// calculateAverageLat 计算平均延迟(ms)
func (mc *MetricsCollector) calculateAverageLat(durations []time.Duration) float64 {
	if len(durations) == 0 {
		return 0
	}

	total := time.Duration(0)
	for _, d := range durations {
		total += d
	}

	return total.Seconds() / float64(len(durations)) * 1000
}

// calculatePercentileLat 计算百分位延迟(ms)
func (mc *MetricsCollector) calculatePercentileLat(durations []time.Duration, percentile float64) float64 {
	if len(durations) == 0 {
		return 0
	}

	// 复制并排序
	sorted := make([]time.Duration, len(durations))
	copy(sorted, durations)
	sort.Slice(sorted, func(i, j int) bool {
		return sorted[i] < sorted[j]
	})

	// 计算百分位位置
	index := int(float64(len(sorted)-1) * percentile / 100)
	if index < 0 {
		index = 0
	}
	if index >= len(sorted) {
		index = len(sorted) - 1
	}

	return sorted[index].Seconds() * 1000
}

// ExportPrometheus 导出Prometheus格式(用于Grafana抓取)
func (mc *MetricsCollector) ExportPrometheus() string {
	snapshot := mc.GetMetricsSnapshot()

	output := fmt.Sprintf(`# HELP nofx_request_count 请求总数
# TYPE nofx_request_count counter
nofx_request_count %d

# HELP nofx_request_latency_p95_ms P95延迟(毫秒)
# TYPE nofx_request_latency_p95_ms gauge
nofx_request_latency_p95_ms %.2f

# HELP nofx_error_rate 错误率(百分比)
# TYPE nofx_error_rate gauge
nofx_error_rate %.2f

# HELP nofx_cache_hit_rate 缓存命中率(百分比)
# TYPE nofx_cache_hit_rate gauge
nofx_cache_hit_rate %.2f

# HELP nofx_api_latency_p95_ms API P95延迟(毫秒)
# TYPE nofx_api_latency_p95_ms gauge
nofx_api_latency_p95_ms %.2f

# HELP nofx_api_error_rate API错误率(百分比)
# TYPE nofx_api_error_rate gauge
nofx_api_error_rate %.2f

# HELP nofx_circuit_breaker_trips 断路器触发总次数
# TYPE nofx_circuit_breaker_trips counter
nofx_circuit_breaker_trips %d

# HELP nofx_circuit_breaker_recoveries 断路器恢复总次数
# TYPE nofx_circuit_breaker_recoveries counter
nofx_circuit_breaker_recoveries %d

# HELP nofx_uptime_seconds 服务运行时间(秒)
# TYPE nofx_uptime_seconds gauge
nofx_uptime_seconds %.0f
`,
		snapshot.RequestCount,
		snapshot.RequestP95Lat,
		snapshot.ErrorRate,
		snapshot.CacheHitRate,
		snapshot.APILatencyP95,
		snapshot.APIErrorRate,
		snapshot.CircuitBreakerTrips,
		mc.circuitRecoveries,
		snapshot.Uptime.Seconds(),
	)

	return output
}

// PrintStats 打印统计信息
func (mc *MetricsCollector) PrintStats() {
	snapshot := mc.GetMetricsSnapshot()

	log.Println("\n📊 Mem0系统监控指标:")
	log.Println(strings.Repeat("═", 60))

	log.Println("\n📈 请求统计:")
	log.Printf("  总请求数: %d\n", snapshot.RequestCount)
	log.Printf("  平均延迟: %.2fms\n", snapshot.RequestAverageLat)
	log.Printf("  P50延迟: %.2fms | P95延迟: %.2fms | P99延迟: %.2fms\n",
		snapshot.RequestP50Lat, snapshot.RequestP95Lat, snapshot.RequestP99Lat)
	log.Printf("  错误率: %.2f%%\n", snapshot.ErrorRate)

	log.Println("\n💾 缓存统计:")
	log.Printf("  命中率: %.2f%%\n", snapshot.CacheHitRate)

	log.Println("\n🌐 API统计:")
	log.Printf("  P95延迟: %.2fms\n", snapshot.APILatencyP95)
	log.Printf("  错误率: %.2f%%\n", snapshot.APIErrorRate)

	log.Println("\n🔌 断路器统计:")
	log.Printf("  当前状态: %s\n", snapshot.CircuitBreakerState)
	log.Printf("  触发次数: %d | 恢复次数: %d\n",
		snapshot.CircuitBreakerTrips, mc.circuitRecoveries)

	log.Println("\n⏱️ 系统运行时间:")
	log.Printf("  运行时长: %v\n", snapshot.Uptime)

	if snapshot.LastAPICall != nil {
		log.Printf("  最后API调用: %s\n", snapshot.LastAPICall.Format("2006-01-02 15:04:05"))
	}

	log.Println(strings.Repeat("═", 60))
}

// Reset 重置所有指标(测试用)
func (mc *MetricsCollector) Reset() {
	mc.mu.Lock()
	defer mc.mu.Unlock()

	now := time.Now()
	mc.requestCount = 0
	mc.errorCount = 0
	mc.successCount = 0
	mc.cacheHits = 0
	mc.cacheMisses = 0
	mc.apiErrors = 0
	mc.apiSuccesses = 0
	mc.circuitTrips = 0
	mc.circuitRecoveries = 0

	mc.requestDuration = make([]time.Duration, 0, mc.maxSamples)
	mc.apiLatencies = make([]time.Duration, 0, mc.maxSamples)
	mc.apiStatusCode = make(map[int]int64)

	mc.lastResetAt = now
	log.Println("🔄 所有指标已重置")
}

// GetHealth 获取健康检查结果
func (mc *MetricsCollector) GetHealth() map[string]interface{} {
	snapshot := mc.GetMetricsSnapshot()

	// 根据P95延迟判断健康状态
	status := "healthy"
	if snapshot.RequestP95Lat > 500 {
		status = "degraded"
	}
	if snapshot.RequestP95Lat > 1000 {
		status = "unhealthy"
	}

	// 如果断路器打开,状态为unhealthy
	if snapshot.CircuitBreakerState == "open" {
		status = "unhealthy"
	}

	return map[string]interface{}{
		"status":              status,
		"request_p95_lat_ms":  snapshot.RequestP95Lat,
		"cache_hit_rate":      snapshot.CacheHitRate,
		"error_rate":          snapshot.ErrorRate,
		"circuit_breaker":     snapshot.CircuitBreakerState,
		"uptime_seconds":      snapshot.Uptime.Seconds(),
		"timestamp":           snapshot.Timestamp,
	}
}
