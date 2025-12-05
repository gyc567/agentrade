-- ============================================================
-- 积分系统 - 数据库迁移
-- 版本: 2025-12-01
-- 描述: 创建积分套餐、用户积分账户、积分流水三表
-- ============================================================

-- ============================================================
-- 1. 积分套餐配置表 (credit_packages)
-- 存储系统提供的积分套餐配置
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    description TEXT,
    price_usdt DECIMAL(10,2) NOT NULL,
    credits INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_recommended BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_price_positive CHECK (price_usdt > 0),
    CONSTRAINT chk_credits_positive CHECK (credits > 0),
    CONSTRAINT chk_bonus_non_negative CHECK (bonus_credits >= 0)
);

-- ============================================================
-- 2. 用户积分账户表 (user_credits)
-- 每个用户一条记录，维护积分余额
-- ============================================================
CREATE TABLE IF NOT EXISTS user_credits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    available_credits INTEGER DEFAULT 0,
    total_credits INTEGER DEFAULT 0,
    used_credits INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_available_non_negative CHECK (available_credits >= 0),
    CONSTRAINT chk_total_non_negative CHECK (total_credits >= 0),
    CONSTRAINT chk_used_non_negative CHECK (used_credits >= 0),
    CONSTRAINT chk_credits_consistency CHECK (available_credits = total_credits - used_credits)
);

-- ============================================================
-- 3. 积分流水表 (credit_transactions)
-- 记录所有积分变动，支持审计追溯
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_type CHECK (type IN ('credit', 'debit')),
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_balance_before_non_negative CHECK (balance_before >= 0),
    CONSTRAINT chk_balance_after_non_negative CHECK (balance_after >= 0),
    CONSTRAINT chk_category CHECK (category IN ('purchase', 'consume', 'gift', 'refund', 'admin')),
    CONSTRAINT chk_balance_transition CHECK (
        (type = 'credit' AND balance_after = balance_before + amount) OR
        (type = 'debit' AND balance_after = balance_before - amount)
    )
);

-- ============================================================
-- 索引
-- ============================================================

-- credit_packages 索引
CREATE INDEX IF NOT EXISTS idx_credit_packages_active
    ON credit_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_packages_sort
    ON credit_packages(sort_order, id);

-- user_credits 索引
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id
    ON user_credits(user_id);

-- credit_transactions 索引
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
    ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
    ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_category
    ON credit_transactions(category);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
    ON credit_transactions(user_id, created_at DESC);

-- ============================================================
-- 触发器 (复用现有 update_updated_at_column 函数)
-- ============================================================
DROP TRIGGER IF EXISTS update_credit_packages_updated_at ON credit_packages;
CREATE TRIGGER update_credit_packages_updated_at
    BEFORE UPDATE ON credit_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 默认套餐数据
-- ============================================================
INSERT INTO credit_packages (id, name, name_en, description, price_usdt, credits, bonus_credits, is_active, is_recommended, sort_order)
VALUES
    ('pkg_starter', '入门套餐', 'Starter', '适合新用户体验', 5.00, 200, 0, TRUE, FALSE, 1),
    ('pkg_standard', '标准套餐', 'Standard', '最受欢迎的选择', 10.00, 500, 0, TRUE, TRUE, 2),
    ('pkg_premium', '高级套餐', 'Premium', '更高性价比', 20.00, 1200, 0, TRUE, FALSE, 3),
    ('pkg_pro', '专业套餐', 'Pro', '专业用户首选', 50.00, 3500, 0, TRUE, FALSE, 4)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    description = EXCLUDED.description,
    price_usdt = EXCLUDED.price_usdt,
    credits = EXCLUDED.credits,
    bonus_credits = EXCLUDED.bonus_credits,
    is_active = EXCLUDED.is_active,
    is_recommended = EXCLUDED.is_recommended,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

-- ============================================================
-- 验证迁移
-- ============================================================
DO $$
DECLARE
    table_count INTEGER;
    package_count INTEGER;
BEGIN
    -- 验证表是否存在
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('credit_packages', 'user_credits', 'credit_transactions');

    IF table_count != 3 THEN
        RAISE EXCEPTION '迁移失败：预期3个表，实际创建了%个表', table_count;
    END IF;

    -- 验证默认套餐数据
    SELECT COUNT(*) INTO package_count FROM credit_packages;
    IF package_count < 4 THEN
        RAISE EXCEPTION '迁移失败：默认套餐数据插入不完整，预期4条，实际%条', package_count;
    END IF;

    RAISE NOTICE '积分系统迁移成功：3个表已创建，%个默认套餐已插入', package_count;
END $$;
