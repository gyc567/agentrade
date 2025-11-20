-- OKX配置更新脚本
-- 使用前请替换 YOUR_API_KEY, YOUR_SECRET_KEY, YOUR_PASSPHRASE 为真实值

-- 查看当前OKX配置
SELECT id, user_id, name, enabled, api_key, secret_key, okx_passphrase
FROM exchanges
WHERE id = 'okx';

-- 更新admin用户的OKX配置（替换下面的值）
UPDATE exchanges
SET
  api_key = 'YOUR_API_KEY',
  secret_key = 'YOUR_SECRET_KEY',
  okx_passphrase = 'YOUR_PASSPHRASE',
  enabled = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'okx' AND user_id = 'admin';

-- 验证更新结果
SELECT id, user_id, name, enabled, api_key, secret_key, okx_passphrase
FROM exchanges
WHERE id = 'okx';
