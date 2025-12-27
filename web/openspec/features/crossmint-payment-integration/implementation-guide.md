# Crossmint Payment Integration - 实施指南

## 1. 5 个阶段的实施计划

```
┌───────────────────────────────────────────────────────────┐
│ Phase 1: Foundation (3-4 小时)                            │
│ ├─ 类型定义、常量、验证器                                │
│ └─ 目标: 建立坚实的基础                                  │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 2: Services (2-3 小时)                              │
│ ├─ PaymentOrchestrator、CrossmintService                 │
│ └─ 目标: 业务逻辑层完成                                  │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 3: Frontend (4-5 小时)                              │
│ ├─ Context、Hooks、Components                             │
│ └─ 目标: UI 完整可运行                                   │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 4: Testing (2-3 小时)                               │
│ ├─ 单元测试、集成测试、E2E 测试                         │
│ └─ 目标: 100% 覆盖率                                     │
└───────────────────────────────────────────────────────────┘
                          ↓
┌───────────────────────────────────────────────────────────┐
│ Phase 5: Documentation (1-2 小时)                         │
│ ├─ README、API 文档、上线清单                            │
│ └─ 目标: 文档完整，准备上线                             │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Foundation (基础构建)

### 2.1 创建目录结构

```bash
# 在项目根目录执行
mkdir -p src/features/payment/{__tests__,components,contexts,hooks,services,types,constants,utils,styles,i18n}

# 创建基础文件
touch src/features/payment/index.ts
touch src/features/payment/types/payment.ts
touch src/features/payment/types/crossmint.ts
touch src/features/payment/types/errors.ts
touch src/features/payment/constants/packages.ts
touch src/features/payment/constants/errorCodes.ts
touch src/features/payment/constants/chains.ts
touch src/features/payment/services/paymentValidator.ts
```

### 2.2 实施 types/payment.ts

```typescript
// src/features/payment/types/payment.ts

export interface PaymentPackage {
  id: "starter" | "pro" | "vip"
  name: string
  description: string
  price: {
    amount: number
    currency: "USDT"
    chainPreference?: string
  }
  credits: {
    amount: number
    bonusMultiplier?: number
    bonusAmount?: number
  }
  badge?: string
  highlightColor?: string
  availableFrom?: Date
  availableUntil?: Date
  metadata?: Record<string, any>
}

export interface PaymentOrder {
  id: string
  crossmintOrderId: string
  userId: string
  packageId: "starter" | "pro" | "vip"
  packageSnapshot: {
    name: string
    credits: number
    bonusCredits: number
    totalCredits: number
  }
  payment: {
    amount: number
    currency: "USDT"
    chainUsed?: string
    transactionHash?: string
    confirmations?: number
  }
  status: "pending" | "paid" | "completed" | "failed" | "cancelled"
  statusHistory: Array<{
    status: string
    timestamp: Date
    reason?: string
  }>
  createdAt: Date
  paidAt?: Date
  completedAt?: Date
  credits: {
    baseCredits: number
    bonusCredits: number
    totalCredits: number
    addedToUserAt?: Date
  }
  verification: {
    signature?: string
    verified: boolean
    verifiedAt?: Date
  }
  metadata?: any
  retryCount: number
  errors?: Array<{
    code: string
    message: string
    timestamp: Date
  }>
}

export type PaymentEventType =
  | "payment.initialized"
  | "payment.pending"
  | "payment.confirmed"
  | "payment.failed"
  | "payment.cancelled"
  | "credits.added"
  | "credits.additionFailed"

export interface PaymentEvent {
  type: PaymentEventType
  orderId: string
  userId: string
  timestamp: Date
  payload: {
    packageId?: string
    amount?: number
    credits?: number
    reason?: string
    error?: {
      code: string
      message: string
    }
  }
  metadata?: {
    version: string
    source: "frontend" | "backend" | "webhook"
  }
}

export interface PaymentContextType {
  selectedPackage: PaymentPackage | null
  paymentStatus: "idle" | "loading" | "success" | "error"
  orderId: string | null
  creditsAdded: number
  error: string | null
  selectPackage: (packageId: string) => void
  initiatePayment: (packageId: string) => Promise<void>
  handlePaymentSuccess: (crossmintOrderId: string) => Promise<void>
  handlePaymentError: (errorMessage: string) => void
  resetPayment: () => void
  clearError: () => void
}
```

### 2.3 实施 constants/packages.ts

```typescript
// src/features/payment/constants/packages.ts

import type { PaymentPackage } from "../types/payment"

export const PAYMENT_PACKAGES: Record<
  "starter" | "pro" | "vip",
  PaymentPackage
> = {
  starter: {
    id: "starter",
    name: "初级套餐",
    description: "适合新手用户体验",
    price: {
      amount: 10,
      currency: "USDT",
      chainPreference: "polygon",
    },
    credits: {
      amount: 500,
      bonusMultiplier: 1.0,
      bonusAmount: 0,
    },
  },
  pro: {
    id: "pro",
    name: "专业套餐",
    description: "专业交易者的选择",
    price: {
      amount: 50,
      currency: "USDT",
      chainPreference: "base",
    },
    credits: {
      amount: 3000,
      bonusMultiplier: 1.1,
      bonusAmount: 300,
    },
    badge: "HOT",
  },
  vip: {
    id: "vip",
    name: "VIP 套餐",
    description: "最大价值，享受 20% 额外奖励",
    price: {
      amount: 100,
      currency: "USDT",
      chainPreference: "arbitrum",
    },
    credits: {
      amount: 8000,
      bonusMultiplier: 1.2,
      bonusAmount: 1600,
    },
    badge: "BEST SAVE",
    highlightColor: "#FFD700",
  },
}

export const PACKAGE_IDS = ["starter", "pro", "vip"] as const
```

### 2.4 实施 services/paymentValidator.ts

```typescript
// src/features/payment/services/paymentValidator.ts

import { PAYMENT_PACKAGES, PACKAGE_IDS } from "../constants/packages"
import type { PaymentPackage, PaymentOrder } from "../types/payment"

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

export function validatePackageId(id: unknown): id is keyof typeof PAYMENT_PACKAGES {
  return typeof id === "string" && PACKAGE_IDS.includes(id as any)
}

export function validatePrice(price: unknown): boolean {
  if (typeof price !== "number") return false
  return price > 0 && price <= 1000 && Number.isFinite(price)
}

export function validateCreditsAmount(credits: unknown): boolean {
  if (typeof credits !== "number") return false
  return credits > 0 && credits <= 100000 && Number.isInteger(credits)
}

export function getPackage(id: unknown): PaymentPackage | null {
  if (!validatePackageId(id)) return null
  return PAYMENT_PACKAGES[id]
}

export function validateOrder(order: unknown): ValidationResult {
  const errors: string[] = []
  const o = order as any

  if (!o?.id || typeof o.id !== "string") {
    errors.push("Order ID is required")
  }

  if (!o?.userId || typeof o.userId !== "string") {
    errors.push("User ID is required")
  }

  if (!o?.packageId || !validatePackageId(o.packageId)) {
    errors.push("Invalid package ID")
  }

  if (!validatePrice(o?.payment?.amount)) {
    errors.push("Invalid payment amount")
  }

  if (!validateCreditsAmount(o?.credits?.totalCredits)) {
    errors.push("Invalid credits amount")
  }

  if (
    !["pending", "paid", "completed", "failed", "cancelled"].includes(
      o?.status
    )
  ) {
    errors.push("Invalid order status")
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}
```

### 2.5 运行 Phase 1 测试

```bash
# 验证类型定义
npm run type-check

# 运行基础单元测试
npm run test -- src/features/payment/types
npm run test -- src/features/payment/constants
npm run test -- src/features/payment/services/paymentValidator.test.ts

# 验证覆盖率
npm run test:coverage -- src/features/payment/services
```

---

## 3. Phase 2: Services (业务逻辑)

### 3.1 实施 PaymentOrchestrator.ts

```typescript
// src/features/payment/services/PaymentOrchestrator.ts

import { getPackage, validatePackageId } from "./paymentValidator"
import type { PaymentPackage } from "../types/payment"

export class PaymentOrchestrator {
  constructor(
    private crossmintService: any, // 简化示意
    private creditsService: any,
    private validator: any,
  ) {}

  validatePackage(packageId: unknown): PaymentPackage | null {
    return getPackage(packageId)
  }

  async createPaymentSession(packageId: string): Promise<string> {
    const pkg = this.validatePackage(packageId)
    if (!pkg) {
      throw new Error("INVALID_PACKAGE")
    }

    const sessionId = await this.crossmintService.initializeCheckout({
      lineItems: [
        {
          price: pkg.price.amount.toString(),
          currency: pkg.price.currency,
          quantity: 1,
          metadata: {
            packageId: pkg.id,
            credits: pkg.credits.amount + (pkg.credits.bonusAmount || 0),
          },
        },
      ],
      checkoutProps: {
        payment: {
          allowedMethods: ["crypto"],
        },
        preferredChains: ["polygon", "base", "arbitrum"],
      },
    })

    return sessionId
  }

  async handlePaymentSuccess(orderId: string): Promise<void> {
    // 确认支付并加积分
    const response = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
      },
      body: JSON.stringify({
        orderId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    return await response.json()
  }

  handlePaymentError(error: Error): void {
    console.error("Payment error:", error)
    // 记录错误，用于监控和告警
  }
}
```

### 3.2 实施 CrossmintService.ts

```typescript
// src/features/payment/services/CrossmintService.ts

declare global {
  interface Window {
    __crossmint?: any
  }
}

export class CrossmintService {
  private apiKey: string

  constructor() {
    this.apiKey =
      process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY || ""

    if (!this.apiKey) {
      console.warn(
        "Crossmint API Key not configured. Payment feature will not work."
      )
    }
  }

  async initializeCheckout(config: any): Promise<string> {
    // 初始化 Crossmint SDK
    // 这里实际上由 React 组件处理
    return Promise.resolve("checkout-initialized")
  }

  createLineItems(pkg: any): any[] {
    return [
      {
        price: pkg.price.amount.toString(),
        currency: pkg.price.currency,
        quantity: 1,
        metadata: {
          packageId: pkg.id,
          credits: pkg.credits.amount + (pkg.credits.bonusAmount || 0),
        },
      },
    ]
  }

  handleCheckoutEvent(event: any): void {
    // 处理 Crossmint 事件
    console.log("Checkout event:", event.type)
  }
}
```

---

## 4. Phase 3: Frontend (UI 实现)

### 4.1 实施 PaymentContext.tsx

```typescript
// src/features/payment/contexts/PaymentContext.tsx

import React, { createContext, useContext, useState } from "react"
import type { PaymentContextType, PaymentPackage } from "../types/payment"
import { PaymentOrchestrator } from "../services/PaymentOrchestrator"
import { CrossmintService } from "../services/CrossmintService"

export const PaymentContext = createContext<PaymentContextType | null>(null)

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const [selectedPackage, setSelectedPackage] =
    useState<PaymentPackage | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentContextType["paymentStatus"]>(
    "idle"
  )
  const [orderId, setOrderId] = useState<string | null>(null)
  const [creditsAdded, setCreditsAdded] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const orchestrator = new PaymentOrchestrator(
    new CrossmintService(),
    {},
    {}
  )

  const selectPackage = (packageId: string) => {
    const pkg = orchestrator.validatePackage(packageId)
    if (pkg) {
      setSelectedPackage(pkg)
    }
  }

  const initiatePayment = async (packageId: string) => {
    setPaymentStatus("loading")
    setError(null)

    try {
      const sessionId = await orchestrator.createPaymentSession(packageId)
      console.log("Payment session created:", sessionId)
    } catch (err) {
      setError((err as Error).message)
      setPaymentStatus("error")
    }
  }

  const handlePaymentSuccess = async (crossmintOrderId: string) => {
    setPaymentStatus("loading")

    try {
      const result = await orchestrator.handlePaymentSuccess(
        crossmintOrderId
      )
      setCreditsAdded(result.creditsAdded)
      setOrderId(result.order.id)
      setPaymentStatus("success")
    } catch (err) {
      setError((err as Error).message)
      setPaymentStatus("error")
    }
  }

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage)
    setPaymentStatus("error")
  }

  const resetPayment = () => {
    setSelectedPackage(null)
    setPaymentStatus("idle")
    setOrderId(null)
    setCreditsAdded(0)
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  const value: PaymentContextType = {
    selectedPackage,
    paymentStatus,
    orderId,
    creditsAdded,
    error,
    selectPackage,
    initiatePayment,
    handlePaymentSuccess,
    handlePaymentError,
    resetPayment,
    clearError,
  }

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  )
}

export function usePaymentContext(): PaymentContextType {
  const context = useContext(PaymentContext)
  if (!context) {
    throw new Error(
      "usePaymentContext must be used within PaymentProvider"
    )
  }
  return context
}
```

### 4.2 实施简单的 PaymentModal.tsx

```typescript
// src/features/payment/components/PaymentModal.tsx

import React, { useState } from "react"
import { usePaymentContext } from "../contexts/PaymentContext"
import { usePaymentPackages } from "../hooks/usePaymentPackages"
import { CrossmintProvider, CrossmintHostedCheckout } from "@crossmint/client-sdk-react-ui"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (creditsAdded: number) => void
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const context = usePaymentContext()
  const { packages } = usePaymentPackages()

  if (!isOpen) return null

  const handlePackageSelect = (packageId: string) => {
    context.selectPackage(packageId)
  }

  const handleCheckoutEvent = (event: any) => {
    if (event.type === "checkout:order.paid") {
      context.handlePaymentSuccess(event.payload.orderId)
    } else if (event.type === "checkout:order.failed") {
      context.handlePaymentError("Payment failed")
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY

  return (
    <div className="modal-overlay">
      <div className="modal">
        <button onClick={onClose} className="close-btn">
          ✕
        </button>

        {context.paymentStatus === "idle" && (
          <div>
            <h2>选择积分套餐</h2>
            <div className="packages">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  className={`package-card ${
                    context.selectedPackage?.id === pkg.id ? "selected" : ""
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <h3>{pkg.name}</h3>
                  <p>{pkg.price.amount} USDT</p>
                  <p>
                    {pkg.credits.amount +
                      (pkg.credits.bonusAmount || 0)}{" "}
                    积分
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {context.selectedPackage && context.paymentStatus === "idle" && (
          <CrossmintProvider apiKey={apiKey!}>
            <CrossmintHostedCheckout
              lineItems={[
                {
                  price: context.selectedPackage.price.amount.toString(),
                  currency: "USDT",
                  quantity: 1,
                  metadata: {
                    packageId: context.selectedPackage.id,
                  },
                },
              ]}
              checkoutProps={{
                payment: { allowedMethods: ["crypto"] },
                preferredChains: ["polygon", "base", "arbitrum"],
              }}
              onEvent={handleCheckoutEvent}
            />
          </CrossmintProvider>
        )}

        {context.paymentStatus === "loading" && (
          <div className="loading">正在处理支付...</div>
        )}

        {context.paymentStatus === "success" && (
          <div className="success">
            <h3>✓ 支付成功！</h3>
            <p>已获得 {context.creditsAdded} 积分</p>
            <button
              onClick={() => {
                context.resetPayment()
                onClose()
                onSuccess?.(context.creditsAdded)
              }}
            >
              完成
            </button>
          </div>
        )}

        {context.paymentStatus === "error" && (
          <div className="error">
            <h3>✕ 支付失败</h3>
            <p>{context.error}</p>
            <button
              onClick={() => {
                context.resetPayment()
              }}
            >
              重试
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4.3 运行 Phase 3 验证

```bash
# TypeScript 类型检查
npm run type-check

# 编译检查
npm run build

# 启动开发服务器测试
npm run dev
```

---

## 5. Phase 4: Testing (测试覆盖)

### 5.1 运行测试

```bash
# 运行所有测试
npm run test -- src/features/payment

# 监听模式
npm run test:watch -- src/features/payment

# 生成覆盖率报告
npm run test:coverage -- src/features/payment

# 验证 100% 覆盖率
npm run test:coverage -- --check src/features/payment
```

### 5.2 测试清单

- [ ] paymentValidator 单元测试通过
- [ ] PaymentOrchestrator 单元测试通过
- [ ] CrossmintService 单元测试通过
- [ ] PaymentContext 集成测试通过
- [ ] 所有 Hook 测试通过
- [ ] 所有组件测试通过
- [ ] E2E 测试通过（5 个场景）
- [ ] 覆盖率达到 100%
- [ ] 回归测试通过（现有功能未破坏）

---

## 6. Phase 5: Documentation & Deployment

### 6.1 部署清单

- [ ] 所有代码 review 通过
- [ ] 测试覆盖率 100%
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 警告
- [ ] API 文档完整
- [ ] README 已更新
- [ ] 环境变量文档已添加
- [ ] 后端 API 已部署
- [ ] Webhook Secret 已配置
- [ ] 监控告警已设置

### 6.2 上线前检查清单

```bash
#!/bin/bash
# pre-deployment-checks.sh

echo "🔍 Running pre-deployment checks..."

# 1. 类型检查
echo "✓ Checking TypeScript types..."
npm run type-check || exit 1

# 2. 测试覆盖率
echo "✓ Checking test coverage..."
npm run test:coverage -- --check src/features/payment || exit 1

# 3. 构建
echo "✓ Building project..."
npm run build || exit 1

# 4. Linting
echo "✓ Linting code..."
npm run lint || exit 1

# 5. E2E 测试
echo "✓ Running E2E tests..."
npm run test:e2e || exit 1

echo "✅ All checks passed! Ready to deploy."
```

### 6.3 部署步骤

```bash
# 1. 创建发布分支
git checkout -b release/payment-feature

# 2. 提交所有更改
git add .
git commit -m "feat(payment): integrate Crossmint Web3 payment"

# 3. 推送到远程
git push origin release/payment-feature

# 4. 创建 Pull Request
# (通过 GitHub UI)

# 5. 获得批准

# 6. 合并到 main
git checkout main
git merge release/payment-feature

# 7. 部署到生产
# (通过 CI/CD 流程)
```

---

## 7. 常见问题与陷阱

### 7.1 陷阱 #1: Context 提供者位置错误

❌ **错误**:
```typescript
export function PaymentModal() {
  return (
    <PaymentProvider>
      <Content />
    </PaymentProvider>
  )
}
```

✅ **正确**:
```typescript
// 在 App 级别或页面顶部
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

### 7.2 陷阱 #2: 忘记导出公开 API

```typescript
// ✅ src/features/payment/index.ts
export { PaymentProvider, usePaymentContext } from "./contexts/PaymentContext"
export { usePaymentPackages } from "./hooks/usePaymentPackages"
export { PaymentModal } from "./components/PaymentModal"
export type { PaymentOrder, PaymentPackage } from "./types/payment"
```

### 7.3 陷阱 #3: 混合使用 Context 和 Props

❌ **不要同时用两种方式传递状态**

✅ **要么用 Context，要么用 Props，保持一致**

### 7.4 陷阱 #4: 在 Render 中调用 async 函数

❌ **错误**:
```typescript
function Component() {
  return <div>{confirmPayment(orderId)}</div> // ❌ 在 render 中调用
}
```

✅ **正确**:
```typescript
function Component() {
  useEffect(() => {
    confirmPayment(orderId) // ✅ 在 effect 中调用
  }, [orderId])
}
```

### 7.5 陷阱 #5: 忘记验证用户输入

```typescript
// ❌ 危险
const handlePackageSelect = (packageId: string) => {
  context.selectPackage(packageId) // 没有验证
}

// ✅ 安全
const handlePackageSelect = (packageId: unknown) => {
  if (validatePackageId(packageId)) {
    context.selectPackage(packageId)
  } else {
    setError("Invalid package")
  }
}
```

---

## 总结

✅ **按照 5 个阶段实施**
1. Foundation - 类型和常量
2. Services - 业务逻辑
3. Frontend - UI 组件
4. Testing - 100% 覆盖
5. Documentation - 上线准备

✅ **持续验证**
- 每个阶段结束运行测试
- 保持 100% 类型安全
- 避免常见陷阱

✅ **准备好上线**
- 所有清单完成
- 部署流程清晰
- 监控告警就位

