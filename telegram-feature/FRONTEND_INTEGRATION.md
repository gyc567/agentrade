# Monnaire Trading Agent OS 前端对接文档

## 概述

本文档为前端开发者提供与Monnaire Trading Agent OS AI交易系统后端API的集成指南。

---

## 基础配置

### API Base URL
```javascript
// 开发环境
const API_BASE_URL = 'http://localhost:8080';

// 生产环境（部署后替换为实际URL）
const API_BASE_URL = 'https://your-deployment.repl.co';
```

### 请求头配置
```javascript
const headers = {
  'Content-Type': 'application/json',
  // Admin模式下可选，生产环境需要
  'Authorization': `Bearer ${token}`
};
```

---

## 认证流程

### 当前状态：Admin模式
系统当前启用了Admin模式（`admin_mode: true`），**无需认证**即可访问所有API。

### 生产环境认证流程

```javascript
// 1. 用户登录
async function login(email) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json(); // { message: "验证码已发送至邮箱" }
}

// 2. 验证OTP获取Token
async function verifyOTP(email, otp) {
  const response = await fetch(`${API_BASE_URL}/api/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  const data = await response.json();
  
  // 保存token到localStorage
  if (data.token) {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('user_id', data.user_id);
  }
  
  return data;
}

// 3. 获取存储的token
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

// 4. 带认证的请求
async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    }
  });
}
```

---

## 核心功能实现

### 1. 获取系统配置

```javascript
async function getSystemConfig() {
  const response = await fetch(`${API_BASE_URL}/api/config`);
  const config = await response.json();
  
  // 返回示例：
  // {
  //   admin_mode: true,
  //   beta_mode: false,
  //   default_coins: ["BTCUSDT", "ETHUSDT", ...],
  //   btc_eth_leverage: 5,
  //   altcoin_leverage: 5
  // }
  
  return config;
}
```

### 2. 获取支持的AI模型和交易所

```javascript
async function getSupportedModels() {
  const response = await fetch(`${API_BASE_URL}/api/supported-models`);
  return response.json();
  
  // 返回示例：
  // [
  //   { id: "deepseek", name: "DeepSeek", provider: "deepseek" },
  //   { id: "qwen", name: "Qwen", provider: "qwen" }
  // ]
}

async function getSupportedExchanges() {
  const response = await fetch(`${API_BASE_URL}/api/supported-exchanges`);
  return response.json();
  
  // 返回示例：
  // [
  //   { id: "binance", name: "Binance", type: "cex" },
  //   { id: "hyperliquid", name: "Hyperliquid", type: "dex" }
  // ]
}
```

### 3. 交易员管理

#### 获取交易员列表
```javascript
async function getMyTraders() {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/my-traders`);
  return response.json();
  
  // 返回示例：
  // [
  //   {
  //     id: "binance_deepseek_1731312751",
  //     name: "My AI Trader",
  //     ai_model_id: "deepseek",
  //     exchange_id: "binance",
  //     initial_balance: 10000,
  //     is_running: false
  //   }
  // ]
}
```

#### 创建交易员
```javascript
async function createTrader(traderData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/traders`, {
    method: 'POST',
    body: JSON.stringify({
      name: traderData.name,
      ai_model_id: traderData.aiModelId,
      exchange_id: traderData.exchangeId,
      initial_balance: traderData.initialBalance || 10000,
      btc_eth_leverage: traderData.btcEthLeverage || 5,
      altcoin_leverage: traderData.altcoinLeverage || 5,
      trading_symbols: traderData.tradingSymbols || "BTCUSDT,ETHUSDT",
      custom_prompt: traderData.customPrompt || "",
      override_base_prompt: traderData.overrideBasePrompt || false,
      system_prompt_template: traderData.systemPromptTemplate || "default",
      is_cross_margin: traderData.isCrossMargin !== false,
      scan_interval_minutes: traderData.scanIntervalMinutes || 3,
      use_coin_pool: traderData.useCoinPool || false,
      use_oi_top: traderData.useOITop || false
    })
  });
  
  return response.json();
  
  // 返回示例：
  // {
  //   trader_id: "binance_deepseek_1731312751",
  //   trader_name: "My AI Trader",
  //   ai_model: "deepseek",
  //   is_running: false
  // }
}
```

#### 启动/停止交易员
```javascript
async function startTrader(traderId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/traders/${traderId}/start`,
    { method: 'POST' }
  );
  return response.json(); // { message: "交易员已启动" }
}

async function stopTrader(traderId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/traders/${traderId}/stop`,
    { method: 'POST' }
  );
  return response.json(); // { message: "交易员已停止" }
}
```

#### 删除交易员
```javascript
async function deleteTrader(traderId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/traders/${traderId}`,
    { method: 'DELETE' }
  );
  return response.json(); // { message: "交易员已删除" }
}
```

### 4. AI模型配置

#### 获取模型配置
```javascript
async function getModelConfigs() {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/models`);
  return response.json();
  
  // 返回示例：
  // {
  //   deepseek: {
  //     id: "deepseek",
  //     name: "DeepSeek",
  //     enabled: true,
  //     api_key: "sk-***"
  //   }
  // }
}
```

#### 更新模型配置
```javascript
async function updateModelConfigs(modelConfigs) {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/models`, {
    method: 'PUT',
    body: JSON.stringify({
      models: {
        deepseek: {
          enabled: modelConfigs.deepseek.enabled,
          api_key: modelConfigs.deepseek.apiKey,
          custom_api_url: modelConfigs.deepseek.customApiUrl || "",
          custom_model_name: modelConfigs.deepseek.customModelName || ""
        }
      }
    })
  });
  
  return response.json(); // { message: "模型配置已更新" }
}
```

### 5. 交易所配置

#### 更新交易所配置（Binance）
```javascript
async function updateBinanceConfig(apiKey, secretKey, testnet = false) {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/exchanges`, {
    method: 'PUT',
    body: JSON.stringify({
      exchanges: {
        binance: {
          enabled: true,
          api_key: apiKey,
          secret_key: secretKey,
          testnet: testnet
        }
      }
    })
  });
  
  return response.json(); // { message: "交易所配置已更新" }
}
```

### 6. 实时数据查询

#### 获取交易员状态
```javascript
async function getTraderStatus(traderId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/status?trader_id=${traderId}`
  );
  return response.json();
  
  // 返回示例：
  // {
  //   trader_id: "binance_deepseek_1731312751",
  //   is_running: true,
  //   uptime_seconds: 3600
  // }
}
```

#### 获取账户信息
```javascript
async function getTraderAccount(traderId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/account?trader_id=${traderId}`
  );
  return response.json();
  
  // 返回示例：
  // {
  //   balance: 10250.50,
  //   equity: 10500.30,
  //   unrealized_pnl: 249.80
  // }
}
```

#### 获取持仓列表
```javascript
async function getTraderPositions(traderId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/positions?trader_id=${traderId}`
  );
  return response.json();
  
  // 返回示例：
  // [
  //   {
  //     symbol: "BTCUSDT",
  //     side: "LONG",
  //     size: 0.5,
  //     entry_price: 45000.00,
  //     unrealized_pnl: 250.00
  //   }
  // ]
}
```

#### 获取决策日志
```javascript
async function getTraderDecisions(traderId, limit = 100) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/decisions?trader_id=${traderId}&limit=${limit}`
  );
  return response.json();
}
```

#### 获取统计数据
```javascript
async function getTraderStatistics(traderId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/api/statistics?trader_id=${traderId}`
  );
  return response.json();
  
  // 返回示例：
  // {
  //   total_trades: 145,
  //   win_rate: 68.28,
  //   total_pnl: 1250.50
  // }
}
```

### 7. 公开竞赛数据（无需认证）

#### 获取排行榜
```javascript
async function getLeaderboard(limit = 50) {
  const response = await fetch(`${API_BASE_URL}/api/traders?limit=${limit}`);
  return response.json();
  
  // 返回示例：
  // [
  //   {
  //     id: "binance_deepseek_1731312751",
  //     name: "AI Trader Alpha",
  //     total_pnl: 1250.50,
  //     win_rate: 68.5,
  //     rank: 1
  //   }
  // ]
}
```

#### 获取Top 5交易员
```javascript
async function getTopTraders() {
  const response = await fetch(`${API_BASE_URL}/api/top-traders`);
  return response.json();
}
```

#### 获取收益历史
```javascript
async function getEquityHistory(traderId) {
  const response = await fetch(
    `${API_BASE_URL}/api/equity-history?trader_id=${traderId}`
  );
  return response.json();
  
  // 返回示例：
  // [
  //   {
  //     timestamp: "2025-11-11T08:00:00Z",
  //     equity: 10250.50,
  //     pnl: 250.50
  //   }
  // ]
}
```

---

## React 组件示例

### 交易员列表组件

```jsx
import { useState, useEffect } from 'react';

function TraderList() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTraders();
  }, []);
  
  async function fetchTraders() {
    try {
      const response = await fetch('http://localhost:8080/api/my-traders');
      const data = await response.json();
      setTraders(data);
    } catch (error) {
      console.error('Failed to fetch traders:', error);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleStartTrader(traderId) {
    try {
      await fetch(`http://localhost:8080/api/traders/${traderId}/start`, {
        method: 'POST'
      });
      // 刷新列表
      fetchTraders();
    } catch (error) {
      console.error('Failed to start trader:', error);
    }
  }
  
  if (loading) return <div>加载中...</div>;
  
  return (
    <div className="trader-list">
      <h2>我的AI交易员</h2>
      {traders.map(trader => (
        <div key={trader.id} className="trader-card">
          <h3>{trader.name}</h3>
          <p>模型: {trader.ai_model_id}</p>
          <p>交易所: {trader.exchange_id}</p>
          <p>状态: {trader.is_running ? '运行中' : '已停止'}</p>
          <button
            onClick={() => handleStartTrader(trader.id)}
            disabled={trader.is_running}
          >
            {trader.is_running ? '运行中' : '启动'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 创建交易员表单

```jsx
import { useState } from 'react';

function CreateTraderForm() {
  const [formData, setFormData] = useState({
    name: '',
    aiModelId: 'deepseek',
    exchangeId: 'binance',
    initialBalance: 10000,
    tradingSymbols: 'BTCUSDT,ETHUSDT'
  });
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:8080/api/traders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          ai_model_id: formData.aiModelId,
          exchange_id: formData.exchangeId,
          initial_balance: parseFloat(formData.initialBalance),
          trading_symbols: formData.tradingSymbols
        })
      });
      
      const result = await response.json();
      console.log('交易员创建成功:', result);
      
      // 重置表单或跳转
    } catch (error) {
      console.error('创建失败:', error);
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="交易员名称"
        value={formData.name}
        onChange={e => setFormData({...formData, name: e.target.value})}
        required
      />
      
      <select
        value={formData.aiModelId}
        onChange={e => setFormData({...formData, aiModelId: e.target.value})}
      >
        <option value="deepseek">DeepSeek</option>
        <option value="qwen">Qwen</option>
      </select>
      
      <select
        value={formData.exchangeId}
        onChange={e => setFormData({...formData, exchangeId: e.target.value})}
      >
        <option value="binance">Binance</option>
        <option value="hyperliquid">Hyperliquid</option>
      </select>
      
      <input
        type="number"
        placeholder="初始资金"
        value={formData.initialBalance}
        onChange={e => setFormData({...formData, initialBalance: e.target.value})}
        required
      />
      
      <input
        type="text"
        placeholder="交易币种（逗号分隔）"
        value={formData.tradingSymbols}
        onChange={e => setFormData({...formData, tradingSymbols: e.target.value})}
      />
      
      <button type="submit">创建交易员</button>
    </form>
  );
}
```

---

## 状态管理（Zustand示例）

```javascript
import { create } from 'zustand';

const useTraderStore = create((set, get) => ({
  traders: [],
  selectedTrader: null,
  loading: false,
  
  // 获取交易员列表
  fetchTraders: async () => {
    set({ loading: true });
    try {
      const response = await fetch('http://localhost:8080/api/my-traders');
      const traders = await response.json();
      set({ traders, loading: false });
    } catch (error) {
      console.error('Failed to fetch traders:', error);
      set({ loading: false });
    }
  },
  
  // 创建交易员
  createTrader: async (traderData) => {
    try {
      const response = await fetch('http://localhost:8080/api/traders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(traderData)
      });
      const newTrader = await response.json();
      
      // 重新获取列表
      get().fetchTraders();
      
      return newTrader;
    } catch (error) {
      console.error('Failed to create trader:', error);
      throw error;
    }
  },
  
  // 启动交易员
  startTrader: async (traderId) => {
    try {
      await fetch(`http://localhost:8080/api/traders/${traderId}/start`, {
        method: 'POST'
      });
      get().fetchTraders();
    } catch (error) {
      console.error('Failed to start trader:', error);
      throw error;
    }
  },
  
  // 停止交易员
  stopTrader: async (traderId) => {
    try {
      await fetch(`http://localhost:8080/api/traders/${traderId}/stop`, {
        method: 'POST'
      });
      get().fetchTraders();
    } catch (error) {
      console.error('Failed to stop trader:', error);
      throw error;
    }
  },
  
  // 删除交易员
  deleteTrader: async (traderId) => {
    try {
      await fetch(`http://localhost:8080/api/traders/${traderId}`, {
        method: 'DELETE'
      });
      get().fetchTraders();
    } catch (error) {
      console.error('Failed to delete trader:', error);
      throw error;
    }
  }
}));

export default useTraderStore;
```

---

## 实时数据更新（轮询示例）

```javascript
import { useEffect, useState } from 'react';

function useTraderRealtime(traderId, interval = 5000) {
  const [status, setStatus] = useState(null);
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  
  useEffect(() => {
    if (!traderId) return;
    
    async function fetchData() {
      try {
        // 并行请求多个端点
        const [statusRes, accountRes, positionsRes] = await Promise.all([
          fetch(`http://localhost:8080/api/status?trader_id=${traderId}`),
          fetch(`http://localhost:8080/api/account?trader_id=${traderId}`),
          fetch(`http://localhost:8080/api/positions?trader_id=${traderId}`)
        ]);
        
        setStatus(await statusRes.json());
        setAccount(await accountRes.json());
        setPositions(await positionsRes.json());
      } catch (error) {
        console.error('Failed to fetch trader data:', error);
      }
    }
    
    // 立即执行一次
    fetchData();
    
    // 设置定时器
    const timer = setInterval(fetchData, interval);
    
    // 清理
    return () => clearInterval(timer);
  }, [traderId, interval]);
  
  return { status, account, positions };
}

// 使用示例
function TraderDashboard({ traderId }) {
  const { status, account, positions } = useTraderRealtime(traderId);
  
  if (!status) return <div>加载中...</div>;
  
  return (
    <div className="dashboard">
      <div className="status">
        <h3>状态</h3>
        <p>运行状态: {status.is_running ? '运行中' : '已停止'}</p>
        <p>运行时长: {status.uptime_seconds}秒</p>
      </div>
      
      <div className="account">
        <h3>账户</h3>
        <p>余额: ${account?.balance.toFixed(2)}</p>
        <p>净值: ${account?.equity.toFixed(2)}</p>
        <p>未实现盈亏: ${account?.unrealized_pnl.toFixed(2)}</p>
      </div>
      
      <div className="positions">
        <h3>持仓</h3>
        {positions.map((pos, idx) => (
          <div key={idx}>
            <p>{pos.symbol} {pos.side}</p>
            <p>数量: {pos.size}</p>
            <p>盈亏: ${pos.unrealized_pnl.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 错误处理

```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
}

// 使用示例
try {
  const traders = await apiCall('http://localhost:8080/api/my-traders');
  console.log('交易员列表:', traders);
} catch (error) {
  alert(`获取失败: ${error.message}`);
}
```

---

## 部署后的URL更新

部署完成后，将所有API调用中的`http://localhost:8080`替换为实际的部署URL：

```javascript
// 环境变量配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// 或者在配置文件中
// config.js
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080'
};
```

---

## WebSocket 连接（未来支持）

当前系统支持WebSocket实时行情数据，但API层面暂未暴露WebSocket端点。如需实时推送，建议使用轮询或等待WebSocket API开放。

---

## 技术栈建议

- **状态管理**: Zustand（已使用）
- **数据请求**: SWR 或 React Query（支持缓存和自动重新验证）
- **UI组件**: 使用现有的 Radix UI + Tailwind CSS
- **图表**: Recharts（已使用）
- **表单**: React Hook Form

---

## 注意事项

1. **Admin模式**: 当前系统处于Admin模式，所有API无需认证。生产环境请关闭Admin模式并实现完整的认证流程。

2. **CORS**: 后端已启用CORS，允许跨域请求。

3. **错误处理**: 所有API调用都应该包含适当的错误处理逻辑。

4. **数据刷新**: 建议使用SWR或React Query实现自动数据刷新和缓存管理。

5. **性能优化**: 对于频繁更新的数据（如持仓、账户信息），建议使用适当的轮询间隔（3-5秒）。

6. **安全性**: 
   - 不要在前端代码中硬编码API密钥
   - 使用HTTPS连接
   - Token应存储在localStorage或sessionStorage中

---

## 下一步

1. 部署后端到Replit
2. 获取实际的部署URL
3. 更新前端配置文件中的API_BASE_URL
4. 测试所有API端点
5. 实现错误边界和加载状态
6. 添加用户反馈（Toast通知等）
