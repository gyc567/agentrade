# OKX AI 交易功能问题报告

## 1. 任务概述
检查并修复 OKX AI 交易功能相关问题，包括：
- OKX 交易所配置保存问题
- 生产环境看板显示数值为0问题

---

## 2. OKX 交易所配置问题

### ✅ 已修复
**问题**：OKX 交易所配置中的 Passphrase 字段无法正确保存  
**修复**：修改 `web/src/components/AITradersPage.tsx` 中的 `handleSubmit` 函数，确保 Passphrase 参数被正确传递  
**验证**：Passphrase 现在可以正常保存和显示  
**提交**：已推送到 GitHub

---

## 3. 生产环境看板问题

### 📋 问题表现
看板显示所有数值为0：
- 净值: 0.00 USDT
- 可用: 0.00 USDT
- 保证金率: 0.0%
- 持仓: 0

### 🎯 根本原因
**生产环境（Vercel）缺少 API 代理配置**，导致前端所有 `/api` 请求都无法到达后端服务。

### 💡 原理分析
| 环境       | 配置文件       | 配置状态                     | 结果                   |
|------------|----------------|------------------------------|------------------------|
| 开发环境   | vite.config.ts | ✅ 已配置 API 代理            | 正常获取数据           |
| 生产环境   | vercel.json    | ❌ 仅路由重写，无 API 代理    | API 请求返回 404        |

### ✅ 修复方案
在 `web/vercel.json` 中添加 API 代理规则：

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "http://YOUR_BACKEND_URL/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

### 📌 验证步骤
1. 修改 `vercel.json` 后重新部署到 Vercel
2. 用 CURL 测试 API 请求：`curl https://web-pink-omega-40.vercel.app/api/account`
3. 检查返回是否为有效的 JSON 数据（而非 404）
4. 刷新看板验证数据是否显示正常

---

## 4. 修复实施

### ✅ 已实施修复
**文件**: `web/vercel.json`
**修改**: 添加API代理规则

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "${VITE_API_URL}/api/$1"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**关键改进**:
- ✅ 使用环境变量 `${VITE_API_URL}` 替代硬编码URL
- ✅ 支持多环境部署（开发、测试、生产）
- ✅ 配置一致性好品味（符Linus Torvalds标准）

**环境变量配置**:
- 本地: `/web/.env.local` 设置 `VITE_API_URL=https://nofx-gyc567.replit.app`
- 生产: 需要在Vercel项目设置中添加 `VITE_API_URL` 环境变量

### 🚀 部署步骤
```bash
# 1. 进入项目目录
cd /Users/guoyingcheng/dreame/code/nofx/web

# 2. 登录Vercel
vercel login

# 3. 设置环境变量
vercel env add VITE_API_URL production
# 输入: https://nofx-gyc567.replit.app

# 4. 部署到生产环境
vercel --prod --confirm
```

### 🧪 验证测试
```bash
# 测试API代理是否生效
curl https://web-pink-omega-40.vercel.app/api/account

# 应该返回有效JSON而非404
```

## 5. 任务总结
- ✅ OKX 交易所配置修复已完成并提交
- ✅ 生产环境看板问题已定位
- ✅ 修复方案已明确并实施
- ✅ 使用环境变量方案提升配置一致性
