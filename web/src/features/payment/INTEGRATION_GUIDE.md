# Payment Feature Integration Guide

## ✅ 已完成的实施内容

### Phase 1: Foundation ✓
- ✅ 类型定义 (`types/payment.ts`)
- ✅ 常量定义 (`constants/packages.ts`, `constants/errorCodes.ts`)
- ✅ 验证器服务 (`services/paymentValidator.ts`)
- ✅ 工具函数 (`utils/formatPrice.ts`)
- ✅ 模块入口 (`index.ts`)

### Phase 2: Services ✓
- ✅ PaymentOrchestrator 业务编排
- ✅ CrossmintService SDK 包装
- ✅ PaymentContext 状态定义

### Phase 3: Frontend ✓
- ✅ PaymentProvider 上下文提供者
- ✅ usePaymentContext Hook
- ✅ usePaymentPackages Hook
- ✅ useCrossmintCheckout Hook
- ✅ usePaymentHistory Hook
- ✅ PaymentModal 组件

---

## 🚀 集成步骤

### 1. 环境配置

在 `.env.local` 添加：

```env
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=ck_staging_your_key_here
```

### 2. 安装 Crossmint SDK

```bash
npm install @crossmint/client-sdk-react-ui
```

### 3. 在应用中使用

**在 App.tsx 中包装 PaymentProvider：**

```typescript
import { PaymentProvider } from "@/features/payment"
import { AuthProvider } from "@/contexts/AuthContext"

export function App() {
  return (
    <AuthProvider>
      <PaymentProvider>
        <Routes />
      </PaymentProvider>
    </AuthProvider>
  )
}
```

**在页面中使用支付功能：**

```typescript
import { useState } from "react"
import { PaymentModal } from "@/features/payment"

export function ProfilePage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsPaymentOpen(true)}>
        充值积分
      </button>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={(creditsAdded) => {
          console.log(`已获得 ${creditsAdded} 积分`)
        }}
      />
    </>
  )
}
```

---

## 📋 核心 API 说明

### usePaymentContext() Hook

```typescript
const {
  selectedPackage,      // 选中的套餐
  paymentStatus,        // 支付状态: "idle" | "loading" | "success" | "error"
  orderId,             // 订单 ID
  creditsAdded,        // 添加的积分
  error,               // 错误信息
  selectPackage,       // 选择套餐方法
  initiatePayment,     // 开始支付方法
  handlePaymentSuccess, // 支付成功回调
  handlePaymentError,  // 支付失败回调
  resetPayment,        // 重置支付状态
  clearError           // 清除错误
} = usePaymentContext()
```

### 支持的套餐

```typescript
{
  id: "starter",    // 初级套餐：$10 → 500 积分
  id: "pro",        // 专业套餐：$50 → 3,300 积分（含 300 赠送）
  id: "vip"         // VIP 套餐：$100 → 9,600 积分（含 1,600 赠送）
}
```

---

## 🔧 后端 API 要求

### 1. POST /api/payments/confirm

确认支付，将积分加入用户账户

**请求：**
```typescript
{
  orderId: string     // Crossmint 订单 ID
}
```

**响应 (200 OK)：**
```typescript
{
  success: boolean
  message: string
  creditsAdded: number
  bonusCredits: number
  totalCredits: number
  order: {
    id: string
    status: "completed"
    paidAt: Date
    completedAt: Date
  }
}
```

**错误响应 (400/401/409/500)：**
```typescript
{
  success: false
  error: string
  code: string
}
```

### 2. POST /api/webhooks/crossmint

接收 Crossmint 支付完成通知（后端实现）

### 3. GET /api/payments/history

获取用户支付历史

---

## 📁 文件结构

```
src/features/payment/
├── __tests__/                    # (待添加) 测试文件
├── components/
│   ├── PaymentModal.tsx          # ✓ 主容器组件
│   ├── PackageSelector.tsx       # (待添加)
│   └── ...
├── contexts/
│   ├── PaymentContext.ts         # ✓ Context 定义
│   └── PaymentProvider.tsx       # ✓ Provider 组件
├── hooks/
│   ├── usePaymentPackages.ts     # ✓ 套餐数据 Hook
│   ├── useCrossmintCheckout.ts   # ✓ Checkout Hook
│   └── usePaymentHistory.ts      # ✓ 历史记录 Hook
├── services/
│   ├── PaymentOrchestrator.ts    # ✓ 业务编排
│   ├── CrossmintService.ts       # ✓ SDK 包装
│   └── paymentValidator.ts       # ✓ 数据验证
├── types/
│   └── payment.ts                # ✓ 类型定义
├── constants/
│   ├── packages.ts               # ✓ 套餐配置
│   └── errorCodes.ts             # ✓ 错误码
├── utils/
│   └── formatPrice.ts            # ✓ 格式化工具
└── index.ts                      # ✓ 公开 API
```

---

## 🧪 测试 (Phase 4)

### 待实施的测试

1. **单元测试** (20+ 用例)
   - paymentValidator.test.ts
   - PaymentPackage.test.ts
   - Utility functions

2. **集成测试** (12+ 用例)
   - PaymentOrchestrator.test.ts
   - CrossmintService.test.ts
   - PaymentContext.test.ts

3. **E2E 测试** (5 个场景)
   - 完整支付流程
   - 支付失败处理
   - 重复支付防护
   - 套餐验证
   - 无钱包环境

### 运行测试

```bash
npm run test -- src/features/payment
npm run test:coverage -- src/features/payment
```

---

## ⚠️ 常见问题

### Q: 钱包连接失败？
A: 检查浏览器是否已安装钱包扩展（MetaMask 等）

### Q: 支付窗口不显示？
A: 确保 `NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY` 已配置

### Q: 积分未到账？
A: 检查后端 `/api/payments/confirm` 端点是否正确实现

### Q: 需要添加其他套餐？
A: 在 `constants/packages.ts` 中添加新套餐配置即可

---

## 🚀 下一步

1. ✅ **代码审查** - 评审已完成的代码
2. ⏳ **实施测试** (Phase 4)
   - 编写单元测试
   - 编写集成测试
   - 编写 E2E 测试
3. ⏳ **部署准备** (Phase 5)
   - 更新文档
   - 环境配置
   - 上线部署

---

## 📞 获得帮助

参考主提案文档：
- `openspec/features/crossmint-payment-integration/openspec.yaml`
- `openspec/features/crossmint-payment-integration/architecture.md`
- `openspec/features/crossmint-payment-integration/api-contracts.md`

