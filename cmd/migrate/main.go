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
	fmt.Println("  Crossmint Payment Database Migration")
	fmt.Println("================================================")
	fmt.Println()
	fmt.Println("✓ DATABASE_URL is set")
	fmt.Println()

	// Read migration file
	migrationSQL, err := os.ReadFile("database/migrations/20251228_crossmint_payment/001_create_tables.sql")
	if err != nil {
		log.Fatalf("❌ Error reading migration file: %v", err)
	}

	fmt.Println("✓ Migration file loaded")
	fmt.Println()

	// Connect to database
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("❌ Error connecting to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("❌ Error pinging database: %v", err)
	}

	fmt.Println("✓ Database connection successful")
	fmt.Println()
	fmt.Println("Applying migration...")
	fmt.Println()

	// Execute migration
	_, err = db.Exec(string(migrationSQL))
	if err != nil {
		log.Fatalf("❌ Migration failed: %v", err)
	}

	fmt.Println("✅ Migration applied successfully!")
	fmt.Println()

	// Verify table was created
	var tableExists bool
	err = db.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = 'payment_orders'
		)
	`).Scan(&tableExists)

	if err != nil {
		log.Printf("⚠️  Warning: Could not verify table creation: %v", err)
	} else if tableExists {
		fmt.Println("✓ payment_orders table created")
		fmt.Println()

		// Show table structure
		fmt.Println("Table structure:")
		rows, err := db.Query(`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'payment_orders'
			ORDER BY ordinal_position
		`)
		if err != nil {
			log.Printf("⚠️  Warning: Could not fetch table structure: %v", err)
		} else {
			defer rows.Close()
			fmt.Printf("%-25s %-20s %s\n", "Column", "Type", "Nullable")
			fmt.Println("-----------------------------------------------------------")
			for rows.Next() {
				var colName, dataType, nullable string
				if err := rows.Scan(&colName, &dataType, &nullable); err != nil {
					log.Printf("⚠️  Error scanning row: %v", err)
					continue
				}
				fmt.Printf("%-25s %-20s %s\n", colName, dataType, nullable)
			}
		}

		fmt.Println()

		// Show indexes
		fmt.Println("Indexes created:")
		indexRows, err := db.Query(`
			SELECT indexname, indexdef
			FROM pg_indexes
			WHERE tablename = 'payment_orders'
		`)
		if err != nil {
			log.Printf("⚠️  Warning: Could not fetch indexes: %v", err)
		} else {
			defer indexRows.Close()
			for indexRows.Next() {
				var indexName, indexDef string
				if err := indexRows.Scan(&indexName, &indexDef); err != nil {
					log.Printf("⚠️  Error scanning index: %v", err)
					continue
				}
				fmt.Printf("  - %s\n", indexName)
			}
		}
	}

	fmt.Println()
	fmt.Println("================================================")
	fmt.Println("  Migration completed successfully! 🎉")
	fmt.Println("================================================")
	fmt.Println()
	fmt.Println("Next steps:")
	fmt.Println("  1. Update environment variables:")
	fmt.Println("     - CROSSMINT_SERVER_API_KEY")
	fmt.Println("     - CROSSMINT_WEBHOOK_SECRET")
	fmt.Println("  2. Run tests: go test ./api/payment/... -v")
	fmt.Println("  3. Restart the application")
	fmt.Println()
}
