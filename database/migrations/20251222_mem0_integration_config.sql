-- Mem0记忆集成配置 (v2.0生产级方案)
-- 创建时间: 2025-12-22
-- 描述: 添加Mem0长期记忆系统所需的所有配置项

-- 插入Mem0配置项到system_config表
INSERT INTO system_config (key, value) VALUES
    -- 1. 核心开关
    ('mem0_enabled', 'false'),  -- 默认关闭,待灰度启用

    -- 2. API认证信息
    ('mem0_api_key', 'm0-pPQAtopvF6u9BqUSgJmELhigDoXjGJo8Yx13prCr'),
    ('mem0_api_url', 'https://api.mem0.ai/v1'),

    -- 3. 用户身份标识
    ('mem0_user_id', ''),  -- 待填充: 在Mem0中的用户ID
    ('mem0_organization_id', ''),  -- 待填充: 在Mem0中的组织ID

    -- 4. AI模型配置
    ('mem0_model', 'gpt-4'),  -- 默认使用GPT-4作为理解模型
    ('mem0_temperature', '0.7'),  -- LLM温度参数(0.0-1.0)
    ('mem0_max_tokens', '2000'),  -- 单次LLM调用的最大tokens

    -- 5. 记忆存储参数
    ('mem0_memory_limit', '8000'),  -- 记忆内存上限(tokens)
    ('mem0_vector_dim', '1536'),  -- 向量维度(OpenAI text-embedding-3-small)
    ('mem0_similarity_threshold', '0.6'),  -- 相似度阈值(0.0-1.0)

    -- 6. 缓存和预热
    ('mem0_cache_ttl_minutes', '30'),  -- 缓存过期时间(分钟)
    ('mem0_warmup_interval_minutes', '5'),  -- 预热间隔(分钟)
    ('mem0_warmup_enabled', 'true'),  -- 是否启用CacheWarmer预热

    -- 7. 断路器配置
    ('mem0_circuit_breaker_enabled', 'true'),  -- 是否启用自动断路器
    ('mem0_circuit_breaker_threshold', '3'),  -- 失败次数阈值
    ('mem0_circuit_breaker_timeout_seconds', '300'),  -- 断路器打开后的恢复尝试间隔(5分钟)

    -- 8. 压缩和过滤
    ('mem0_context_compression_enabled', 'true'),  -- 是否启用上下文压缩
    ('mem0_max_prompt_tokens', '2500'),  -- 压缩后的最大prompt tokens
    ('mem0_quality_filter_enabled', 'true'),  -- 是否启用质量过滤
    ('mem0_quality_score_threshold', '0.3'),  -- 质量评分阈值(低于此值不保存)

    -- 9. 反思和学习
    ('mem0_reflection_enabled', 'true'),  -- 是否启用反思系统
    ('mem0_reflection_status_tracking', 'true'),  -- 是否启用反思状态机
    ('mem0_evaluation_delay_days', '3'),  -- 反思评估延迟(天)

    -- 10. 监控和指标
    ('mem0_metrics_enabled', 'true'),  -- 是否启用监控收集
    ('mem0_metrics_interval_minutes', '1'),  -- 指标收集间隔(分钟)
    ('mem0_verbose_logging', 'true'),  -- 是否启用详细日志

    -- 11. 灰度发布
    ('mem0_rollout_percentage', '0'),  -- 灰度发布百分比(0-100%)
    ('mem0_auto_rollback_enabled', 'true'),  -- 是否启用自动回滚
    ('mem0_error_rate_threshold', '5.0'),  -- 自动回滚的错误率阈值(%)
    ('mem0_latency_threshold_ms', '2000'),  -- 自动回滚的延迟阈值(毫秒)

    -- 12. A/B测试
    ('mem0_ab_test_enabled', 'false'),  -- 是否启用A/B测试
    ('mem0_ab_test_control_percentage', '50'),  -- 对照组百分比
    ('mem0_ab_test_duration_days', '7')  -- A/B测试持续时间(天)

ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- 验证迁移完整性
DO $$
DECLARE
    config_count INTEGER;
    missing_configs TEXT;
BEGIN
    -- 统计Mem0配置项数量
    SELECT COUNT(*) INTO config_count
    FROM system_config
    WHERE key LIKE 'mem0_%';

    -- 验证关键配置项是否存在
    SELECT STRING_AGG(key, ', ') INTO missing_configs
    FROM (
        VALUES
            ('mem0_enabled'),
            ('mem0_api_key'),
            ('mem0_api_url'),
            ('mem0_model'),
            ('mem0_cache_ttl_minutes'),
            ('mem0_circuit_breaker_enabled'),
            ('mem0_rollout_percentage')
    ) AS required_keys(key)
    WHERE key NOT IN (SELECT key FROM system_config);

    IF missing_configs IS NOT NULL THEN
        RAISE EXCEPTION '❌ 关键Mem0配置项缺失: %', missing_configs;
    END IF;

    -- 日志输出
    RAISE NOTICE '✅ Mem0配置集成完成';
    RAISE NOTICE '   - 总配置项数: %', config_count;
    RAISE NOTICE '   - API密钥已设置';
    RAISE NOTICE '   - 默认状态: 禁用 (mem0_enabled=false)';
    RAISE NOTICE '   - 灰度百分比: 0%% (mem0_rollout_percentage=0)';
    RAISE NOTICE '   - 待手动配置: mem0_user_id, mem0_organization_id';
    RAISE NOTICE '   - 建议: Phase 2.1验收通过后启用';
END $$;

-- 创建索引加速查询 (可选,system_config通常配置项少)
-- CREATE INDEX idx_system_config_key_pattern ON system_config(key) WHERE key LIKE 'mem0_%';

-- 添加注释 (PostgreSQL 特性)
COMMENT ON TABLE system_config IS '系统配置表 - 全局运行时配置存储';
COMMENT ON COLUMN system_config.key IS '配置键 - 唯一标识符,使用下划线分隔命名空间 (如: mem0_api_key)';
COMMENT ON COLUMN system_config.value IS '配置值 - TEXT格式,包含数字/JSON/字符串等,由应用层负责类型转换';
COMMENT ON COLUMN system_config.updated_at IS '最后修改时间 - 自动追踪,便于审计';
