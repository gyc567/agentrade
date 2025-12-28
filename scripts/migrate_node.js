#!/usr/bin/env node
/**
 * Crossmint Payment Database Migration (Node.js)
 * 使用 Node.js 执行数据库迁移
 */

const fs = require('fs');
const { Client } = require('pg');

// ANSI colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function main() {
  console.log('='.repeat(48));
  console.log('  Crossmint Payment Database Migration');
  console.log('='.repeat(48));
  console.log('');

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(`${colors.red}❌ Error: DATABASE_URL environment variable is not set${colors.reset}`);
    console.log('');
    console.log('Please set DATABASE_URL:');
    console.log("  export DATABASE_URL='postgresql://user:pass@host:port/dbname'");
    console.log('');
    process.exit(1);
  }

  console.log(`${colors.green}✓ DATABASE_URL is set${colors.reset}`);

  // Hide password
  const safeUrl = databaseUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
  console.log(`  URL: ${safeUrl}`);
  console.log('');

  // Read migration file
  const migrationFile = 'database/migrations/20251228_crossmint_payment/001_create_tables.sql';

  let migrationSQL;
  try {
    migrationSQL = fs.readFileSync(migrationFile, 'utf8');
    console.log(`${colors.green}✓ Migration file loaded${colors.reset}`);
    console.log(`  Path: ${migrationFile}`);
    console.log('');
  } catch (error) {
    console.log(`${colors.red}❌ Error reading migration file: ${error.message}${colors.reset}`);
    console.log(`  Expected: ${migrationFile}`);
    console.log('');
    process.exit(1);
  }

  // Connect to database
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log(`${colors.green}✓ Database connection successful${colors.reset}`);
    console.log('');

    console.log('Applying migration...');
    console.log('');

    // Execute migration
    await client.query(migrationSQL);
    console.log(`${colors.green}✅ Migration applied successfully!${colors.reset}`);
    console.log('');

    // Verify table was created
    const verifyResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'payment_orders'
      ) as exists
    `);

    if (verifyResult.rows[0].exists) {
      console.log(`${colors.green}✓ payment_orders table created${colors.reset}`);
      console.log('');

      // Show table structure
      console.log('Table structure:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'payment_orders'
        ORDER BY ordinal_position
      `);

      console.log(`${'Column'.padEnd(25)} ${'Type'.padEnd(20)} Nullable`);
      console.log('-'.repeat(60));
      columnsResult.rows.forEach(row => {
        console.log(
          `${row.column_name.padEnd(25)} ${row.data_type.padEnd(20)} ${row.is_nullable}`
        );
      });
      console.log('');

      // Show indexes
      console.log('Indexes created:');
      const indexesResult = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'payment_orders'
        ORDER BY indexname
      `);

      indexesResult.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
      console.log('');

      // Count records
      const countResult = await client.query('SELECT COUNT(*) as count FROM payment_orders');
      console.log(`Records in table: ${countResult.rows[0].count}`);
      console.log('');
    }

  } catch (error) {
    console.log(`${colors.red}❌ Migration failed: ${error.message}${colors.reset}`);
    console.log('');
    if (error.stack) {
      console.log('Error details:');
      console.log(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }

  console.log('='.repeat(48));
  console.log(`${colors.green}  Migration completed successfully! 🎉${colors.reset}`);
  console.log('='.repeat(48));
  console.log('');
  console.log('Next steps:');
  console.log('  1. Update environment variables:');
  console.log('     - CROSSMINT_SERVER_API_KEY');
  console.log('     - CROSSMINT_WEBHOOK_SECRET');
  console.log('  2. Run tests: go test ./api/payment/... -v');
  console.log('  3. Restart the application');
  console.log('');
}

main().catch(console.error);
