#!/bin/bash

# ============================================================
# Crossmint Payment Rollback Script
# Version: 1.0
# Date: 2025-12-28
# Description: Rollback Crossmint payment database migration
# ============================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "  Crossmint Payment Database Rollback"
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
ROLLBACK_FILE="$PROJECT_ROOT/database/migrations/20251228_crossmint_payment/002_rollback.sql"

# Check if rollback file exists
if [ ! -f "$ROLLBACK_FILE" ]; then
    echo -e "${RED}❌ Error: Rollback file not found${NC}"
    echo "  Expected: $ROLLBACK_FILE"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Rollback file found${NC}"
echo "  Path: $ROLLBACK_FILE"
echo ""

# Check if table exists
TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_orders');")

if [[ "$TABLE_EXISTS" != *"t"* ]]; then
    echo -e "${YELLOW}⚠️  payment_orders table does not exist${NC}"
    echo "Nothing to rollback."
    echo ""
    exit 0
fi

# Check if there are any records in payment_orders
RECORD_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM payment_orders;")
RECORD_COUNT=$(echo "$RECORD_COUNT" | xargs)  # Trim whitespace

echo -e "${YELLOW}⚠️  WARNING: This will DELETE the following:${NC}"
echo "  - payment_orders table"
echo "  - All payment order records (${RECORD_COUNT} records)"
echo "  - All indexes and triggers"
echo ""
echo -e "${RED}This action CANNOT be undone!${NC}"
echo ""
echo "Type 'YES' to confirm rollback, or anything else to cancel:"
read CONFIRMATION

if [ "$CONFIRMATION" != "YES" ]; then
    echo ""
    echo "Rollback cancelled."
    echo ""
    exit 0
fi

echo ""
echo "Rolling back migration..."
echo ""

# Apply rollback
if psql "$DATABASE_URL" < "$ROLLBACK_FILE"; then
    echo ""
    echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
    echo ""

    # Verify table was dropped
    TABLE_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_orders');")

    if [[ "$TABLE_EXISTS" != *"t"* ]]; then
        echo -e "${GREEN}✓ payment_orders table removed${NC}"
        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}  Rollback completed successfully! ✓${NC}"
        echo -e "${GREEN}================================================${NC}"
        echo ""
        echo "To re-apply the migration:"
        echo "  ./scripts/migrate_crossmint_payment.sh"
        echo ""
    else
        echo -e "${RED}❌ Warning: Table verification failed${NC}"
        echo "Please check the database manually"
        exit 1
    fi
else
    echo ""
    echo -e "${RED}❌ Rollback failed!${NC}"
    echo ""
    echo "Please check the error message above and try again."
    echo ""
    exit 1
fi
