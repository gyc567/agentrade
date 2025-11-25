package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/mattn/go-sqlite3"
	_ "github.com/lib/pq"
)

// MigrateData 从SQLite迁移数据到Neon PostgreSQL
func MigrateData(sqlitePath, neonDSN string) error {
	log.Println("开始从SQLite迁移数据到Neon PostgreSQL...")

	// 连接SQLite
	sqliteDB, err := sql.Open("sqlite3", sqlitePath)
	if err != nil {
		return fmt.Errorf("连接SQLite失败: %w", err)
	}
	defer sqliteDB.Close()

	// 连接Neon PostgreSQL
	pgDB, err := sql.Open("postgres", neonDSN)
	if err != nil {
		return fmt.Errorf("连接Neon失败: %w", err)
	}
	defer pgDB.Close()

	// 创建表结构（确保与原SQLite表结构兼容）
	tables := []string{
		// 用户表
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(128) NOT NULL UNIQUE,
			password_hash VARCHAR(256) NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			is_admin BOOLEAN DEFAULT false
		)`,

		// 交易所配置表
		`CREATE TABLE IF NOT EXISTS exchange_configs (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			exchange_type VARCHAR(32) NOT NULL,
			api_key VARCHAR(512) NOT NULL,
			secret_key VARCHAR(512) NOT NULL,
			passphrase VARCHAR(256),
			use_testnet BOOLEAN DEFAULT false,
			enabled BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,

		// AI模型配置表
		`CREATE TABLE IF NOT EXISTS ai_model_configs (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL,
			model_type VARCHAR(32) NOT NULL,
			api_key VARCHAR(512) NOT NULL,
			custom_api_url VARCHAR(256),
			custom_model_name VARCHAR(128),
			enabled BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)`,
	}

	for _, tableSQL := range tables {
		if _, err := pgDB.Exec(tableSQL); err != nil {
			return fmt.Errorf("创建表失败: %w", err)
		}
		log.Printf("已创建表: %s", getTableName(tableSQL))
	}

	// 迁移用户数据
	if err := migrateUsers(sqliteDB, pgDB); err != nil {
		return fmt.Errorf("迁移用户数据失败: %w", err)
	}

	// 迁移交易所配置
	if err := migrateExchangeConfigs(sqliteDB, pgDB); err != nil {
		return fmt.Errorf("迁移交易所配置失败: %w", err)
	}

	// 迁移AI模型配置
	if err := migrateAIModelConfigs(sqliteDB, pgDB); err != nil {
		return fmt.Errorf("迁移AI模型配置失败: %w", err)
	}

	log.Println("数据迁移完成！")
	return nil
}

// 辅助函数
func getTableName(sql string) string {
	// 简单解析表名（实际项目中可以使用更可靠的解析方法）
	return "unknown"
}

// 迁移用户数据
func migrateUsers(sqliteDB, pgDB *sql.DB) error {
	rows, err := sqliteDB.Query("SELECT id, email, password_hash, is_admin FROM users")
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id interface{}
		var email string
		var passwordHash string
		var isAdmin bool

		if err := rows.Scan(&id, &email, &passwordHash, &isAdmin); err != nil {
			return err
		}

		// 转换id为合适的类型
		var pgID int
		switch v := id.(type) {
		case int:
			pgID = v
		case int64:
			pgID = int(v)
		case float64:
			pgID = int(v)
		case string:
			// 如果id是字符串类型，跳过
			continue
		default:
			// 其他未知类型，跳过
			continue
		}

		_, err := pgDB.Exec("INSERT INTO users (id, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING",
			pgID, email, passwordHash, isAdmin)
		if err != nil {
			return err
		}
	}

	return nil
}

// 迁移交易所配置
func migrateExchangeConfigs(sqliteDB, pgDB *sql.DB) error {
	rows, err := sqliteDB.Query("SELECT id, user_id, exchange_type, api_key, secret_key, passphrase, use_testnet, enabled FROM exchange_configs")
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var userID int
		var exchangeType string
		var apiKey string
		var secretKey string
		var passphrase sql.NullString
		var useTestnet bool
		var enabled bool

		if err := rows.Scan(&id, &userID, &exchangeType, &apiKey, &secretKey, &passphrase, &useTestnet, &enabled); err != nil {
			return err
		}

		_, err := pgDB.Exec("INSERT INTO exchange_configs (id, user_id, exchange_type, api_key, secret_key, passphrase, use_testnet, enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING",
			id, userID, exchangeType, apiKey, secretKey, passphrase.String, useTestnet, enabled)
		if err != nil {
			return err
		}
	}

	return nil
}

// 迁移AI模型配置
func migrateAIModelConfigs(sqliteDB, pgDB *sql.DB) error {
	rows, err := sqliteDB.Query("SELECT id, user_id, model_type, api_key, custom_api_url, custom_model_name, enabled FROM ai_model_configs")
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var userID int
		var modelType string
		var apiKey string
		var customAPIURL sql.NullString
		var customModelName sql.NullString
		var enabled bool

		if err := rows.Scan(&id, &userID, &modelType, &apiKey, &customAPIURL, &customModelName, &enabled); err != nil {
			return err
		}

		_, err := pgDB.Exec("INSERT INTO ai_model_configs (id, user_id, model_type, api_key, custom_api_url, custom_model_name, enabled) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING",
			id, userID, modelType, apiKey, customAPIURL.String, customModelName.String, enabled)
		if err != nil {
			return err
		}
	}

	return nil
}
