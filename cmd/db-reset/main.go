package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("❌ Error: DATABASE_URL environment variable is not set")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("❌ Error connecting to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("❌ Error pinging database: %v", err)
	}

	fmt.Println("================================================")
	fmt.Println("  Database Cleanup & Reset Tool")
	fmt.Println("================================================")
	fmt.Println()

	// Drop all tables in reverse dependency order
	dropStatements := []string{
		"DROP TABLE IF EXISTS parameter_change_history CASCADE;",
		"DROP TABLE IF EXISTS learning_reflections CASCADE;",
		"DROP TABLE IF EXISTS trade_analysis_records CASCADE;",
		"DROP TABLE IF EXISTS payment_orders CASCADE;",
		"DROP TABLE IF EXISTS credit_reservations CASCADE;",
		"DROP TABLE IF EXISTS credit_compensation_tasks CASCADE;",
		"DROP TABLE IF EXISTS credit_transactions CASCADE;",
		"DROP TABLE IF EXISTS user_credits CASCADE;",
		"DROP TABLE IF EXISTS credit_packages CASCADE;",
		"DROP TABLE IF EXISTS web3_wallet_nonces CASCADE;",
		"DROP TABLE IF EXISTS user_wallets CASCADE;",
		"DROP TABLE IF EXISTS web3_wallets CASCADE;",
		"DROP TABLE IF EXISTS beta_codes CASCADE;",
		"DROP TABLE IF EXISTS user_news_config CASCADE;",
		"DROP TABLE IF EXISTS system_config CASCADE;",
		"DROP TABLE IF EXISTS audit_logs CASCADE;",
		"DROP TABLE IF EXISTS login_attempts CASCADE;",
		"DROP TABLE IF EXISTS password_resets CASCADE;",
		"DROP TABLE IF EXISTS user_signal_sources CASCADE;",
		"DROP TABLE IF EXISTS traders CASCADE;",
		"DROP TABLE IF EXISTS exchanges CASCADE;",
		"DROP TABLE IF EXISTS ai_models CASCADE;",
		"DROP TABLE IF EXISTS users CASCADE;",
	}

	fmt.Println("🗑️  Dropping all tables...")
	for _, stmt := range dropStatements {
		if _, err := db.Exec(stmt); err != nil {
			log.Printf("⚠️  Warning: %v", err)
		}
	}

	// Drop functions
	dropFunctions := []string{
		"DROP FUNCTION IF EXISTS cleanup_expired_nonces();",
		"DROP FUNCTION IF EXISTS update_updated_at_column();",
	}

	fmt.Println("🗑️  Dropping functions...")
	for _, stmt := range dropFunctions {
		if _, err := db.Exec(stmt); err != nil {
			log.Printf("⚠️  Warning: %v", err)
		}
	}

	fmt.Println()
	fmt.Println("================================================")
	fmt.Println("  Database cleanup completed successfully! ✅")
	fmt.Println("================================================")
	fmt.Println()
}
