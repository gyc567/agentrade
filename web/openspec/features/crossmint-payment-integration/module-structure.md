# Crossmint Payment Integration - 前端模块结构

## 1. 完整的目录树

```
src/
├── features/
│   └── payment/                          # 🎯 新增支付功能模块
│       │
│       ├── 📁 __tests__/                 # 单元测试目录
│       │   ├── PaymentOrchestrator.test.ts
│       │   ├── CrossmintService.test.ts
│       │   ├── useCrossmintCheckout.test.ts
│       │   ├── usePaymentPackages.test.ts
│       │   ├── paymentValidator.test.ts
│       │   ├── PaymentContext.test.ts
│       │   └── integration.test.ts
│       │
│       ├── 📁 components/                # UI 组件
│       │   ├── PaymentModal.tsx          # 支付弹窗容器
│       │   ├── PaymentModal.test.tsx
│       │   ├── PaymentModal.module.css
│       │   │
│       │   ├── PackageSelector.tsx       # 套餐选择器
│       │   ├── PackageSelector.test.tsx
│       │   ├── PackageSelector.module.css
│       │   │
│       │   ├── CheckoutWidget.tsx        # Crossmint Hosted Checkout 嵌入
│       │   ├── CheckoutWidget.test.tsx
│       │   │
│       │   ├── PaymentSuccess.tsx        # 成功页面
│       │   ├── PaymentSuccess.test.tsx
│       │   ├── PaymentSuccess.module.css
│       │   │
│       │   ├── PaymentError.tsx          # 错误页面
│       │   ├── PaymentError.test.tsx
│       │   ├── PaymentError.module.css
│       │   │
│       │   ├── PaymentLoading.tsx        # Loading 状态
│       │   └── PaymentLoading.module.css
│       │
│       ├── 📁 contexts/                  # React Context
│       │   ├── PaymentContext.tsx        # 支付状态容器
│       │   ├── PaymentContext.test.tsx
│       │   └── PaymentProvider.tsx       # Provider 组件
│       │
│       ├── 📁 hooks/                     # 自定义 React Hooks
│       │   ├── usePaymentPackages.ts     # 获取套餐数据
│       │   ├── usePaymentPackages.test.ts
│       │   │
│       │   ├── useCrossmintCheckout.ts   # Crossmint SDK 集成
│       │   ├── useCrossmintCheckout.test.ts
│       │   │
│       │   ├── usePaymentHistory.ts      # 支付历史（可选）
│       │   ├── usePaymentHistory.test.ts
│       │   │
│       │   └── usePaymentStatus.ts       # 支付状态管理
│       │       └── usePaymentStatus.test.ts
│       │
│       ├── 📁 services/                  # 业务逻辑与服务
│       │   ├── PaymentOrchestrator.ts    # 支付流程编排
│       │   ├── PaymentOrchestrator.test.ts
│       │   │
│       │   ├── CrossmintService.ts       # Crossmint SDK 包装
│       │   ├── CrossmintService.test.ts
│       │   │
│       │   ├── paymentValidator.ts       # 数据验证器
│       │   └── paymentValidator.test.ts
│       │
│       ├── 📁 types/                     # TypeScript 类型定义
│       │   ├── payment.ts                # 支付数据模型
│       │   ├── crossmint.ts              # Crossmint SDK 类型
│       │   └── errors.ts                 # 错误类型定义
│       │
│       ├── 📁 constants/                 # 常量定义
│       │   ├── packages.ts               # 套餐配置
│       │   ├── status.ts                 # 状态常量
│       │   ├── errorCodes.ts             # 错误码
│       │   └── chains.ts                 # 区块链配置
│       │
│       ├── 📁 utils/                     # 工具函数
│       │   ├── formatPrice.ts            # 价格格式化
│       │   ├── calculateBonus.ts         # 积分计算
│       │   ├── generatePaymentId.ts      # ID 生成
│       │   └── paymentHelpers.ts         # 其他辅助函数
│       │
│       ├── 📁 styles/                    # 全局样式
│       │   ├── payment.module.css        # 支付模块样式
│       │   └── animations.css            # 动画效果
│       │
│       ├── 📁 i18n/                      # 国际化
│       │   ├── en.json                   # 英文翻译
│       │   ├── zh.json                   # 中文翻译
│       │   └── messages.ts               # 翻译键常量
│       │
│       └── 📄 index.ts                   # 模块导出入口
│           # 导出所有公共 API
│           # - PaymentProvider, PaymentContext
│           # - usePaymentPackages, useCrossmintCheckout
│           # - PaymentModal 组件
│

# ===== 现有模块（无改动）=====
├── components/
├── contexts/
│   └── AuthContext.tsx                   # ✅ 依赖（仅读）
├── hooks/
│   └── useUserProfile.ts                 # ✅ 依赖
├── pages/
├── lib/
│   └── api.ts                            # ✅ 新增 paymentAPI 对象
├── types/
│   └── index.ts                          # ✅ 导出 Payment 类型
├── utils/
├── i18n/
└── __tests__/
```

---

## 2. 模块文件详细说明

### 2.1 核心服务层（Services）

#### `services/PaymentOrchestrator.ts`
**职责**: 编排整个支付流程的业务逻辑

```typescript
class PaymentOrchestrator {
  constructor(
    private crossmintService: CrossmintService,
    private creditsService: CreditsService,
    private validator: PaymentValidator,
  )

  // 公开方法
  validatePackage(packageId: string): PaymentPackage | null
  createPaymentSession(packageId: string): Promise<string>
  handlePaymentSuccess(orderId: string): Promise<void>
  handlePaymentError(error: PaymentError): void
  getPaymentHistory(userId: string): Promise<PaymentOrder[]>
}
```

**单元测试**: `__tests__/PaymentOrchestrator.test.ts` (8+ 用例)

---

#### `services/CrossmintService.ts`
**职责**: 封装 Crossmint SDK 的调用

```typescript
class CrossmintService {
  initializeCheckout(config: CrossmintCheckoutConfig): Promise<void>
  verifyPaymentSignature(signature: string, data: unknown): boolean
  createLineItems(package: PaymentPackage): CrossmintLineItem[]
  handleCheckoutEvent(event: CrossmintEvent): void
}
```

**单元测试**: `__tests__/CrossmintService.test.ts` (5+ 用例)

---

#### `services/paymentValidator.ts`
**职责**: 数据验证（套餐ID、价格、积分）

```typescript
export function validatePackageId(id: string): boolean
export function validatePrice(price: number): boolean
export function validateCreditsAmount(credits: number): boolean
export function validateOrder(order: PaymentOrder): ValidationResult

interface ValidationResult {
  valid: boolean
  errors?: string[]
}
```

**单元测试**: `__tests__/paymentValidator.test.ts` (6+ 用例)

---

### 2.2 React Context 层（State Management）

#### `contexts/PaymentContext.tsx`
**职责**: 全局支付状态管理

```typescript
interface PaymentContextType {
  // 状态
  selectedPackage: PaymentPackage | null
  paymentStatus: PaymentStatus
  orderId: string | null
  creditsAdded: number
  error: string | null

  // 操作
  selectPackage(packageId: string): void
  initiatePayment(packageId: string): Promise<void>
  handlePaymentSuccess(orderId: string): Promise<void>
  handlePaymentError(message: string): void
  resetPayment(): void
  clearError(): void
}

export const PaymentContext = createContext<PaymentContextType | null>(null)
```

**单元测试**: `__tests__/PaymentContext.test.ts` (4+ 用例)

---

#### `contexts/PaymentProvider.tsx`
**职责**: PaymentContext 的提供者组件

```typescript
interface PaymentProviderProps {
  children: React.ReactNode
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  // 初始化 Orchestrator
  // 管理状态
  // 提供上下文
}
```

---

### 2.3 Hooks 层（Custom React Hooks）

#### `hooks/usePaymentPackages.ts`
**职责**: 获取并缓存支付套餐数据

```typescript
interface UsePaymentPackagesReturn {
  packages: PaymentPackage[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function usePaymentPackages(): UsePaymentPackagesReturn {
  // 使用 SWR 缓存
  // 返回套餐列表
}
```

**单元测试**: `__tests__/usePaymentPackages.test.ts` (4+ 用例)

---

#### `hooks/useCrossmintCheckout.ts`
**职责**: 集成 Crossmint Hosted Checkout

```typescript
interface UseCrossmintCheckoutReturn {
  initCheckout(packageId: string): Promise<void>
  handleCheckoutEvent(event: CrossmintEvent): void
  status: PaymentStatus
  error: string | null
  orderId: string | null
}

export function useCrossmintCheckout(): UseCrossmintCheckoutReturn {
  // 初始化 SDK
  // 处理事件
  // 管理状态
}
```

**单元测试**: `__tests__/useCrossmintCheckout.test.ts` (5+ 用例)

---

#### `hooks/usePaymentHistory.ts` (可选)
**职责**: 获取用户支付历史

```typescript
interface UsePaymentHistoryReturn {
  history: PaymentOrder[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function usePaymentHistory(
  userId: string
): UsePaymentHistoryReturn
```

**单元测试**: `__tests__/usePaymentHistory.test.ts` (3+ 用例)

---

### 2.4 UI 组件层（Components）

#### `components/PaymentModal.tsx` (容器组件)
**职责**: 支付流程的主容器

```typescript
interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (creditsAdded: number) => void
  onError?: (error: string) => void
}

export function PaymentModal(props: PaymentModalProps) {
  // <PaymentProvider>
  //   <PackageSelector />
  //   <CheckoutWidget />
  //   <PaymentSuccess /> / <PaymentError />
  // </PaymentProvider>
}
```

---

#### `components/PackageSelector.tsx`
**职责**: 套餐选择卡片

```typescript
interface PackageSelectorProps {
  packages: PaymentPackage[]
  selectedPackageId?: string
  onSelect: (packageId: string) => void
  isLoading?: boolean
}
```

---

#### `components/CheckoutWidget.tsx`
**职责**: Crossmint Hosted Checkout 嵌入

```typescript
interface CheckoutWidgetProps {
  package: PaymentPackage
  onPaymentSuccess: (orderId: string) => void
  onPaymentError: (error: string) => void
  onPaymentCancelled: () => void
}
```

---

#### `components/PaymentSuccess.tsx`
**职责**: 支付成功页面

```typescript
interface PaymentSuccessProps {
  creditsAdded: number
  totalCredits: number
  onClose: () => void
}
```

---

#### `components/PaymentError.tsx`
**职责**: 错误提示页面

```typescript
interface PaymentErrorProps {
  error: string
  errorCode?: string
  onRetry: () => void
  onClose: () => void
}
```

---

### 2.5 类型定义层（Types）

#### `types/payment.ts`
```typescript
// PaymentPackage, PaymentOrder, PaymentEvent 等
// 详见 data-model.md
```

#### `types/crossmint.ts`
```typescript
// Crossmint SDK 相关的类型
interface CrossmintCheckoutConfig { ... }
interface CrossmintEvent { ... }
interface CrossmintLineItem { ... }
```

#### `types/errors.ts`
```typescript
class PaymentError extends Error { ... }
class ValidationError extends PaymentError { ... }
class CrossmintError extends PaymentError { ... }
```

---

### 2.6 常量层（Constants）

#### `constants/packages.ts`
```typescript
export const PAYMENT_PACKAGES: Record<string, PaymentPackage> = {
  starter: { ... },
  pro: { ... },
  vip: { ... },
}
```

#### `constants/errorCodes.ts`
```typescript
export const ERROR_CODES = {
  INVALID_PACKAGE: "INVALID_PACKAGE",
  UNAUTHORIZED: "UNAUTHORIZED",
  // ...
}
```

---

### 2.7 工具函数层（Utils）

#### `utils/formatPrice.ts`
```typescript
export function formatPrice(
  price: number,
  currency: string = "USDT"
): string
// "10.00 USDT"
```

#### `utils/calculateBonus.ts`
```typescript
export function calculateBonus(
  baseCredits: number,
  multiplier: number
): number
```

---

## 3. 导入导出规范

### 3.1 模块导入（Internal）

```typescript
// ❌ 不推荐：深入导入
import { PaymentOrchestrator } from "../services/PaymentOrchestrator"

// ✅ 推荐：通过 index.ts 导入
import { PaymentOrchestrator } from "../services"
```

### 3.2 公开 API（在 `index.ts` 中导出）

```typescript
// features/payment/index.ts

// Context & Provider
export { PaymentContext } from "./contexts/PaymentContext"
export { PaymentProvider } from "./contexts/PaymentProvider"

// Hooks
export { usePaymentPackages } from "./hooks/usePaymentPackages"
export { useCrossmintCheckout } from "./hooks/useCrossmintCheckout"
export { usePaymentHistory } from "./hooks/usePaymentHistory"

// Components
export { PaymentModal } from "./components/PaymentModal"

// Types
export type {
  PaymentOrder,
  PaymentPackage,
  PaymentContextType,
} from "./types/payment"

// Constants
export { PAYMENT_PACKAGES } from "./constants/packages"
export { ERROR_CODES } from "./constants/errorCodes"
```

### 3.3 使用方式

```typescript
// 在其他页面中
import { PaymentModal, usePaymentPackages } from "@/features/payment"

export function ProfilePage() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const { packages } = usePaymentPackages()

  return (
    <>
      <button onClick={() => setIsPaymentOpen(true)}>充值</button>
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />
    </>
  )
}
```

---

## 4. 文件命名规范

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| React 组件 | PascalCase + .tsx | `PaymentModal.tsx` |
| React 文件夹 | kebab-case | `payment-modal/` |
| Hook 函数 | camelCase + use 前缀 + .ts | `usePaymentPackages.ts` |
| Service 类 | PascalCase + Service 后缀 + .ts | `CrossmintService.ts` |
| 工具函数 | camelCase + .ts | `formatPrice.ts` |
| 常量文件 | camelCase + .ts | `errorCodes.ts` |
| 类型文件 | camelCase + .ts | `payment.ts` |
| CSS 模块 | kebab-case + .module.css | `payment-modal.module.css` |
| 测试文件 | [源文件名].test.ts[x] | `PaymentModal.test.tsx` |

---

## 5. 层级关系与导入规则

```
┌─────────────────────────────────────┐
│ Components (UI Layer)               │
│ - PaymentModal, PackageSelector     │
└──────────────┬──────────────────────┘
               │ can import
               ▼
┌─────────────────────────────────────┐
│ Hooks (Integration Layer)           │
│ - usePaymentPackages                │
│ - useCrossmintCheckout              │
└──────────────┬──────────────────────┘
               │ can import
               ▼
┌─────────────────────────────────────┐
│ Services (Business Logic Layer)     │
│ - PaymentOrchestrator               │
│ - CrossmintService                  │
└──────────────┬──────────────────────┘
               │ can import
               ▼
┌─────────────────────────────────────┐
│ Types + Constants + Utils           │
│ (Data & Configuration Layer)        │
└─────────────────────────────────────┘

⚠️ 禁止向上导入 (不能违反依赖关系)
✅ 只能向下导入
```

---

## 6. 文件大小与复杂度指南

| 文件类型 | 推荐行数 | 目标 |
|---------|---------|------|
| 组件 (TSX) | < 200 行 | 单一责任，逻辑简单 |
| Hook | < 100 行 | 单一数据流 |
| Service 类 | < 150 行 | 清晰的方法划分 |
| 工具函数 | < 50 行 | 纯函数，无副作用 |
| 类型定义 | 无限制 | 描述性尽可能清晰 |

---

## 7. 测试文件位置规则

```
测试文件必须与源文件在同一目录下

✅ 正确：
src/features/payment/
├── services/
│   ├── PaymentOrchestrator.ts
│   └── PaymentOrchestrator.test.ts
├── hooks/
│   ├── usePaymentPackages.ts
│   └── usePaymentPackages.test.ts
```

---

## 总结

- **特性模块化**: 所有支付相关代码都在 `src/features/payment/` 下
- **分层清晰**: Component → Hook → Service → Types/Constants/Utils
- **导出规范**: 统一通过 `index.ts` 导出公开 API
- **命名一致**: PascalCase 组件，camelCase 函数
- **测试并置**: 测试文件与源文件同目录
- **零破坏**: 不修改现有代码，仅添加新模块
