# Bug Report: Crossmint Embedded Checkout URL Unavailable

## 📋 Bug信息
- **标题**: Crossmint嵌入式支付页面无法连接
- **严重程度**: 🔴 Critical (核心支付功能完全阻塞)
- **发现时间**: 2025-12-29
- **影响范围**: 所有用户无法完成积分购买

## 🐛 问题描述

用户在选择积分套餐点击支付后，跳转到Crossmint嵌入式支付页面时报错：
```
网址为 https://embedded-checkout.crossmint.com/?sessionId=25171d11-ae30-492f-b96e-e8d812dd623b
的网页可能暂时无法连接，或者它已永久性地移动到了新网址。
```

## 🔍 根本原因分析

### 原因1：使用了废弃的 `sessionId` URL格式 ⭐ 主要原因

**问题**: `CrossmintService.ts:110` 使用了旧的URL格式：
```typescript
const checkoutUrl = `https://embedded-checkout.crossmint.com?sessionId=${sessionId}`
```

**根因**:
- Crossmint已经弃用了基于 `sessionId` 的嵌入式checkout URL
- 新的Crossmint SDK使用 `orderId` + `clientSecret` 模式
- `embedded-checkout.crossmint.com` 域名可能已不再支持旧格式

**证据**:
- [Crossmint官方文档](https://docs.crossmint.com/payments/embedded/quickstart) 显示使用 `orderId` 和 `clientSecret`
- [Crossmint SDK GitHub](https://github.com/Crossmint/embedded-checkout-quickstart) 示例代码使用新格式

### 原因2：前端使用了两套不同的Crossmint集成方式

**问题**: 代码中存在两套Crossmint集成：

1. **旧方式 (CrossmintService.ts)**:
   - 直接调用废弃的 `https://api.crossmint.com/2022-06-09/embedded-checkouts` API
   - 使用 `sessionId` 打开 popup window
   - **已废弃，不应使用**

2. **新方式 (CrossmintCheckoutEmbed.tsx)**:
   - 使用官方 `@crossmint/client-sdk-react-ui` SDK
   - 使用后端创建的 `orderId` + `clientSecret`
   - **这是正确的方式**

### 原因3：前端可能调用了错误的支付流程

**可能的情况**:
- PaymentOrchestrator 可能仍在调用 CrossmintService.initializeCheckout()
- 而不是使用后端返回的 orderId/clientSecret 来渲染 CrossmintCheckoutEmbed

## ✅ 解决方案

### 方案A：确保使用新的SDK组件方式（推荐）

**支付流程应该是**:
```
1. 用户选择套餐
2. 前端调用 POST /api/payments/crossmint/create-order
3. 后端调用 Crossmint API 创建订单，返回 { orderId, clientSecret }
4. 前端渲染 <CrossmintCheckoutEmbed orderId={orderId} clientSecret={clientSecret} />
5. 用户在嵌入式iframe中完成支付
6. Crossmint发送webhook到后端确认支付
```

**关键修改**:
1. 删除或废弃 `CrossmintService.initializeCheckout()` 和 `openCheckout()` 方法
2. 确保 PaymentOrchestrator 只使用后端API方式
3. 确保 UI 组件使用 `CrossmintCheckoutEmbed`

### 方案B：检查并修复PaymentOrchestrator调用

**文件**: `web/src/features/payment/services/PaymentOrchestrator.ts`

需要确保:
```typescript
async createPaymentSession(packageId: string): Promise<PaymentSession> {
  // ✅ 正确: 调用后端API
  const response = await this.apiService.createCrossmintOrder(packageId)
  return {
    orderId: response.orderId,
    clientSecret: response.clientSecret,
    // ...
  }

  // ❌ 错误: 不要调用 CrossmintService.initializeCheckout()
  // const sessionId = await this.crossmintService.initializeCheckout(...)
}
```

### 方案C：删除废弃的CrossmintService方法

**文件**: `web/src/features/payment/services/CrossmintService.ts`

需要删除或标记废弃:
- `initializeCheckout()` - 使用废弃的API端点
- `openCheckout()` - 使用废弃的URL格式

## 📊 影响评估
- **用户影响**: 100% 用户无法购买积分
- **业务影响**: 核心收入功能完全阻塞
- **紧急程度**: 立即修复

## 🧪 测试计划

1. 验证后端 `/api/payments/crossmint/create-order` 返回有效的 orderId 和 clientSecret
2. 确认 CrossmintCheckoutEmbed 组件正确接收这些参数
3. 测试嵌入式checkout iframe正常显示
4. 完成一笔测试支付确认整个流程

## 📝 实施步骤

1. ⏳ 检查PaymentOrchestrator的支付流程实现
2. ⏳ 确保使用后端API方式而非直接调用Crossmint API
3. ⏳ 确认CrossmintCheckoutEmbed正确渲染
4. ⏳ 测试完整支付流程
5. ⏳ 部署并验证

## 📚 参考资料

- [Crossmint Embedded Checkout Quickstart](https://docs.crossmint.com/payments/embedded/quickstart)
- [Crossmint SDK GitHub](https://github.com/Crossmint/embedded-checkout-quickstart)
- [Crossmint Order API](https://docs.crossmint.com/api-reference/orders/create-order)
