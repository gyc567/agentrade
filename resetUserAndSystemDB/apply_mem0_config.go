package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

// ApplyMem0Config 应用Mem0配置迁移到数据库
func ApplyMem0Config(db *sql.DB) error {
	log.Println("\n🚀 应用Mem0配置迁移...")

	// 读取迁移SQL文件
	migrationPath := filepath.Join(
		filepath.Dir(os.Args[0]),
		"..",
		"database",
		"migrations",
		"20251222_mem0_integration_config.sql",
	)

	migrationSQL, err := os.ReadFile(migrationPath)
	if err != nil {
		return fmt.Errorf("❌ 无法读取迁移文件 %s: %w", migrationPath, err)
	}

	// 执行迁移
	_, err = db.Exec(string(migrationSQL))
	if err != nil {
		return fmt.Errorf("❌ 执行迁移失败: %w", err)
	}

	log.Println("✅ Mem0配置迁移执行成功")

	// 验证迁移结果
	count := 0
	err = db.QueryRow(`
		SELECT COUNT(*) FROM system_config WHERE key LIKE 'mem0_%'
	`).Scan(&count)
	if err != nil {
		return fmt.Errorf("❌ 验证迁移失败: %w", err)
	}

	log.Printf("✅ Mem0配置项已创建: %d个", count)

	// 显示关键配置
	printMem0ConfigStatus(db)

	return nil
}

// printMem0ConfigStatus 打印Mem0配置状态
func printMem0ConfigStatus(db *sql.DB) {
	log.Println("\n📋 Mem0配置状态:")
	log.Println("=" * 60)

	configs := map[string]string{
		"mem0_enabled":                    "启用开关",
		"mem0_api_key":                    "API密钥",
		"mem0_api_url":                    "API端点",
		"mem0_user_id":                    "用户ID",
		"mem0_organization_id":            "组织ID",
		"mem0_model":                      "AI模型",
		"mem0_cache_ttl_minutes":          "缓存TTL",
		"mem0_warmup_enabled":             "预热机制",
		"mem0_circuit_breaker_enabled":    "断路器",
		"mem0_quality_filter_enabled":     "质量过滤",
		"mem0_reflection_enabled":         "反思系统",
		"mem0_metrics_enabled":            "监控收集",
		"mem0_rollout_percentage":         "灰度百分比",
		"mem0_ab_test_enabled":            "A/B测试",
	}

	for key, desc := range configs {
		var value string
		err := db.QueryRow(
			`SELECT value FROM system_config WHERE key = $1`,
			key,
		).Scan(&value)

		if err == sql.ErrNoRows {
			log.Printf("  ❌ %s: [未配置]", desc)
		} else if err != nil {
			log.Printf("  ⚠️  %s: [查询错误]", desc)
		} else {
			// 掩码敏感信息
			displayValue := value
			if key == "mem0_api_key" && len(value) > 4 {
				displayValue = "***" + value[len(value)-4:]
			}
			if key == "mem0_user_id" && len(value) > 4 {
				displayValue = "***" + value[len(value)-4:]
			}

			// 根据值显示状态
			status := "✓"
			if value == "" {
				status = "⚠️"
			} else if value == "false" {
				status = "🔕"
			} else if value == "true" {
				status = "✅"
			}

			log.Printf("  %s %s: %s", status, desc, displayValue)
		}
	}

	log.Println("=" * 60)
	log.Println("\n📝 待配置的关键项:")
	log.Println("  1. mem0_user_id     - 需要从Mem0获取")
	log.Println("  2. mem0_organization_id - 需要从Mem0获取")
	log.Println("\n💡 建议:")
	log.Println("  - Phase 2.1验收通过后,更新 mem0_enabled = true")
	log.Println("  - 灰度发布: 5% → 25% → 50% → 100%")
	log.Println("  - 监控指标: 缓存命中率>70%, P95延迟<500ms")
}

// GetMem0APIKey 获取已配置的API密钥(用于测试)
func GetMem0APIKey(db *sql.DB) (string, error) {
	var apiKey string
	err := db.QueryRow(
		`SELECT value FROM system_config WHERE key = 'mem0_api_key'`,
	).Scan(&apiKey)

	if err == sql.ErrNoRows {
		return "", fmt.Errorf("❌ Mem0 API密钥未配置")
	}
	if err != nil {
		return "", err
	}

	return apiKey, nil
}

// ValidateMem0Config 验证Mem0配置的完整性
func ValidateMem0Config(db *sql.DB) error {
	log.Println("\n🔍 验证Mem0配置...")

	// 必需字段
	requiredFields := []string{
		"mem0_api_key",
		"mem0_api_url",
		"mem0_model",
	}

	for _, field := range requiredFields {
		var value string
		err := db.QueryRow(
			`SELECT value FROM system_config WHERE key = $1`,
			field,
		).Scan(&value)

		if err == sql.ErrNoRows || value == "" {
			return fmt.Errorf("❌ 必需配置缺失: %s", field)
		}
		if err != nil {
			return err
		}
	}

	// 可选字段的默认值验证
	optionalDefaults := map[string]string{
		"mem0_cache_ttl_minutes":       "30",
		"mem0_warmup_interval_minutes": "5",
		"mem0_model":                   "gpt-4",
		"mem0_temperature":             "0.7",
		"mem0_similarity_threshold":    "0.6",
		"mem0_quality_score_threshold": "0.3",
	}

	for field, defaultVal := range optionalDefaults {
		var value string
		err := db.QueryRow(
			`SELECT value FROM system_config WHERE key = $1`,
			field,
		).Scan(&value)

		if err == sql.ErrNoRows {
			log.Printf("  ⚠️  %s 未设置,将使用默认值: %s", field, defaultVal)
			// 自动设置默认值
			_, _ = db.Exec(
				`INSERT INTO system_config (key, value) VALUES ($1, $2)
				 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
				field, defaultVal,
			)
		}
	}

	log.Println("✅ Mem0配置验证完成")
	return nil
}
