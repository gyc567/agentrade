#!/bin/bash

# ============================================================
# Crossmint Payment Migration Script (HTTP API Version)
# Uses curl to execute SQL via HTTP
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "  Crossmint Payment Database Migration (HTTP)"
echo "================================================"
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL is not set${NC}"
    echo ""
    echo "Please set DATABASE_URL:"
    echo "  export DATABASE_URL='postgresql://user:pass@host:port/dbname'"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
echo ""

# Read migration SQL
MIGRATION_FILE="database/migrations/20251228_crossmint_payment/001_create_tables.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Migration file not found${NC}"
    echo "  Expected: $MIGRATION_FILE"
    exit 1
fi

echo -e "${GREEN}✓ Migration file found${NC}"
echo ""

# Read SQL content
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Parse DATABASE_URL to extract connection info
# Format: postgresql://user:pass@host:port/dbname
DB_URL_NO_PROTOCOL="${DATABASE_URL#postgresql://}"
DB_URL_NO_PROTOCOL="${DB_URL_NO_PROTOCOL#postgres://}"

# Extract user:pass
USER_PASS="${DB_URL_NO_PROTOCOL%%@*}"
DB_USER="${USER_PASS%%:*}"
DB_PASS="${USER_PASS#*:}"

# Extract host:port/dbname
HOST_DB="${DB_URL_NO_PROTOCOL#*@}"
HOST_PORT="${HOST_DB%%/*}"
DB_HOST="${HOST_PORT%%:*}"
DB_PORT="${HOST_PORT#*:}"
[ "$DB_PORT" = "$DB_HOST" ] && DB_PORT="5432"
DB_NAME="${HOST_DB#*/}"
DB_NAME="${DB_NAME%%\?*}"

echo "Connection details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Try using psql if available
if command -v psql &> /dev/null; then
    echo "Using psql to execute migration..."
    echo ""

    if psql "$DATABASE_URL" < "$MIGRATION_FILE"; then
        echo ""
        echo -e "${GREEN}✅ Migration completed successfully!${NC}"
        echo ""

        # Verify
        echo "Verifying table creation..."
        psql "$DATABASE_URL" -c "\d payment_orders"

        echo ""
        echo -e "${GREEN}================================================${NC}"
        echo -e "${GREEN}  Migration completed successfully! 🎉${NC}"
        echo -e "${GREEN}================================================${NC}"
        exit 0
    else
        echo -e "${RED}❌ Migration failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  psql not found${NC}"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  brew install postgresql@15"
    echo ""
    echo "Or run migration manually:"
    echo "  psql \$DATABASE_URL < $MIGRATION_FILE"
    echo ""
    exit 1
fi
