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

	fmt.Println("================================================")
	fmt.Println("  Database Migration Tool")
	fmt.Println("================================================")
	fmt.Println()
	fmt.Println("✓ DATABASE_URL is set")
	fmt.Println()

	// Test connection
	fmt.Println("🔄 Testing database connection...")
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("❌ Error connecting to database: %v", err)
	}
	defer db.Close()

	// Test connection with Ping
	if err := db.Ping(); err != nil {
		log.Fatalf("❌ Error pinging database: %v", err)
	}

	fmt.Println("✅ Database connection successful!")
	fmt.Println()

	// Read migration file
	fmt.Println("📄 Reading migration file...")
	migrationSQL, err := os.ReadFile("database/migration.sql")
	if err != nil {
		log.Fatalf("❌ Error reading migration file: %v", err)
	}

	fmt.Println("✓ Migration file loaded")
	fmt.Println()

	// Execute migration
	fmt.Println("🔄 Applying migrations...")
	fmt.Println()

	_, err = db.Exec(string(migrationSQL))
	if err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}

	fmt.Println()
	fmt.Println("✅ Migration completed successfully!")
	fmt.Println()

	// Verify tables were created
	fmt.Println("📊 Verifying tables...")
	fmt.Println()

	rows, err := db.Query(`
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
		ORDER BY table_name
	`)
	if err != nil {
		log.Printf("⚠️  Warning: Could not fetch tables: %v", err)
	} else {
		defer rows.Close()
		tables := []string{}
		for rows.Next() {
			var tableName string
			if err := rows.Scan(&tableName); err != nil {
				log.Printf("⚠️  Error scanning row: %v", err)
				continue
			}
			tables = append(tables, tableName)
		}

		fmt.Printf("Total tables created: %d\n\n", len(tables))
		fmt.Println("Tables:")
		for i, table := range tables {
			fmt.Printf("  %d. %s\n", i+1, table)
		}
	}

	fmt.Println()
	fmt.Println("================================================")
	fmt.Println("  Migration completed successfully! 🎉")
	fmt.Println("================================================")
	fmt.Println()
}
