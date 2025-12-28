# Crossmint Payment Migration Guide

## Quick Start

### 1. Set Database URL

```bash
export DATABASE_URL="postgresql://username:password@host:port/database_name"
```

**Example**:
```bash
export DATABASE_URL="postgresql://nofx_user:mypassword@localhost:5432/nofx"
```

### 2. Run Migration

```bash
cd /Users/eric/dreame/code/nofx
./scripts/migrate_crossmint_payment.sh
```

### 3. Verify

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payment_orders;"
```

Expected output: `0` (empty table, ready for use)

---

## Detailed Instructions

### Step 1: Check Current Database

Before migration, verify your database connection:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT version();"

# List existing tables
psql $DATABASE_URL -c "\dt"

# Check if payment_orders already exists
psql $DATABASE_URL -c "\d payment_orders" 2>/dev/null && echo "Table exists!" || echo "Table not found (this is expected)"
```

### Step 2: Backup (Recommended for Production)

```bash
# Backup entire database
pg_dump $DATABASE_URL > backup_before_crossmint_$(date +%Y%m%d_%H%M%S).sql

# Or backup just structure
pg_dump $DATABASE_URL --schema-only > schema_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 3: Apply Migration

```bash
./scripts/migrate_crossmint_payment.sh
```

**Interactive prompts:**
1. Shows what will be created
2. Press ENTER to continue
3. Verifies table creation
4. Shows table structure

**Expected output:**
```
================================================
  Crossmint Payment Database Migration
================================================

✓ DATABASE_URL is set
  URL: postgresql://user@***

✓ Migration file found
  Path: /path/to/001_create_tables.sql

⚠️  This will create the following table:
  - payment_orders

Press ENTER to continue, or Ctrl+C to cancel...

Applying migration...

✅ Migration applied successfully!
✓ payment_orders table created

Table structure:
                  Table "public.payment_orders"
        Column         |           Type           | Nullable
-----------------------+--------------------------+----------
 id                    | text                     | not null
 crossmint_order_id    | text                     |
 user_id               | text                     | not null
 package_id            | text                     | not null
 amount                | numeric(10,2)            | not null
 currency              | text                     | not null
 credits               | integer                  | not null
 status                | text                     | not null
 payment_method        | text                     |
 crossmint_client_secret | text                   |
 webhook_received_at   | timestamp with time zone |
 completed_at          | timestamp with time zone |
 failed_reason         | text                     |
 metadata              | jsonb                    |
 created_at            | timestamp with time zone |
 updated_at            | timestamp with time zone |
Indexes:
    "payment_orders_pkey" PRIMARY KEY, btree (id)
    "payment_orders_crossmint_order_id_key" UNIQUE CONSTRAINT, btree (crossmint_order_id)
    "idx_payment_orders_created_at" btree (created_at DESC)
    "idx_payment_orders_crossmint_order_id" btree (crossmint_order_id)
    "idx_payment_orders_status" btree (status)
    "idx_payment_orders_user_id" btree (user_id)
    "idx_payment_orders_user_status" btree (user_id, status)

================================================
  Migration completed successfully! 🎉
================================================

Next steps:
  1. Update environment variables:
     - CROSSMINT_SERVER_API_KEY
     - CROSSMINT_WEBHOOK_SECRET
  2. Run tests: go test ./api/payment/... -v
  3. Restart the application
```

### Step 4: Post-Migration Verification

```bash
# Verify table exists
psql $DATABASE_URL -c "\d payment_orders"

# Check indexes
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'payment_orders';"

# Verify foreign keys
psql $DATABASE_URL -c "SELECT conname, confrelid::regclass FROM pg_constraint WHERE conrelid = 'payment_orders'::regclass;"

# Check triggers
psql $DATABASE_URL -c "SELECT tgname FROM pg_trigger WHERE tgrelid = 'payment_orders'::regclass;"
```

### Step 5: Update Environment Variables

Add to your `.env` file:

```bash
# Crossmint Payment Configuration
CROSSMINT_SERVER_API_KEY=sk_staging_your_key_here
CROSSMINT_WEBHOOK_SECRET=whsec_your_secret_here
CROSSMINT_ENVIRONMENT=staging
```

### Step 6: Restart Application

```bash
# If using systemd
sudo systemctl restart nofx-api

# If using PM2
pm2 restart nofx-api

# If running manually
pkill -f nofx-api
./nofx-api
```

---

## Rollback Instructions

### When to Rollback

- Migration failed partially
- Need to revert changes
- Found critical bug in production

### Rollback Process

```bash
./scripts/rollback_crossmint_payment.sh
```

**Interactive confirmation:**
- Shows what will be deleted
- Requires typing `YES` to proceed

**Example:**
```
================================================
  Crossmint Payment Database Rollback
================================================

✓ DATABASE_URL is set
✓ Rollback file found

⚠️  WARNING: This will DELETE the following:
  - payment_orders table
  - All payment order records (0 records)
  - All indexes and triggers

This action CANNOT be undone!

Type 'YES' to confirm rollback, or anything else to cancel:
YES

Rolling back migration...

✅ Rollback completed successfully!
✓ payment_orders table removed

================================================
  Rollback completed successfully! ✓
================================================

To re-apply the migration:
  ./scripts/migrate_crossmint_payment.sh
```

---

## Manual Migration (Alternative)

If you prefer to run SQL directly without the script:

### Apply

```bash
psql $DATABASE_URL < database/migrations/20251228_crossmint_payment/001_create_tables.sql
```

### Rollback

```bash
psql $DATABASE_URL < database/migrations/20251228_crossmint_payment/002_rollback.sql
```

---

## Troubleshooting

### Error: "DATABASE_URL is not set"

**Solution:**
```bash
export DATABASE_URL="postgresql://user:pass@host:port/dbname"
```

Make it permanent (add to `~/.bashrc` or `~/.zshrc`):
```bash
echo 'export DATABASE_URL="postgresql://user:pass@host:port/dbname"' >> ~/.bashrc
source ~/.bashrc
```

### Error: "Migration file not found"

**Solution:**
```bash
# Run from project root
cd /Users/eric/dreame/code/nofx
./scripts/migrate_crossmint_payment.sh

# Or use absolute path
/Users/eric/dreame/code/nofx/scripts/migrate_crossmint_payment.sh
```

### Error: "relation already exists"

**Cause:** Table already exists in database

**Solution 1 - Skip migration:**
```bash
echo "Table already exists, skipping migration"
```

**Solution 2 - Rollback and reapply:**
```bash
./scripts/rollback_crossmint_payment.sh
./scripts/migrate_crossmint_payment.sh
```

### Error: "permission denied for table"

**Cause:** Database user lacks permissions

**Solution:**
```bash
# Grant permissions to user
psql $DATABASE_URL -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;"
psql $DATABASE_URL -c "GRANT CREATE ON SCHEMA public TO your_username;"
```

### Error: "connection refused"

**Causes & Solutions:**

1. **Database not running:**
   ```bash
   # Check if PostgreSQL is running
   pg_isready -h localhost -p 5432
   
   # Start PostgreSQL (macOS)
   brew services start postgresql
   
   # Start PostgreSQL (Linux)
   sudo systemctl start postgresql
   ```

2. **Wrong host/port:**
   ```bash
   # Verify DATABASE_URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:port/dbname
   ```

3. **Firewall blocking:**
   ```bash
   # Check if port is open
   telnet localhost 5432
   ```

### Error: "password authentication failed"

**Solution:**
```bash
# Reset password in PostgreSQL
psql postgres -c "ALTER USER your_username WITH PASSWORD 'new_password';"

# Update DATABASE_URL
export DATABASE_URL="postgresql://your_username:new_password@host:port/dbname"
```

---

## Testing

### Run Tests After Migration

```bash
# Test database layer
go test ./config/... -run Payment -v

# Test service layer
go test ./service/payment/... -v

# Test API handlers
go test ./api/payment/... -v

# Run all payment tests
go test ./... -run Payment -v

# Check coverage
go test ./api/payment/... -cover
# Expected: coverage: 100.0% of statements
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8080/api/health

# Create test order (requires auth token)
curl -X POST http://localhost:8080/api/payments/crossmint/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"packageId": "pkg_starter"}'

# Check database has record
psql $DATABASE_URL -c "SELECT COUNT(*) FROM payment_orders;"
```

---

## Production Deployment Checklist

- [ ] Backup production database
- [ ] Test migration on staging first
- [ ] Verify all tests pass
- [ ] Schedule maintenance window
- [ ] Set production environment variables
- [ ] Apply migration to production
- [ ] Verify table creation
- [ ] Run smoke tests
- [ ] Monitor logs for errors
- [ ] Update monitoring dashboards
- [ ] Notify team of completion

---

## Useful Commands

```bash
# View all payment orders
psql $DATABASE_URL -c "SELECT * FROM payment_orders ORDER BY created_at DESC LIMIT 10;"

# Count orders by status
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM payment_orders GROUP BY status;"

# Find orders by user
psql $DATABASE_URL -c "SELECT * FROM payment_orders WHERE user_id = 'user_123';"

# Check recent orders
psql $DATABASE_URL -c "SELECT id, user_id, amount, status, created_at FROM payment_orders WHERE created_at > NOW() - INTERVAL '24 hours';"

# View failed orders
psql $DATABASE_URL -c "SELECT id, user_id, failed_reason, created_at FROM payment_orders WHERE status = 'failed';"
```

---

**Last Updated**: 2025-12-28
**Migration Version**: 20251228_crossmint_payment
