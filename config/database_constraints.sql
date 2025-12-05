-- 数据库约束添加脚本
-- 为积分交易系统添加唯一约束，确保数据完整性

-- 1. 为 credit_transactions 表的 reference_id 添加唯一约束
-- 防止重复的交易流水记录
ALTER TABLE credit_transactions
ADD CONSTRAINT uk_credit_transactions_reference_id UNIQUE (reference_id);

-- 2. 为 user_credits 表的 user_id 添加唯一约束
-- 确保每个用户只有一个积分账户
ALTER TABLE user_credits
ADD CONSTRAINT uk_user_credits_user_id UNIQUE (user_id);

-- 3. 为 credit_compensation_tasks 表的 trade_id 添加唯一约束
-- 防止对同一交易创建多个补偿任务
ALTER TABLE credit_compensation_tasks
ADD CONSTRAINT uk_compensation_tasks_trade_id UNIQUE (trade_id);

-- 4. 为 credit_packages 表的名称添加唯一约束
-- 确保套餐名称唯一
ALTER TABLE credit_packages
ADD CONSTRAINT uk_credit_packages_name UNIQUE (name);

-- 5. 为 credit_reservations 表的 trade_id 添加唯一约束
-- 防止重复预留
ALTER TABLE credit_reservations
ADD CONSTRAINT uk_credit_reservations_trade_id UNIQUE (trade_id);

-- 6. 添加检查约束，确保积分数值合理
ALTER TABLE user_credits
ADD CONSTRAINT ck_user_credits_available_non_negative CHECK (available_credits >= 0),
ADD CONSTRAINT ck_user_credits_used_non_negative CHECK (used_credits >= 0),
ADD CONSTRAINT ck_user_credits_total_non_negative CHECK (total_credits >= 0);

-- 7. 为 credit_transactions 表添加检查约束
ALTER TABLE credit_transactions
ADD CONSTRAINT ck_credit_transactions_amount_positive CHECK (amount > 0),
ADD CONSTRAINT ck_credit_transactions_balance_non_negative CHECK (balance_after >= 0);

-- 8. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_category ON credit_transactions(category);

CREATE INDEX IF NOT EXISTS idx_credit_compensation_tasks_user_id ON credit_compensation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_compensation_tasks_status ON credit_compensation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_credit_compensation_tasks_created_at ON credit_compensation_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_credit_reservations_user_id ON credit_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_created_at ON credit_reservations(created_at);

-- 9. 添加外键约束（如果相关表存在）
-- 注意：需要先确保引用的表存在，否则需要先创建相关表

-- 添加注释
COMMENT ON CONSTRAINT uk_credit_transactions_reference_id ON credit_transactions IS '确保交易流水号唯一，防止重复扣减';
COMMENT ON CONSTRAINT uk_user_credits_user_id ON user_credits IS '确保每个用户只有一个积分账户';
COMMENT ON CONSTRAINT uk_compensation_tasks_trade_id ON credit_compensation_tasks IS '防止对同一交易创建多个补偿任务';
COMMENT ON CONSTRAINT uk_credit_packages_name ON credit_packages IS '确保套餐名称唯一';
COMMENT ON CONSTRAINT uk_credit_reservations_trade_id ON credit_reservations IS '防止重复预留积分';

-- 打印完成信息
SELECT '数据库约束添加完成！' AS message;