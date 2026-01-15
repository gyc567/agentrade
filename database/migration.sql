-- ============================================================
-- Agentrade - 完整数据库迁移脚本
-- 版本: 1.0.0
-- 创建日期: 2025-12-28
-- 兼容性: PostgreSQL 12+
-- ============================================================
-- 此脚本包含所有必要的表、约束、索引和初始数据
-- 执行前请备份现有数据

-- ============================================================
-- Part 1: 基础表结构
-- ============================================================

-- 1.1 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    otp_secret TEXT,
    otp_verified BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMPTZ,
    failed_attempts INTEGER DEFAULT 0,
    last_failed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    beta_code TEXT,
    invite_code TEXT UNIQUE,
    invited_by_user_id TEXT REFERENCES users(id),
    invitation_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 创建AI模型配置表
CREATE TABLE IF NOT EXISTS ai_models (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    api_key TEXT DEFAULT '',
    custom_api_url TEXT DEFAULT '',
    custom_model_name TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1.3 创建交易所配置表
CREATE TABLE IF NOT EXISTS exchanges (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    api_key TEXT DEFAULT '',
    secret_key TEXT DEFAULT '',
    testnet BOOLEAN DEFAULT FALSE,
    hyperliquid_wallet_addr TEXT DEFAULT '',
    aster_user TEXT DEFAULT '',
    aster_signer TEXT DEFAULT '',
    aster_private_key TEXT DEFAULT '',
    okx_passphrase TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1.4 创建交易员配置表
CREATE TABLE IF NOT EXISTS traders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    ai_model_id TEXT NOT NULL,
    exchange_id TEXT NOT NULL,
    initial_balance REAL NOT NULL,
    scan_interval_minutes INTEGER DEFAULT 3,
    is_running BOOLEAN DEFAULT FALSE,
    btc_eth_leverage INTEGER DEFAULT 5,
    altcoin_leverage INTEGER DEFAULT 5,
    trading_symbols TEXT DEFAULT '',
    use_coin_pool BOOLEAN DEFAULT FALSE,
    use_oi_top BOOLEAN DEFAULT FALSE,
    custom_prompt TEXT DEFAULT '',
    override_base_prompt BOOLEAN DEFAULT FALSE,
    system_prompt_template TEXT DEFAULT 'default',
    is_cross_margin BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1.5 创建用户信号源配置表
CREATE TABLE IF NOT EXISTS user_signal_sources (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    coin_pool_url TEXT DEFAULT '',
    oi_top_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1.6 创建密码重置令牌表
CREATE TABLE IF NOT EXISTS password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1.7 创建登录尝试记录表
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    email TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 1.8 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 1.9 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 创建用户新闻源配置表
CREATE TABLE IF NOT EXISTS user_news_config (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT TRUE,
    news_sources TEXT DEFAULT 'mlion',
    auto_fetch_interval_minutes INTEGER DEFAULT 5,
    max_articles_per_fetch INTEGER DEFAULT 10,
    sentiment_threshold REAL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 内测码表
CREATE TABLE IF NOT EXISTS beta_codes (
    code TEXT PRIMARY KEY,
    used BOOLEAN DEFAULT FALSE,
    used_by TEXT DEFAULT '',
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 2: Web3 钱包支持表
-- ============================================================

CREATE TABLE IF NOT EXISTS web3_wallets (
    id TEXT PRIMARY KEY,
    wallet_addr TEXT UNIQUE NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 1,
    wallet_type TEXT NOT NULL,
    label TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_wallet_addr CHECK (wallet_addr ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT chk_chain_id CHECK (chain_id > 0),
    CONSTRAINT chk_wallet_type CHECK (wallet_type IN ('metamask', 'tp', 'other'))
);

CREATE TABLE IF NOT EXISTS user_wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    wallet_addr TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    bound_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (wallet_addr) REFERENCES web3_wallets(wallet_addr) ON DELETE CASCADE,
    UNIQUE(user_id, wallet_addr),
    CONSTRAINT chk_is_primary CHECK (is_primary IN (TRUE, FALSE))
);

CREATE TABLE IF NOT EXISTS web3_wallet_nonces (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    nonce TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_nonce_address CHECK (address ~ '^0x[a-fA-F0-9]{40}$')
);

-- ============================================================
-- Part 3: 积分系统表
-- ============================================================

CREATE TABLE IF NOT EXISTS credit_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
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
    CONSTRAINT chk_credits_consistency CHECK (available_credits = total_credits - used_credits),
    CONSTRAINT uk_user_credits_user_id UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    reference_id TEXT UNIQUE,
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
    ),
    CONSTRAINT uk_credit_transactions_reference_id UNIQUE (reference_id)
);

CREATE TABLE IF NOT EXISTS credit_compensation_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trade_id TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_compensation_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT uk_compensation_tasks_trade_id UNIQUE (trade_id)
);

CREATE TABLE IF NOT EXISTS credit_reservations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    trade_id TEXT UNIQUE,
    reserved_credits INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_reserved_positive CHECK (reserved_credits > 0),
    CONSTRAINT uk_credit_reservations_trade_id UNIQUE (trade_id)
);

-- ============================================================
-- Part 4: 支付系统表
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_orders (
    id TEXT PRIMARY KEY,
    crossmint_order_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    package_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USDT',
    credits INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_method TEXT,
    crossmint_client_secret TEXT,
    webhook_received_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES credit_packages(id),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    CONSTRAINT chk_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_credits_positive CHECK (credits > 0),
    CONSTRAINT chk_currency CHECK (currency IN ('USDT', 'USDC', 'ETH', 'BTC'))
);

-- ============================================================
-- Part 5: AI 学习系统表
-- ============================================================

CREATE TABLE IF NOT EXISTS trade_analysis_records (
    id TEXT PRIMARY KEY,
    trader_id TEXT NOT NULL,
    analysis_date TIMESTAMPTZ NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate REAL DEFAULT 0,
    avg_profit_per_win REAL DEFAULT 0,
    avg_loss_per_loss REAL DEFAULT 0,
    profit_factor REAL DEFAULT 0,
    risk_reward_ratio REAL DEFAULT 0,
    analysis_data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trader_id, analysis_date)
);

CREATE TABLE IF NOT EXISTS learning_reflections (
    id TEXT PRIMARY KEY,
    trader_id TEXT NOT NULL,
    reflection_type VARCHAR(50),
    severity VARCHAR(20),
    problem_title TEXT NOT NULL,
    problem_description TEXT,
    root_cause TEXT,
    recommended_action TEXT,
    priority INTEGER DEFAULT 0,
    is_applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parameter_change_history (
    id TEXT PRIMARY KEY,
    trader_id TEXT NOT NULL,
    parameter_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Part 6: 触发器函数
-- ============================================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_ai_models_updated_at ON ai_models;
DROP TRIGGER IF EXISTS update_exchanges_updated_at ON exchanges;
DROP TRIGGER IF EXISTS update_traders_updated_at ON traders;
DROP TRIGGER IF EXISTS update_user_signal_sources_updated_at ON user_signal_sources;
DROP TRIGGER IF EXISTS update_user_news_config_updated_at ON user_news_config;
DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
DROP TRIGGER IF EXISTS update_web3_wallets_updated_at ON web3_wallets;
DROP TRIGGER IF EXISTS update_credit_packages_updated_at ON credit_packages;
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON user_credits;
DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON payment_orders;
DROP TRIGGER IF EXISTS update_credit_compensation_tasks_updated_at ON credit_compensation_tasks;
DROP TRIGGER IF EXISTS update_credit_reservations_updated_at ON credit_reservations;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at
    BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchanges_updated_at
    BEFORE UPDATE ON exchanges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_traders_updated_at
    BEFORE UPDATE ON traders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_signal_sources_updated_at
    BEFORE UPDATE ON user_signal_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_news_config_updated_at
    BEFORE UPDATE ON user_news_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_web3_wallets_updated_at
    BEFORE UPDATE ON web3_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_packages_updated_at
    BEFORE UPDATE ON credit_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_orders_updated_at
    BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_compensation_tasks_updated_at
    BEFORE UPDATE ON credit_compensation_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Part 7: 清理过期Nonce的函数
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void AS $$
BEGIN
    DELETE FROM web3_wallet_nonces
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Part 8: 索引创建
-- ============================================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code ON users(invite_code);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON users(invited_by_user_id);

-- AI模型索引
CREATE INDEX IF NOT EXISTS idx_ai_models_user_id ON ai_models(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_models_enabled ON ai_models(enabled);

-- 交易所索引
CREATE INDEX IF NOT EXISTS idx_exchanges_user_id ON exchanges(user_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_enabled ON exchanges(enabled);

-- 交易员索引
CREATE INDEX IF NOT EXISTS idx_traders_user_id ON traders(user_id);
CREATE INDEX IF NOT EXISTS idx_traders_is_running ON traders(is_running);
CREATE INDEX IF NOT EXISTS idx_traders_exchange_id ON traders(exchange_id);

-- 登录尝试索引
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts(timestamp);

-- 审计日志索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 用户新闻源配置索引
CREATE INDEX IF NOT EXISTS idx_user_news_config_user_id ON user_news_config(user_id);
CREATE INDEX IF NOT EXISTS idx_user_news_config_enabled ON user_news_config(enabled);

-- Web3钱包索引
CREATE INDEX IF NOT EXISTS idx_web3_wallets_addr ON web3_wallets(wallet_addr);
CREATE INDEX IF NOT EXISTS idx_web3_wallets_type ON web3_wallets(wallet_type);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_primary ON user_wallets(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_nonces_address ON web3_wallet_nonces(address);
CREATE INDEX IF NOT EXISTS idx_nonces_expires ON web3_wallet_nonces(expires_at) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_nonces_used ON web3_wallet_nonces(used, expires_at);

-- 积分系统索引
CREATE INDEX IF NOT EXISTS idx_credit_packages_active ON credit_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_packages_sort ON credit_packages(sort_order, id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_category ON credit_transactions(category);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_compensation_tasks_user_id ON credit_compensation_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_compensation_tasks_status ON credit_compensation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_credit_compensation_tasks_created_at ON credit_compensation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_user_id ON credit_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_reservations_created_at ON credit_reservations(created_at);

-- 支付订单索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_crossmint_order_id ON payment_orders(crossmint_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_status ON payment_orders(user_id, status);

-- AI学习系统索引
CREATE INDEX IF NOT EXISTS idx_trade_analysis_trader_date ON trade_analysis_records(trader_id, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_learning_reflections_trader ON learning_reflections(trader_id);
CREATE INDEX IF NOT EXISTS idx_parameter_change_trader ON parameter_change_history(trader_id);

-- ============================================================
-- Part 9: Kelly统计和交易记录表
-- ============================================================

-- 交易记录表 (用于Kelly公式学习和统计)
CREATE TABLE IF NOT EXISTS trade_records (
    id BIGSERIAL PRIMARY KEY,
    trader_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    entry_price DECIMAL(18,8) NOT NULL,
    exit_price DECIMAL(18,8) NOT NULL,
    profit_pct DECIMAL(10,6) NOT NULL,
    leverage INTEGER DEFAULT 1,
    holding_time_seconds BIGINT DEFAULT 0,
    margin_mode TEXT DEFAULT 'cross',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kelly统计数据表 (缓存计算结果，加速启动)
CREATE TABLE IF NOT EXISTS kelly_stats (
    id BIGSERIAL PRIMARY KEY,
    trader_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    total_trades INTEGER DEFAULT 0,
    profitable_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(10,6) DEFAULT 0,
    avg_win_pct DECIMAL(10,6) DEFAULT 0,
    avg_loss_pct DECIMAL(10,6) DEFAULT 0,
    max_profit_pct DECIMAL(10,6) DEFAULT 0,
    max_drawdown_pct DECIMAL(10,6) DEFAULT 0,
    volatility DECIMAL(10,6) DEFAULT 0,
    weighted_win_rate DECIMAL(10,6) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trader_id, symbol)
);

-- 新闻源状态表 (跟踪新闻消费进度)
CREATE TABLE IF NOT EXISTS news_feed_state (
    category TEXT PRIMARY KEY,
    last_id BIGINT DEFAULT 0,
    last_timestamp BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 这三个表的索引
CREATE INDEX IF NOT EXISTS idx_trade_records_trader ON trade_records(trader_id);
CREATE INDEX IF NOT EXISTS idx_trade_records_symbol ON trade_records(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_records_created_at ON trade_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kelly_stats_trader ON kelly_stats(trader_id);
CREATE INDEX IF NOT EXISTS idx_kelly_stats_symbol ON kelly_stats(symbol);

-- ============================================================
-- Part 10: 默认数据初始化
-- ============================================================

-- 插入默认用户
INSERT INTO users (id, email, password_hash, is_admin)
VALUES ('default', 'default@agentrade.local', '', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 插入默认AI模型
INSERT INTO ai_models (id, user_id, name, provider, enabled)
VALUES
    ('deepseek', 'default', 'DeepSeek', 'deepseek', FALSE),
    ('qwen', 'default', 'Qwen', 'qwen', FALSE)
ON CONFLICT (id, user_id) DO UPDATE SET
    name = EXCLUDED.name,
    provider = EXCLUDED.provider;

-- 插入默认交易所
INSERT INTO exchanges (id, user_id, name, type, enabled)
VALUES
    ('binance', 'default', 'Binance Futures', 'cex', FALSE),
    ('hyperliquid', 'default', 'Hyperliquid', 'dex', FALSE),
    ('aster', 'default', 'Aster DEX', 'dex', FALSE),
    ('okx', 'default', 'OKX Futures', 'cex', FALSE)
ON CONFLICT (id, user_id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type;

-- 插入默认积分套餐
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
-- Part 11: 系统配置初始化
-- ============================================================

INSERT INTO system_config (key, value) VALUES
    -- 基础配置
    ('admin_mode', 'true'),
    ('beta_mode', 'false'),
    ('api_server_port', '8080'),
    ('use_default_coins', 'true'),
    ('default_coins', '["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","DOGEUSDT","ADAUSDT","HYPEUSDT"]'),
    ('max_daily_loss', '10.0'),
    ('max_drawdown', '20.0'),
    ('stop_trading_minutes', '60'),
    ('btc_eth_leverage', '5'),
    ('altcoin_leverage', '5'),
    ('jwt_secret', ''),

    -- Mlion新闻配置
    ('mlion_api_key', 'c559b9a8-80c2-4c17-8c31-bb7659b12b52'),
    ('mlion_target_topic_id', '17758'),
    ('mlion_news_enabled', 'true'),

    -- Web3 钱包配置
    ('web3.supported_wallet_types', '["metamask", "tp", "other"]'),
    ('web3.max_wallets_per_user', '10'),
    ('web3.nonce_expiry_minutes', '10'),
    ('web3.rate_limit_per_ip', '10'),
    ('web3.rate_limit_window_minutes', '10'),

    -- Mem0配置
    ('mem0_enabled', 'false'),
    ('mem0_api_key', 'm0-pPQAtopvF6u9BqUSgJmELhigDoXjGJo8Yx13prCr'),
    ('mem0_api_url', 'https://api.mem0.ai/v1'),
    ('mem0_user_id', ''),
    ('mem0_organization_id', ''),
    ('mem0_model', 'gpt-4'),
    ('mem0_temperature', '0.7'),
    ('mem0_max_tokens', '2000'),
    ('mem0_memory_limit', '8000'),
    ('mem0_vector_dim', '1536'),
    ('mem0_similarity_threshold', '0.6'),
    ('mem0_cache_ttl_minutes', '30'),
    ('mem0_warmup_interval_minutes', '5'),
    ('mem0_warmup_enabled', 'true'),
    ('mem0_circuit_breaker_enabled', 'true'),
    ('mem0_circuit_breaker_threshold', '3'),
    ('mem0_circuit_breaker_timeout_seconds', '300'),
    ('mem0_context_compression_enabled', 'true'),
    ('mem0_max_prompt_tokens', '2500'),
    ('mem0_quality_filter_enabled', 'true'),
    ('mem0_quality_score_threshold', '0.3'),
    ('mem0_reflection_enabled', 'true'),
    ('mem0_reflection_status_tracking', 'true'),
    ('mem0_evaluation_delay_days', '3'),
    ('mem0_metrics_enabled', 'true'),
    ('mem0_metrics_interval_minutes', '1'),
    ('mem0_verbose_logging', 'true'),
    ('mem0_rollout_percentage', '0'),
    ('mem0_auto_rollback_enabled', 'true'),
    ('mem0_error_rate_threshold', '5.0'),
    ('mem0_latency_threshold_ms', '2000'),
    ('mem0_ab_test_enabled', 'false'),
    ('mem0_ab_test_control_percentage', '50'),
    ('mem0_ab_test_duration_days', '7'),

    -- Gemini配置
    ('gemini_enabled', 'false'),
    ('gemini_api_key', ''),
    ('gemini_api_url', 'https://gemini-proxy-iota-weld.vercel.app'),
    ('gemini_api_version', 'v1beta'),
    ('gemini_model', 'gemini-3-flash-preview'),
    ('gemini_temperature', '0.7'),
    ('gemini_max_tokens', '2000'),
    ('gemini_top_p', '0.95'),
    ('gemini_top_k', '40'),
    ('gemini_cache_enabled', 'true'),
    ('gemini_cache_ttl_minutes', '30'),
    ('gemini_circuit_breaker_enabled', 'true'),
    ('gemini_circuit_breaker_threshold', '3'),
    ('gemini_circuit_breaker_timeout_seconds', '300'),
    ('gemini_metrics_enabled', 'true'),
    ('gemini_verbose_logging', 'false'),
    ('gemini_log_requests', 'false'),
    ('gemini_rollout_percentage', '0'),
    ('gemini_auto_fallback_enabled', 'true'),
    ('gemini_error_rate_threshold', '5.0'),
    ('gemini_timeout_seconds', '30'),
    ('gemini_connect_timeout_seconds', '10'),
    ('gemini_retry_enabled', 'true'),
    ('gemini_retry_max_attempts', '3'),
    ('gemini_retry_backoff_ms', '500')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================
-- Part 12: 验证迁移完整性
-- ============================================================

DO $$
DECLARE
    table_count INTEGER;
    config_count INTEGER;
    ai_model_count INTEGER;
    exchange_count INTEGER;
    package_count INTEGER;
BEGIN
    -- 验证表数量
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

    -- 验证AI模型
    SELECT COUNT(*) INTO ai_model_count FROM ai_models WHERE user_id = 'default';

    -- 验证交易所
    SELECT COUNT(*) INTO exchange_count FROM exchanges WHERE user_id = 'default';

    -- 验证积分套餐
    SELECT COUNT(*) INTO package_count FROM credit_packages;

    -- 验证系统配置
    SELECT COUNT(*) INTO config_count FROM system_config;

    RAISE NOTICE '✅ 数据库迁移完成';
    RAISE NOTICE '   📊 统计信息:';
    RAISE NOTICE '   ├─ 表数量: %', table_count;
    RAISE NOTICE '   ├─ AI模型: % 个', ai_model_count;
    RAISE NOTICE '   ├─ 交易所: % 个', exchange_count;
    RAISE NOTICE '   ├─ 积分套餐: % 个', package_count;
    RAISE NOTICE '   └─ 系统配置: % 项', config_count;
    RAISE NOTICE '';
    RAISE NOTICE '✨ 所有数据库表、索引和初始数据已成功创建!';

END $$;

-- ============================================================
-- 数据库迁移脚本执行完成
-- ============================================================
