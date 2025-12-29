# Bug Report: Payment 400 Error

## 📋 Bug信息
- **标题**: 支付创建订单接口返回400错误
- **严重程度**: 🔴 Critical (阻塞核心功能)
- **发现时间**: 2025-12-29
- **影响范围**: 所有用户无法购买积分

## 🐛 问题描述

用户在前端点击购买积分时，收到400错误：
```
POST https://www.agentrade.xyz/api/payments/crossmint/create-order 400 (Bad Request)
[CreateCrossmintOrder Error] 创建订单失败
```

## 🔍 根本原因分析

### 原因1：Vercel API代理URL配置错误 ⭐ 主要原因
**问题**: `vercel.json` 中配置的Replit后端URL已过期
- **错误URL**: `https://d2fb6d3e-75ae-47d3-91ff-87f94a49ec75-00-3uwjspw7dwjz7.worf.replit.dev`
- **状态**: 返回 "Run this app to see the results here" (服务未运行)
- **正确URL**: `https://nofx-gyc567.replit.app`

**验证**:
```bash
# 旧URL - 失败
curl https://d2fb6d3e-75ae-47d3-91ff-87f94a49ec75-00-3uwjspw7dwjz7.worf.replit.dev/api/health
# 返回: HTML页面

# 新URL - 成功
curl https://nofx-gyc567.replit.app/api/health
# 返回: {"status":"ok","time":null}
```

### 原因2：后端数据库插入错误
**问题**: PostgreSQL错误 `pq: insufficient data left in message`
- **根因**: `config/payment.go:104-106` 传递空字符串而非NULL
- **影响字段**: `crossmint_order_id`, `payment_method`, `crossmint_client_secret`

**代码位置**:
```go
// config/payment.go:104-106
order.ID, order.CrossmintOrderID, order.UserID, order.PackageID,
order.Amount, order.Currency, order.Credits, order.Status,
order.PaymentMethod, order.CrossmintClientSecret, metadataJSON,
```

当这些字段为空字符串 `""` 时，应该传递 `sql.NullString{Valid: false}`

### 原因3：认证Token验证
**问题**: 需要验证前端是否正确发送token
- 检查localStorage中是否有 `auth_token`
- 检查PaymentApiService是否正确获取token

## ✅ 解决方案

### 修复1: 更新Vercel代理URL
**文件**: `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://nofx-gyc567.replit.app/api/:path*"
    }
  ]
}
```

### 修复2: 修复后端空字符串处理
**文件**: `config/payment.go`

需要将空字符串字段转换为sql.NullString:
```go
// 在CreatePaymentOrder中添加辅助函数
func toNullString(s string) sql.NullString {
    return sql.NullString{
        String: s,
        Valid:  s != "",
    }
}

// 更新INSERT语句参数
order.ID, toNullString(order.CrossmintOrderID), order.UserID, order.PackageID,
order.Amount, order.Currency, order.Credits, order.Status,
toNullString(order.PaymentMethod), toNullString(order.CrossmintClientSecret), metadataJSON,
```

### 修复3: 验证前端Token流程
确保：
1. 用户已登录
2. localStorage有有效token
3. PaymentApiService正确读取token

## 📊 影响评估
- **用户影响**: 100% 用户无法购买积分
- **业务影响**: 核心收入功能完全阻塞
- **紧急程度**: 立即修复

## 🧪 测试计划
1. 更新vercel.json后重新部署
2. 测试未认证请求（应返回401）
3. 测试已认证请求（应成功创建订单）
4. 验证数据库记录正确插入

## 📝 实施步骤
1. ✅ 分析根本原因
2. ⏳ 更新vercel.json配置
3. ⏳ 修复后端空字符串处理
4. ⏳ 部署并验证
