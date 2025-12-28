#!/usr/bin/env python3
"""
Crossmint Payment Database Migration Script (Python)
执行数据库迁移的 Python 版本
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

# ANSI 颜色代码
RED = '\033[0;31m'
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
NC = '\033[0m'  # No Color

def main():
    print("=" * 48)
    print("  Crossmint Payment Database Migration")
    print("=" * 48)
    print()

    # 检查 DATABASE_URL
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print(f"{RED}❌ Error: DATABASE_URL environment variable is not set{NC}")
        print()
        print("Please set DATABASE_URL before running this script:")
        print("  export DATABASE_URL='postgresql://user:pass@host:port/dbname'")
        print()
        sys.exit(1)

    print(f"{GREEN}✓ DATABASE_URL is set{NC}")

    # 隐藏密码部分
    parsed = urlparse(database_url)
    safe_url = f"{parsed.scheme}://{parsed.username}:***@{parsed.hostname}"
    if parsed.port:
        safe_url += f":{parsed.port}"
    safe_url += parsed.path
    print(f"  URL: {safe_url}")
    print()

    # 读取迁移文件
    migration_file = 'database/migrations/20251228_crossmint_payment/001_create_tables.sql'
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        print(f"{GREEN}✓ Migration file loaded{NC}")
        print(f"  Path: {migration_file}")
        print()
    except FileNotFoundError:
        print(f"{RED}❌ Error: Migration file not found{NC}")
        print(f"  Expected: {migration_file}")
        print()
        sys.exit(1)

    # 连接数据库
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        print(f"{GREEN}✓ Database connection successful{NC}")
        print()
    except Exception as e:
        print(f"{RED}❌ Error connecting to database: {e}{NC}")
        print()
        sys.exit(1)

    # 执行迁移
    print("Applying migration...")
    print()
    try:
        cursor.execute(migration_sql)
        print(f"{GREEN}✅ Migration applied successfully!{NC}")
        print()
    except Exception as e:
        print(f"{RED}❌ Migration failed: {e}{NC}")
        print()
        conn.close()
        sys.exit(1)

    # 验证表已创建
    try:
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'payment_orders'
            )
        """)
        table_exists = cursor.fetchone()[0]

        if table_exists:
            print(f"{GREEN}✓ payment_orders table created{NC}")
            print()

            # 显示表结构
            print("Table structure:")
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'payment_orders'
                ORDER BY ordinal_position
            """)
            print(f"{'Column':<25} {'Type':<20} {'Nullable'}")
            print("-" * 60)
            for row in cursor.fetchall():
                print(f"{row[0]:<25} {row[1]:<20} {row[2]}")
            print()

            # 显示索引
            print("Indexes created:")
            cursor.execute("""
                SELECT indexname
                FROM pg_indexes
                WHERE tablename = 'payment_orders'
                ORDER BY indexname
            """)
            for row in cursor.fetchall():
                print(f"  - {row[0]}")
            print()

            # 统计记录数
            cursor.execute("SELECT COUNT(*) FROM payment_orders")
            count = cursor.fetchone()[0]
            print(f"Records in table: {count}")
            print()

    except Exception as e:
        print(f"{YELLOW}⚠️  Warning: Could not verify table: {e}{NC}")
        print()

    # 关闭连接
    cursor.close()
    conn.close()

    print("=" * 48)
    print(f"{GREEN}  Migration completed successfully! 🎉{NC}")
    print("=" * 48)
    print()
    print("Next steps:")
    print("  1. Update environment variables:")
    print("     - CROSSMINT_SERVER_API_KEY")
    print("     - CROSSMINT_WEBHOOK_SECRET")
    print("  2. Run tests: go test ./api/payment/... -v")
    print("  3. Restart the application")
    print()

if __name__ == '__main__':
    main()
