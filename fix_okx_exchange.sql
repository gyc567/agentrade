-- 修复OKX交易所缺失问题
-- 执行时机：在Replit控制台运行
-- 用途：向config.db中插入缺失的OKX交易所配置

-- 插入OKX交易所（如果不存在）
INSERT OR IGNORE INTO exchanges (id, user_id, name, type, enabled)
VALUES ('okx', 'default', 'OKX Futures', 'okx', 0);

-- 验证插入结果
SELECT 'OKX插入结果:' as info;
SELECT id, name, type, enabled FROM exchanges
WHERE user_id = 'default' AND id = 'okx';

-- 显示所有支持的交易所
SELECT '所有支持的交易所:' as info;
SELECT id, name, type FROM exchanges
WHERE user_id = 'default'
ORDER BY id;
