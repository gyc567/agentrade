package mem0

import (
	"strings"
	"fmt"
	"log"
	"sync"
	"time"
)

// VersionManager P0修复: 版本控制
// 作用: 管理TradeMemory对象的演化,支持v1→v2→v3迁移
// 防止: 历史记忆的兼容性问题,支持灰度升级
type VersionManager struct {
	currentVersion int
	migrations     map[int]MigrationFunc
	mu             sync.RWMutex
	metrics        *VersionMetrics
}

// VersionMetrics 版本指标
type VersionMetrics struct {
	MigrationsRun    int64
	SuccessCount     int64
	FailureCount     int64
	LastMigrationAt  *time.Time
	AverageDuration  time.Duration
	TotalDuration    time.Duration
	mu               sync.RWMutex
}

// MigrationFunc 迁移函数签名
type MigrationFunc func(data interface{}) (interface{}, error)

// MemoryVersion 带版本信息的记忆
type MemoryVersion struct {
	Version int         // 版本号
	Data    interface{} // 实际数据
	Schema  string      // Schema描述
}

// NewVersionManager 创建版本管理器
func NewVersionManager(currentVersion int) *VersionManager {
	return &VersionManager{
		currentVersion: currentVersion,
		migrations:     make(map[int]MigrationFunc),
		metrics:        &VersionMetrics{},
	}
}

// RegisterMigration 注册从某版本到下一版本的迁移函数
func (vm *VersionManager) RegisterMigration(fromVersion int, fn MigrationFunc) error {
	vm.mu.Lock()
	defer vm.mu.Unlock()

	if fromVersion < 0 || fromVersion >= vm.currentVersion {
		return fmt.Errorf("❌ 无效的版本: %d", fromVersion)
	}

	vm.migrations[fromVersion] = fn
	log.Printf("✅ 注册迁移: v%d → v%d", fromVersion, fromVersion+1)
	return nil
}

// Migrate 将数据从旧版本迁移到当前版本
func (vm *VersionManager) Migrate(data interface{}, fromVersion int) (interface{}, error) {
	startTime := time.Now()

	vm.mu.RLock()
	currentVersion := vm.currentVersion
	vm.mu.RUnlock()

	if fromVersion == currentVersion {
		log.Printf("✅ 数据已是最新版本 (v%d)", currentVersion)
		return data, nil
	}

	if fromVersion > currentVersion {
		return nil, fmt.Errorf("❌ 无法从v%d迁移到v%d (版本过新)", fromVersion, currentVersion)
	}

	// 逐步迁移
	current := data
	for version := fromVersion; version < currentVersion; version++ {
		vm.mu.RLock()
		migrationFn, exists := vm.migrations[version]
		vm.mu.RUnlock()

		if !exists {
			return nil, fmt.Errorf("❌ 找不到v%d→v%d的迁移函数", version, version+1)
		}

		result, err := migrationFn(current)
		if err != nil {
			vm.recordFailure()
			return nil, fmt.Errorf("❌ v%d→v%d迁移失败: %w", version, version+1, err)
		}

		log.Printf("✅ 成功迁移: v%d → v%d", version, version+1)
		current = result
	}

	duration := time.Since(startTime)
	vm.recordSuccess(duration)

	log.Printf("✅ 完整迁移完成 (v%d → v%d, 耗时: %.0fms)", fromVersion, currentVersion, duration.Seconds()*1000)
	return current, nil
}

// DetectVersion 检测数据版本(通过Schema特征)
func (vm *VersionManager) DetectVersion(data map[string]interface{}) (int, error) {
	// v1特征: 有trade_id, decision_time
	if _, hasTradeID := data["trade_id"]; hasTradeID {
		if _, hasDecisionTime := data["decision_time"]; hasDecisionTime {
			// v2特征: 还有reflection_id
			if _, hasReflectionID := data["reflection_id"]; hasReflectionID {
				// v3特征: 还有quality_score_v2
				if _, hasQualityV2 := data["quality_score_v2"]; hasQualityV2 {
					return 3, nil
				}
				return 2, nil
			}
			return 1, nil
		}
	}

	return 0, fmt.Errorf("❌ 无法检测数据版本")
}

// GetVersionInfo 获取版本信息
func (vm *VersionManager) GetVersionInfo() map[string]interface{} {
	vm.mu.RLock()
	defer vm.mu.RUnlock()

	return map[string]interface{}{
		"current_version":     vm.currentVersion,
		"registered_versions": len(vm.migrations),
		"migrations": func() []string {
			var versions []string
			for v := 0; v < vm.currentVersion; v++ {
				if _, exists := vm.migrations[v]; exists {
					versions = append(versions, fmt.Sprintf("v%d→v%d", v, v+1))
				}
			}
			return versions
		}(),
	}
}

// recordSuccess 记录成功的迁移
func (vm *VersionManager) recordSuccess(duration time.Duration) {
	vm.metrics.mu.Lock()
	defer vm.metrics.mu.Unlock()

	vm.metrics.MigrationsRun++
	vm.metrics.SuccessCount++
	now := time.Now()
	vm.metrics.LastMigrationAt = &now

	vm.metrics.TotalDuration += duration
	vm.metrics.AverageDuration = vm.metrics.TotalDuration / time.Duration(vm.metrics.MigrationsRun)
}

// recordFailure 记录失败的迁移
func (vm *VersionManager) recordFailure() {
	vm.metrics.mu.Lock()
	defer vm.metrics.mu.Unlock()

	vm.metrics.MigrationsRun++
	vm.metrics.FailureCount++
	now := time.Now()
	vm.metrics.LastMigrationAt = &now
}

// GetMetrics 获取版本管理指标
func (vm *VersionManager) GetMetrics() VersionMetrics {
	vm.metrics.mu.RLock()
	defer vm.metrics.mu.RUnlock()

	// 返回不包含锁的副本
	return VersionMetrics{
		MigrationsRun:   vm.metrics.MigrationsRun,
		SuccessCount:    vm.metrics.SuccessCount,
		FailureCount:    vm.metrics.FailureCount,
		LastMigrationAt: vm.metrics.LastMigrationAt,
		AverageDuration: vm.metrics.AverageDuration,
		TotalDuration:   vm.metrics.TotalDuration,
	}
}

// PrintStats 打印统计信息
func (vm *VersionManager) PrintStats() {
	metrics := vm.GetMetrics()
	info := vm.GetVersionInfo()

	log.Println("\n📦 版本管理统计:")
	log.Println(strings.Repeat("═", 50))
	log.Printf("  当前版本: v%d\n", info["current_version"])
	log.Printf("  已注册迁移: %d个\n", info["registered_versions"])
	log.Printf("  迁移运行: %d次 | 成功: %d | 失败: %d\n", metrics.MigrationsRun, metrics.SuccessCount, metrics.FailureCount)

	if metrics.LastMigrationAt != nil {
		log.Printf("  最后迁移: %s\n", metrics.LastMigrationAt.Format("2006-01-02 15:04:05"))
	}

	if metrics.AverageDuration > 0 {
		log.Printf("  平均耗时: %.1fms\n", metrics.AverageDuration.Seconds()*1000)
	}

	log.Println(strings.Repeat("═", 50))
}

// MigrationV1toV2 v1 → v2 迁移:
// v1: 基础交易记忆 {trade_id, decision_time, action}
// v2: 添加反思链接 {trade_id, decision_time, action, reflection_id}
func MigrationV1toV2(data interface{}) (interface{}, error) {
	v1, ok := data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("❌ 数据类型错误: 期望map[string]interface{}")
	}

	v2 := make(map[string]interface{})

	// 保留v1的所有字段
	for k, v := range v1 {
		v2[k] = v
	}

	// 添加v2的新字段
	if _, exists := v2["reflection_id"]; !exists {
		v2["reflection_id"] = nil // 初始为空
		log.Printf("  📝 添加reflection_id字段")
	}

	v2["migrated_at"] = time.Now()
	v2["schema_version"] = 2

	return v2, nil
}

// MigrationV2toV3 v2 → v3 迁移:
// v2: 反思链接 {trade_id, decision_time, action, reflection_id}
// v3: 质量评分v2 + 优化的相似度计算
func MigrationV2toV3(data interface{}) (interface{}, error) {
	v2, ok := data.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("❌ 数据类型错误: 期望map[string]interface{}")
	}

	v3 := make(map[string]interface{})

	// 保留v2的所有字段
	for k, v := range v2 {
		v3[k] = v
	}

	// 添加v3的新字段
	if _, exists := v3["quality_score_v2"]; !exists {
		// 如果有旧的quality_score,转换为v2格式
		if oldScore, hasOld := v3["quality_score"]; hasOld {
			v3["quality_score_v2"] = oldScore
			log.Printf("  📊 转换quality_score到v2格式")
		} else {
			v3["quality_score_v2"] = 0.5 // 默认值
		}
	}

	// 添加优化的相似度计算元数据
	if _, exists := v3["similarity_metadata"]; !exists {
		v3["similarity_metadata"] = map[string]interface{}{
			"algorithm": "cosine",
			"dimension": 768,
		}
		log.Printf("  🔍 添加similarity_metadata")
	}

	v3["migrated_at"] = time.Now()
	v3["schema_version"] = 3

	return v3, nil
}

// BatchMigrate 批量迁移数据
func (vm *VersionManager) BatchMigrate(dataList []interface{}, fromVersion int) ([]interface{}, []error) {
	results := make([]interface{}, len(dataList))
	errors := make([]error, 0)

	for i, data := range dataList {
		result, err := vm.Migrate(data, fromVersion)
		if err != nil {
			errors = append(errors, fmt.Errorf("❌ 第%d个数据迁移失败: %w", i, err))
			results[i] = nil
		} else {
			results[i] = result
		}
	}

	if len(errors) > 0 {
		log.Printf("⚠️ 批量迁移完成, 成功: %d/%d", len(dataList)-len(errors), len(dataList))
	} else {
		log.Printf("✅ 批量迁移完成, 全部成功: %d条", len(dataList))
	}

	return results, errors
}
