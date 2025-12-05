-- ============================================================
-- 积分系统 - 回滚脚本
-- 版本: 2025-12-01
-- 警告: 此操作将删除所有积分相关数据，不可恢复
-- ============================================================

-- ============================================================
-- 1. 删除触发器
-- ============================================================
DROP TRIGGER IF EXISTS update_credit_packages_updated_at ON credit_packages;
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;

-- ============================================================
-- 2. 删除索引
-- ============================================================
DROP INDEX IF EXISTS idx_credit_packages_active;
DROP INDEX IF EXISTS idx_credit_packages_sort;
DROP INDEX IF EXISTS idx_user_credits_user_id;
DROP INDEX IF EXISTS idx_credit_transactions_user_id;
DROP INDEX IF EXISTS idx_credit_transactions_created_at;
DROP INDEX IF EXISTS idx_credit_transactions_category;
DROP INDEX IF EXISTS idx_credit_transactions_user_created;

-- ============================================================
-- 3. 删除表 (按依赖顺序：先删流水，再删账户，最后删套餐)
-- ============================================================
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS credit_packages CASCADE;

-- ============================================================
-- 验证回滚
-- ============================================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('credit_packages', 'user_credits', 'credit_transactions');

    IF table_count != 0 THEN
        RAISE EXCEPTION '回滚失败：仍有%个表存在', table_count;
    END IF;

    RAISE NOTICE '积分系统回滚成功：所有表已删除';
END $$;
