#!/bin/bash

# ============================================================
# Crossmint Payment Migration Script
# Version: 1.0
# Date: 2025-12-28
# Description: Apply Crossmint payment database migration
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Crossmint Payment Database Migration"
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set DATABASE_URL before running this script:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
echo "  URL: ${DATABASE_URL%%@*}@***"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$PROJECT_ROOT/database/migrations/20251228_crossmint_payment/001_create_tables.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found${NC}"
    echo "  Expected: $MIGRATION_FILE"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Migration file found${NC}"
echo "  Path: $MIGRATION_FILE"
echo ""

# Confirm before proceeding
echo -e "${YELLOW}⚠️  This will create the following table:${NC}"
echo "  - payment_orders"
echo ""
echo "Press ENTER to continue, or Ctrl+C to cancel..."
read

echo ""
echo "Applying migration..."
echo ""

# Apply migration
if psql "$DATABASE_URL" < "$MIGRATION_FILE"; then
    echo ""
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    echo ""

    # Verify table was created
    echo "Verifying table creation..."
    TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_orders');")

    if [[ "$TABLE_EXISTS" == *"t"* ]]; then
        echo -e "${GREEN}✓ payment_orders table created${NC}"

        # Show table structure
        echo ""
        echo "Table structure:"
        psql "$DATABASE_URL" -c "\d payment_orders"

        # Show indexes
        echo ""
        echo "Indexes created:"
        psql "$DATABASE_URL" -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'payment_orders';"

        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}  Migration completed successfully! 🎉${NC}"
        echo -e "${GREEN}================================================${NC}"
        echo ""
        echo "Next steps:"
        echo "  1. Update environment variables:"
        echo "     - CROSSMINT_SERVER_API_KEY"
        echo "     - CROSSMINT_WEBHOOK_SECRET"
        echo "  2. Run tests: go test ./api/payment/... -v"
        echo "  3. Restart the application"
        echo ""
    else
        echo -e "${RED}❌ Warning: Table verification failed${NC}"
        echo "Please check the database manually"
        exit 1
    fi
else
    echo ""
    echo -e "${RED}❌ Migration failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Database connection failed"
    echo "  - Insufficient permissions"
    echo "  - Table already exists"
    echo ""
    echo "To rollback (if needed):"
    echo "  psql \$DATABASE_URL < database/migrations/20251228_crossmint_payment/002_rollback.sql"
    echo ""
    exit 1
fi
