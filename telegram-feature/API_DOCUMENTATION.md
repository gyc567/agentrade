# Monnaire Trading Agent OS AI Trading System - API 文档

## 基础信息

**Base URL**: `https://your-deployment-url.repl.co`  
**API 前缀**: `/api`  
**认证方式**: JWT Bearer Token  
**Content-Type**: `application/json`

## 认证说明

### Admin 模式
当前系统启用了 Admin 模式（`admin_mode: true`），无需认证即可访问受保护的API。

### 生产模式认证
关闭 Admin 模式后，需要在请求头中携带 JWT Token：
```
Authorization: Bearer <your_jwt_token>
```

---

## API 端点列表

### 1. 健康检查 & 系统状态

#### 1.1 根路径健康检查
```http
GET /
```

**响应示例**:
```json
{
  "status": "ok",
  "service": "Monnaire Trading Agent OS AI Trading System"
}
```

#### 1.2 API 健康检查
```http
GET /api/health
```

**响应示例**:
```json
{
  "status": "ok",
  "time": "2025-11-11T08:52:31Z"
}
```

---

### 2. 系统配置（无需认证）

#### 2.1 获取系统配置
```http
GET /api/config
```

**响应示例**:
```json
{
  "admin_mode": true,
  "beta_mode": false,
  "default_coins": ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"],
  "btc_eth_leverage": 5,
  "altcoin_leverage": 5
}
```

#### 2.2 获取支持的AI模型
```http
GET /api/supported-models
```

**响应示例**:
```json
[
  {
    "id": "deepseek",
    "name": "DeepSeek",
    "provider": "deepseek",
    "description": "DeepSeek AI 模型"
  },
  {
    "id": "qwen",
    "name": "Qwen",
    "provider": "qwen",
    "description": "通义千问 AI 模型"
  }
]
```

#### 2.3 获取支持的交易所
```http
GET /api/supported-exchanges
```

**响应示例**:
```json
[
  {
    "id": "binance",
    "name": "Binance",
    "type": "cex",
    "description": "币安期货交易所"
  },
  {
    "id": "hyperliquid",
    "name": "Hyperliquid",
    "type": "dex",
    "description": "Hyperliquid DEX"
  }
]
```

---

### 3. 提示词模板管理（无需认证）

#### 3.1 获取提示词模板列表
```http
GET /api/prompt-templates
```

**响应示例**:
```json
[
  {
    "name": "default",
    "description": "默认系统提示词",
    "file_name": "default.txt"
  },
  {
    "name": "adaptive",
    "description": "自适应提示词",
    "file_name": "adaptive.txt"
  }
]
```

#### 3.2 获取指定提示词模板内容
```http
GET /api/prompt-templates/:name
```

**URL 参数**:
- `name`: 模板名称（如 `default`, `adaptive`）

**响应示例**:
```json
{
  "name": "default",
  "content": "你是一个专业的加密货币AI交易员..."
}
```

---

### 4. 公开竞赛数据（无需认证）

#### 4.1 获取交易员排行榜
```http
GET /api/traders
```

**Query 参数**:
- `limit`: 返回数量（默认50）

**响应示例**:
```json
[
  {
    "id": "binance_deepseek_1731312751",
    "name": "AI Trader Alpha",
    "ai_model": "deepseek",
    "exchange": "binance",
    "total_pnl": 1250.50,
    "win_rate": 68.5,
    "total_trades": 145,
    "rank": 1
  }
]
```

#### 4.2 获取竞赛数据
```http
GET /api/competition
```

**响应示例**:
```json
{
  "total_traders": 328,
  "total_trades": 12450,
  "best_performer": {
    "trader_id": "binance_deepseek_1731312751",
    "pnl": 1250.50,
    "win_rate": 68.5
  }
}
```

#### 4.3 获取Top 5交易员
```http
GET /api/top-traders
```

**响应示例**:
```json
[
  {
    "trader_id": "binance_deepseek_1731312751",
    "name": "AI Trader Alpha",
    "total_pnl": 1250.50,
    "win_rate": 68.5
  }
]
```

#### 4.4 获取收益历史数据
```http
GET /api/equity-history?trader_id=xxx
```

**Query 参数**:
- `trader_id`: 交易员ID

**响应示例**:
```json
[
  {
    "timestamp": "2025-11-11T08:00:00Z",
    "equity": 10250.50,
    "pnl": 250.50
  }
]
```

#### 4.5 批量获取收益历史数据
```http
POST /api/equity-history-batch
```

**请求体**:
```json
{
  "trader_ids": ["trader1", "trader2", "trader3"]
}
```

**响应示例**:
```json
{
  "trader1": [
    {"timestamp": "2025-11-11T08:00:00Z", "equity": 10250.50}
  ],
  "trader2": [
    {"timestamp": "2025-11-11T08:00:00Z", "equity": 9850.30}
  ]
}
```

#### 4.6 获取交易员公开配置
```http
GET /api/traders/:id/public-config
```

**URL 参数**:
- `id`: 交易员ID

**响应示例**:
```json
{
  "name": "AI Trader Alpha",
  "ai_model": "deepseek",
  "exchange": "binance",
  "initial_balance": 10000,
  "btc_eth_leverage": 5,
  "altcoin_leverage": 5
}
```

---

### 5. 用户认证（无需认证）

#### 5.1 用户注册
```http
POST /api/register
```

**请求体**:
```json
{
  "email": "user@example.com",
  "beta_code": "YOUR_BETA_CODE"
}
```

**响应示例**:
```json
{
  "message": "验证码已发送至邮箱",
  "email": "user@example.com"
}
```

#### 5.2 用户登录
```http
POST /api/login
```

**请求体**:
```json
{
  "email": "user@example.com"
}
```

**响应示例**:
```json
{
  "message": "验证码已发送至邮箱",
  "email": "user@example.com"
}
```

#### 5.3 验证OTP
```http
POST /api/verify-otp
```

**请求体**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**响应示例**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": "uuid-here"
}
```

#### 5.4 完成注册
```http
POST /api/complete-registration
```

**请求体**:
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

---

### 6. AI交易员管理（需要认证）

#### 6.1 获取我的交易员列表
```http
GET /api/my-traders
```

**响应示例**:
```json
[
  {
    "id": "binance_deepseek_1731312751",
    "name": "My AI Trader",
    "ai_model_id": "deepseek",
    "exchange_id": "binance",
    "initial_balance": 10000,
    "is_running": false,
    "btc_eth_leverage": 5,
    "altcoin_leverage": 5,
    "trading_symbols": "BTCUSDT,ETHUSDT",
    "scan_interval_minutes": 3
  }
]
```

#### 6.2 获取交易员配置
```http
GET /api/traders/:id/config
```

**URL 参数**:
- `id`: 交易员ID

**响应示例**:
```json
{
  "id": "binance_deepseek_1731312751",
  "name": "My AI Trader",
  "ai_model_id": "deepseek",
  "exchange_id": "binance",
  "initial_balance": 10000,
  "btc_eth_leverage": 5,
  "altcoin_leverage": 5,
  "trading_symbols": "BTCUSDT,ETHUSDT",
  "custom_prompt": "",
  "override_base_prompt": false,
  "system_prompt_template": "default",
  "is_cross_margin": true,
  "scan_interval_minutes": 3,
  "use_coin_pool": false,
  "use_oi_top": false
}
```

#### 6.3 创建交易员
```http
POST /api/traders
```

**请求体**:
```json
{
  "name": "My AI Trader",
  "ai_model_id": "deepseek",
  "exchange_id": "binance",
  "initial_balance": 10000,
  "btc_eth_leverage": 5,
  "altcoin_leverage": 5,
  "trading_symbols": "BTCUSDT,ETHUSDT,SOLUSDT",
  "custom_prompt": "",
  "override_base_prompt": false,
  "system_prompt_template": "default",
  "is_cross_margin": true,
  "scan_interval_minutes": 3,
  "use_coin_pool": false,
  "use_oi_top": false
}
```

**响应示例**:
```json
{
  "trader_id": "binance_deepseek_1731312751",
  "trader_name": "My AI Trader",
  "ai_model": "deepseek",
  "is_running": false
}
```

#### 6.4 更新交易员
```http
PUT /api/traders/:id
```

**URL 参数**:
- `id`: 交易员ID

**请求体**:
```json
{
  "name": "Updated AI Trader",
  "ai_model_id": "deepseek",
  "exchange_id": "binance",
  "initial_balance": 15000,
  "btc_eth_leverage": 3,
  "altcoin_leverage": 3,
  "trading_symbols": "BTCUSDT,ETHUSDT",
  "custom_prompt": "更激进的交易策略",
  "override_base_prompt": false,
  "is_cross_margin": true,
  "scan_interval_minutes": 5
}
```

**响应示例**:
```json
{
  "trader_id": "binance_deepseek_1731312751",
  "trader_name": "Updated AI Trader",
  "ai_model": "deepseek",
  "message": "交易员更新成功"
}
```

#### 6.5 删除交易员
```http
DELETE /api/traders/:id
```

**URL 参数**:
- `id`: 交易员ID

**响应示例**:
```json
{
  "message": "交易员已删除"
}
```

#### 6.6 启动交易员
```http
POST /api/traders/:id/start
```

**URL 参数**:
- `id`: 交易员ID

**响应示例**:
```json
{
  "message": "交易员已启动"
}
```

#### 6.7 停止交易员
```http
POST /api/traders/:id/stop
```

**URL 参数**:
- `id`: 交易员ID

**响应示例**:
```json
{
  "message": "交易员已停止"
}
```

#### 6.8 更新交易员提示词
```http
PUT /api/traders/:id/prompt
```

**URL 参数**:
- `id`: 交易员ID

**请求体**:
```json
{
  "custom_prompt": "采用更保守的策略，严格止损",
  "override_base_prompt": false
}
```

**响应示例**:
```json
{
  "message": "自定义prompt已更新"
}
```

---

### 7. AI模型配置（需要认证）

#### 7.1 获取AI模型配置
```http
GET /api/models
```

**响应示例**:
```json
{
  "deepseek": {
    "id": "deepseek",
    "name": "DeepSeek",
    "provider": "deepseek",
    "enabled": true,
    "api_key": "sk-***",
    "custom_api_url": "",
    "custom_model_name": ""
  },
  "qwen": {
    "id": "qwen",
    "name": "Qwen",
    "provider": "qwen",
    "enabled": false,
    "api_key": "",
    "custom_api_url": "",
    "custom_model_name": ""
  }
}
```

#### 7.2 更新AI模型配置
```http
PUT /api/models
```

**请求体**:
```json
{
  "models": {
    "deepseek": {
      "enabled": true,
      "api_key": "sk-your-deepseek-api-key",
      "custom_api_url": "",
      "custom_model_name": ""
    },
    "qwen": {
      "enabled": true,
      "api_key": "sk-your-qwen-api-key",
      "custom_api_url": "",
      "custom_model_name": ""
    }
  }
}
```

**响应示例**:
```json
{
  "message": "模型配置已更新"
}
```

---

### 8. 交易所配置（需要认证）

#### 8.1 获取交易所配置
```http
GET /api/exchanges
```

**响应示例**:
```json
{
  "binance": {
    "id": "binance",
    "name": "Binance",
    "type": "cex",
    "enabled": true,
    "api_key": "***",
    "secret_key": "***",
    "testnet": false
  },
  "hyperliquid": {
    "id": "hyperliquid",
    "name": "Hyperliquid",
    "type": "dex",
    "enabled": false,
    "wallet_address": ""
  }
}
```

#### 8.2 更新交易所配置
```http
PUT /api/exchanges
```

**请求体（Binance）**:
```json
{
  "exchanges": {
    "binance": {
      "enabled": true,
      "api_key": "your-binance-api-key",
      "secret_key": "your-binance-secret-key",
      "testnet": false
    }
  }
}
```

**请求体（Hyperliquid）**:
```json
{
  "exchanges": {
    "hyperliquid": {
      "enabled": true,
      "api_key": "",
      "secret_key": "",
      "testnet": false,
      "hyperliquid_wallet_addr": "0xYourWalletAddress"
    }
  }
}
```

**响应示例**:
```json
{
  "message": "交易所配置已更新"
}
```

---

### 9. 信号源配置（需要认证）

#### 9.1 获取用户信号源配置
```http
GET /api/user/signal-sources
```

**响应示例**:
```json
{
  "coin_pool_url": "https://api.example.com/coin-pool",
  "oi_top_url": "https://api.example.com/oi-top"
}
```

#### 9.2 保存用户信号源配置
```http
POST /api/user/signal-sources
```

**请求体**:
```json
{
  "coin_pool_url": "https://api.example.com/coin-pool",
  "oi_top_url": "https://api.example.com/oi-top"
}
```

**响应示例**:
```json
{
  "message": "信号源配置已保存"
}
```

---

### 10. 交易数据查询（需要认证）

所有以下接口都需要通过 `trader_id` query参数指定交易员：

#### 10.1 获取系统状态
```http
GET /api/status?trader_id=xxx
```

**响应示例**:
```json
{
  "trader_id": "binance_deepseek_1731312751",
  "is_running": true,
  "uptime_seconds": 3600,
  "last_scan_time": "2025-11-11T09:00:00Z"
}
```

#### 10.2 获取账户信息
```http
GET /api/account?trader_id=xxx
```

**响应示例**:
```json
{
  "balance": 10250.50,
  "equity": 10500.30,
  "margin_used": 500.00,
  "available_margin": 10000.30,
  "unrealized_pnl": 249.80
}
```

#### 10.3 获取持仓列表
```http
GET /api/positions?trader_id=xxx
```

**响应示例**:
```json
[
  {
    "symbol": "BTCUSDT",
    "side": "LONG",
    "size": 0.5,
    "entry_price": 45000.00,
    "current_price": 45500.00,
    "unrealized_pnl": 250.00,
    "leverage": 5
  }
]
```

#### 10.4 获取决策日志
```http
GET /api/decisions?trader_id=xxx
```

**Query 参数**:
- `trader_id`: 交易员ID
- `limit`: 返回数量（默认100）

**响应示例**:
```json
[
  {
    "timestamp": "2025-11-11T09:00:00Z",
    "symbol": "BTCUSDT",
    "action": "OPEN_LONG",
    "reason": "技术指标显示上涨趋势...",
    "entry_price": 45000.00,
    "size": 0.5,
    "leverage": 5
  }
]
```

#### 10.5 获取最新决策
```http
GET /api/decisions/latest?trader_id=xxx
```

**响应示例**:
```json
{
  "timestamp": "2025-11-11T09:30:00Z",
  "symbol": "ETHUSDT",
  "action": "HOLD",
  "reason": "市场震荡，暂不操作"
}
```

#### 10.6 获取统计信息
```http
GET /api/statistics?trader_id=xxx
```

**响应示例**:
```json
{
  "total_trades": 145,
  "winning_trades": 99,
  "losing_trades": 46,
  "win_rate": 68.28,
  "total_pnl": 1250.50,
  "max_drawdown": 8.5,
  "sharpe_ratio": 2.3
}
```

#### 10.7 获取AI性能分析
```http
GET /api/performance?trader_id=xxx
```

**响应示例**:
```json
{
  "model_accuracy": 72.5,
  "decision_quality_score": 8.5,
  "risk_management_score": 9.0,
  "learning_progress": [
    {"date": "2025-11-01", "score": 7.5},
    {"date": "2025-11-10", "score": 8.5}
  ]
}
```

---

## 错误响应格式

所有错误响应遵循以下格式：

```json
{
  "error": "错误描述信息"
}
```

### 常见HTTP状态码

- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证或认证失败
- `403 Forbidden`: 无权限访问
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

---

## CORS 配置

API已启用CORS，允许跨域请求：
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## 使用示例

### JavaScript/Fetch
```javascript
// 获取系统配置
const config = await fetch('https://your-deployment.repl.co/api/config')
  .then(res => res.json());

// 创建交易员（需要认证）
const trader = await fetch('https://your-deployment.repl.co/api/traders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
  },
  body: JSON.stringify({
    name: 'My AI Trader',
    ai_model_id: 'deepseek',
    exchange_id: 'binance',
    initial_balance: 10000
  })
}).then(res => res.json());
```

### Python/Requests
```python
import requests

# 获取健康检查
response = requests.get('https://your-deployment.repl.co/api/health')
data = response.json()

# 创建交易员（需要认证）
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-jwt-token'
}
payload = {
    'name': 'My AI Trader',
    'ai_model_id': 'deepseek',
    'exchange_id': 'binance',
    'initial_balance': 10000
}
response = requests.post(
    'https://your-deployment.repl.co/api/traders',
    json=payload,
    headers=headers
)
trader = response.json()
```

### cURL
```bash
# 健康检查
curl https://your-deployment.repl.co/api/health

# 创建交易员（需要认证）
curl -X POST https://your-deployment.repl.co/api/traders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "name": "My AI Trader",
    "ai_model_id": "deepseek",
    "exchange_id": "binance",
    "initial_balance": 10000
  }'
```
