-- ============================================================
-- 迁移脚本：Gemini AI模型配置集成
-- ============================================================
-- 创建日期: 2025-12-23
-- 描述: 添加Google Gemini AI模型所需的所有配置项到system_config表
-- 状态: 生产级方案
-- 优先级: P1
-- 依赖: system_config表已存在

-- 插入Gemini配置项到system_config表
INSERT INTO system_config (key, value) VALUES
    -- ========== 1. 核心开关 ==========
    ('gemini_enabled', 'false'),  -- 默认关闭，待灰度启用

    -- ========== 2. API认证信息 ==========
    ('gemini_api_key', ''),  -- 从环境变量GEMINI_API_KEY注入，不在Git中存储
    ('gemini_api_url', 'https://gemini-proxy-iota-weld.vercel.app'),  -- Vercel代理服务
    ('gemini_api_version', 'v1beta'),  -- Google Gemini API版本

    -- ========== 3. 模型配置 ==========
    ('gemini_model', 'gemini-3-flash-preview'),  -- 使用Flash模型以获得最佳性能
    ('gemini_temperature', '0.7'),  -- LLM温度参数(0.0-1.0)，控制输出随机性
    ('gemini_max_tokens', '2000'),  -- 单次API调用的最大输出令牌数

    -- ========== 4. 高级采样参数 ==========
    ('gemini_top_p', '0.95'),  -- Nucleus采样参数(0.0-1.0)，控制词汇多样性
    ('gemini_top_k', '40'),  -- Top-K采样，仅从概率最高的K个候选中选择

    -- ========== 5. 缓存和性能优化 ==========
    ('gemini_cache_enabled', 'true'),  -- 是否启用响应缓存
    ('gemini_cache_ttl_minutes', '30'),  -- 缓存过期时间(分钟)

    -- ========== 6. 容错和断路器 ==========
    ('gemini_circuit_breaker_enabled', 'true'),  -- 是否启用自动断路器
    ('gemini_circuit_breaker_threshold', '3'),  -- 失败次数阈值
    ('gemini_circuit_breaker_timeout_seconds', '300'),  -- 断路器打开后的恢复尝试间隔(秒)

    -- ========== 7. 监控和日志 ==========
    ('gemini_metrics_enabled', 'true'),  -- 是否启用性能指标收集
    ('gemini_verbose_logging', 'false'),  -- 是否启用详细日志（测试环境可打开）
    ('gemini_log_requests', 'false'),  -- 是否记录API请求和响应（谨慎：可能包含敏感信息）

    -- ========== 8. 灰度发布策略 ==========
    ('gemini_rollout_percentage', '0'),  -- 灰度发布百分比(0-100%)，0表示禁用
    ('gemini_auto_fallback_enabled', 'true'),  -- Gemini失败时自动降级到Mem0
    ('gemini_error_rate_threshold', '5.0'),  -- 自动降级的错误率阈值(%)

    -- ========== 9. 超时配置 ==========
    ('gemini_timeout_seconds', '30'),  -- 单次API调用超时(秒)
    ('gemini_connect_timeout_seconds', '10'),  -- 连接建立超时(秒)

    -- ========== 10. 重试策略 ==========
    ('gemini_retry_enabled', 'true'),  -- 是否启用自动重试
    ('gemini_retry_max_attempts', '3'),  -- 最大重试次数
    ('gemini_retry_backoff_ms', '500')  -- 重试间隔(毫秒)，使用指数退避

ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- 验证迁移完整性
-- ============================================================

DO $$
DECLARE
    config_count INTEGER;
    missing_configs TEXT;
    config_errors TEXT;
BEGIN
    -- Step 1: 统计Gemini配置项数量
    SELECT COUNT(*) INTO config_count
    FROM system_config
    WHERE key LIKE 'gemini_%';

    -- Step 2: 验证关键配置项是否存在
    SELECT STRING_AGG(key, ', ') INTO missing_configs
    FROM (
        VALUES
            ('gemini_enabled'),
            ('gemini_api_key'),
            ('gemini_api_url'),
            ('gemini_api_version'),
            ('gemini_model'),
            ('gemini_temperature'),
            ('gemini_max_tokens'),
            ('gemini_cache_enabled'),
            ('gemini_circuit_breaker_enabled'),
            ('gemini_metrics_enabled')
    ) AS required_keys(key)
    WHERE key NOT IN (SELECT key FROM system_config);

    -- Step 3: 验证配置值的有效性
    IF (SELECT value FROM system_config WHERE key = 'gemini_temperature')::FLOAT NOT BETWEEN 0 AND 1 THEN
        config_errors := 'gemini_temperature 必须在 0-1 之间';
    END IF;

    -- Step 4: 错误处理和输出
    IF missing_configs IS NOT NULL THEN
        RAISE WARNING '⚠️ 关键Gemini配置项缺失: %', missing_configs;
    END IF;

    IF config_errors IS NOT NULL THEN
        RAISE WARNING '⚠️ 配置值无效: %', config_errors;
    END IF;

    -- Step 5: 成功日志输出
    IF missing_configs IS NULL AND config_errors IS NULL THEN
        RAISE NOTICE '✅ Gemini配置集成完成 - 迁移成功';
        RAISE NOTICE '   ├─ 总配置项数: % 项', config_count;
        RAISE NOTICE '   ├─ API URL: %', (SELECT value FROM system_config WHERE key = 'gemini_api_url');
        RAISE NOTICE '   ├─ 模型: %', (SELECT value FROM system_config WHERE key = 'gemini_model');
        RAISE NOTICE '   ├─ 启用状态: %', (SELECT value FROM system_config WHERE key = 'gemini_enabled');
        RAISE NOTICE '   ├─ 缓存: %', (SELECT value FROM system_config WHERE key = 'gemini_cache_enabled');
        RAISE NOTICE '   └─ 断路器: %', (SELECT value FROM system_config WHERE key = 'gemini_circuit_breaker_enabled');
        RAISE NOTICE '';
        RAISE NOTICE '📌 重要提示:';
        RAISE NOTICE '   1. gemini_api_key 必须从环境变量 GEMINI_API_KEY 注入';
        RAISE NOTICE '   2. 当前配置中 gemini_enabled = false，需手动启用灰度测试';
        RAISE NOTICE '   3. 推荐从 gemini_rollout_percentage = 0 开始，逐步增加到 100';
        RAISE NOTICE '   4. Vercel代理URL用于测试，生产建议使用官方Google API';
    END IF;

    -- Step 6: 验证与其他AI模型配置的一致性
    RAISE NOTICE '';
    RAISE NOTICE '🔄 AI模型配置对比:';
    RAISE NOTICE '   Mem0配置项数: % 项', (SELECT COUNT(*) FROM system_config WHERE key LIKE 'mem0_%');
    RAISE NOTICE '   Gemini配置项数: % 项', config_count;
    RAISE NOTICE '   DeepSeek配置项数: % 项', (SELECT COUNT(*) FROM system_config WHERE key LIKE 'deepseek_%');

END $$;

-- ============================================================
-- 显示迁移完成后的配置状态
-- ============================================================

-- 显示所有Gemini配置项
SELECT '📋 Gemini配置项摘要:' as "Configuration Summary";
SELECT
    key,
    value,
    CASE
        WHEN key LIKE '%key%' OR key LIKE '%secret%' THEN '🔐 (SENSITIVE)'
        WHEN value = 'true' OR value = 'false' THEN '✓ ' || value
        ELSE value
    END AS display_value,
    TO_CHAR(updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
FROM system_config
WHERE key LIKE 'gemini_%'
ORDER BY key;

-- 显示迁移统计
SELECT '📊 迁移统计' as "Migration Summary";
SELECT
    'Gemini配置项' as type,
    COUNT(*) as count
FROM system_config
WHERE key LIKE 'gemini_%'
UNION ALL
SELECT
    'Mem0配置项',
    COUNT(*)
FROM system_config
WHERE key LIKE 'mem0_%'
UNION ALL
SELECT
    'DeepSeek配置项',
    COUNT(*)
FROM system_config
WHERE key LIKE 'deepseek_%'
UNION ALL
SELECT
    '全部system_config',
    COUNT(*)
FROM system_config;
