package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	// Get DATABASE_URL from environment
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
	fmt.Println("  Database Verification Report")
	fmt.Println("================================================")
	fmt.Println()

	// Check users
	fmt.Println("👤 Users:")
	rows, err := db.Query(`SELECT id, email, is_admin FROM users ORDER BY id`)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var id, email string
			var isAdmin bool
			if err := rows.Scan(&id, &email, &isAdmin); err != nil {
				log.Printf("Error: %v", err)
				continue
			}
			role := "user"
			if isAdmin {
				role = "admin"
			}
			fmt.Printf("  • %s (%s) [%s]\n", id, email, role)
		}
	}
	fmt.Println()

	// Check AI Models
	fmt.Println("🤖 AI Models:")
	rows, err = db.Query(`SELECT id, name, provider, enabled FROM ai_models ORDER BY id`)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var id, name, provider string
			var enabled bool
			if err := rows.Scan(&id, &name, &provider, &enabled); err != nil {
				log.Printf("Error: %v", err)
				continue
			}
			status := "disabled"
			if enabled {
				status = "enabled"
			}
			fmt.Printf("  • %s (%s) [%s]\n", name, provider, status)
		}
	}
	fmt.Println()

	// Check Exchanges
	fmt.Println("💱 Exchanges:")
	rows, err = db.Query(`SELECT id, name, type, enabled FROM exchanges ORDER BY id`)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var id, name, exType string
			var enabled bool
			if err := rows.Scan(&id, &name, &exType, &enabled); err != nil {
				log.Printf("Error: %v", err)
				continue
			}
			status := "disabled"
			if enabled {
				status = "enabled"
			}
			fmt.Printf("  • %s (%s) [%s]\n", name, exType, status)
		}
	}
	fmt.Println()

	// Check System Config
	fmt.Println("⚙️  System Configuration:")
	rows, err = db.Query(`SELECT key, value FROM system_config ORDER BY key`)
	if err != nil {
		log.Printf("Error: %v", err)
	} else {
		defer rows.Close()
		configCount := 0
		for rows.Next() {
			var key, value string
			if err := rows.Scan(&key, &value); err != nil {
				log.Printf("Error: %v", err)
				continue
			}
			configCount++
			if len(value) > 50 {
				fmt.Printf("  • %s = %s...\n", key, value[:50])
			} else {
				fmt.Printf("  • %s = %s\n", key, value)
			}
		}
		fmt.Printf("\n  Total: %d config items\n", configCount)
	}
	fmt.Println()

	// Check table row counts
	fmt.Println("📊 Table Statistics:")
	tables := []string{"users", "ai_models", "exchanges", "traders", "system_config", "audit_logs", "login_attempts"}
	for _, table := range tables {
		var count int
		err := db.QueryRow(fmt.Sprintf(`SELECT COUNT(*) FROM %s`, table)).Scan(&count)
		if err != nil {
			log.Printf("Error counting %s: %v", table, err)
		} else {
			fmt.Printf("  • %s: %d rows\n", table, count)
		}
	}

	fmt.Println()
	fmt.Println("================================================")
	fmt.Println("  Verification completed successfully! ✅")
	fmt.Println("================================================")
}
