-- 修复OKX交易所缺失问题
-- 在config.db中插入OKX交易所配置

INSERT OR IGNORE INTO exchanges (id, user_id, name, type, enabled) 
VALUES ('okx', 'default', 'OKX Futures', 'okx', 0);

-- 验证插入结果
SELECT id, name, type FROM exchanges WHERE user_id = 'default' ORDER BY id;
