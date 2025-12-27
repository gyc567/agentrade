# Crossmint Payment Integration - 架构设计

## 1. 系统架构（System Architecture）

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────┐
│              Presentation Layer                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  PaymentModal / CheckoutPage (UI组件)      │   │
│  │  ├─ 套餐选择 (PackageSelector)             │   │
│  │  ├─ Crossmint Hosted Checkout             │   │
│  │  └─ 状态展示 (Success/Error/Loading)      │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ React Components
                     │
┌────────────────────▼────────────────────────────────┐
│            Domain Layer (Business Logic)            │
│  ┌─────────────────────────────────────────────┐   │
│  │  PaymentOrchestrator (业务流程编排)        │   │
│  │  ├─ validatePackage()                      │   │
│  │  ├─ createPaymentSession()                 │   │
│  │  ├─ handlePaymentSuccess()                 │   │
│  │  └─ handlePaymentError()                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  PaymentPackage (值对象)                   │   │
│  │  ├─ id: "starter" | "pro" | "vip"         │   │
│  │  ├─ price: number (USDT)                   │   │
│  │  ├─ credits: number                        │   │
│  │  └─ bonus: number (赠送积分)               │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ Service Classes
                     │
┌────────────────────▼────────────────────────────────┐
│           Service Layer (API & Integration)        │
│  ┌─────────────────────────────────────────────┐   │
│  │  CrossmintService (Crossmint SDK 包装)    │   │
│  │  ├─ initializeCheckout()                   │   │
│  │  └─ verifyPaymentSignature()               │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  CreditsService (与现有积分系统交互)        │   │
│  │  └─ addCreditsToUser()                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │  paymentValidator (数据验证)                │   │
│  │  ├─ validatePackageId()                    │   │
│  │  ├─ validatePrice()                        │   │
│  │  └─ validateCreditsAmount()                │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/SDK Calls
                     │
┌────────────────────▼────────────────────────────────┐
│         Infrastructure Layer (外部系统)            │
│  ├─ Crossmint API (@crossmint/client-sdk-react-ui)│
│  ├─ Backend API (/api/payments/*)                 │
│  └─ Webhook Handler (/api/webhooks/crossmint)     │
└─────────────────────────────────────────────────────┘
```

### 1.2 分层职责

| 层级 | 职责 | 示例 |
|------|------|------|
| **Presentation** | UI 渲染、用户交互 | 按钮点击、表单填充 |
| **Domain** | 业务逻辑、流程编排 | 支付流程控制、数据验证 |
| **Service** | 外部集成、API 调用 | Crossmint SDK、后端 HTTP |
| **Infrastructure** | 技术细节 | 网络请求、SDK 初始化 |

---

## 2. 模块依赖关系（Module Dependencies）

### 2.1 依赖图

```
┌──────────────────────┐
│   PaymentModal       │ (入口UI组件)
│   (Presentation)     │
└──────────┬───────────┘
           │ uses
           ▼
┌──────────────────────┐
│  PaymentContext      │ (全局状态)
│  (Context/Hooks)     │
└──────────┬───────────┘
           │ uses
           ▼
┌──────────────────────┐
│  PaymentOrchestrator │ (业务流程)
│  (Domain)            │
└──────────┬───────────┘
           │ uses
           ├─────────────────┬─────────────────┐
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Validator   │  │  Crossmint   │  │  Credits     │
    │  Service     │  │  Service     │  │  Service     │
    │  (Domain)    │  │  (Service)   │  │  (Service)   │
    └──────────────┘  └──────────────┘  └──────────────┘
           │                 │                 │
           │ calls           │ calls           │ calls
           │                 │                 │
           ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  types.ts    │  │  Crossmint   │  │  Backend     │
    │  (Constants) │  │  SDK API     │  │  API         │
    │              │  │              │  │  /api/...    │
    └──────────────┘  └──────────────┘  └──────────────┘
```

### 2.2 依赖注入模式

```typescript
// PaymentOrchestrator 接收所有依赖作为构造参数
class PaymentOrchestrator {
  constructor(
    private crossmintService: CrossmintService,
    private creditsService: CreditsService,
    private validator: PaymentValidator,
  ) {}
}

// 在 PaymentContext 中初始化
const PaymentProvider = ({ children }) => {
  const orchestrator = new PaymentOrchestrator(
    new CrossmintService(),
    new CreditsService(api),
    new PaymentValidator(),
  )
  // ...
}
```

---

## 3. 状态管理（State Management）

### 3.1 PaymentContext 结构

```typescript
interface PaymentContextType {
  // 状态
  selectedPackage: PaymentPackage | null
  paymentStatus: 'idle' | 'loading' | 'success' | 'error'
  orderId: string | null
  creditsAdded: number
  error: string | null

  // 操作
  selectPackage: (packageId: string) => void
  initiatePayment: (packageId: string) => Promise<void>
  handlePaymentSuccess: (crossmintOrderId: string) => Promise<void>
  handlePaymentError: (errorMessage: string) => void
  resetPayment: () => void
  clearError: () => void
}
```

### 3.2 状态流转图（State Machine）

```
                        ┌─────────────────────────────┐
                        │                             │
                        │      [idle]  (初始)         │
                        │                             │
                        └────────┬────────────────────┘
                                 │ selectPackage()
                                 ▼
                        ┌─────────────────────────────┐
                        │                             │
                   ┌────┤  [loading]                  │
                   │    │  (支付中)                   │
                   │    │                             │
                   │    └────────┬──────┬────────────┘
                   │             │      │
        成功(✓)    │            ✓       ✗ (失败)
                   │             │      │
                   ▼             ▼      ▼
            [success]    [error] ──→ [loading]
            (完成)       (临时)     (重试)
            │                │
            │                ▼
            └────→ [idle] ←─┘
             resetPayment() / timeout
```

---

## 4. 数据流（Data Flow）

### 4.1 完整支付流程

```
┌─────────────────────────────────────────────────────────────┐
│ 用户选择套餐                                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ PaymentContext.selectPackage(packageId)                     │
│ - validatePackageId()                                       │
│ - 更新 selectedPackage 状态                                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ <CrossmintHostedCheckout /> 组件渲染                       │
│ - 将套餐信息转换为 lineItems                                │
│ - 初始化支付窗口                                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 用户连接钱包（MetaMask/WalletConnect）                     │
│ - Crossmint SDK 处理钱包连接                               │
│ - Crossmint SDK 处理 USDT 转账签署                         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 区块链确认交易                                              │
│ - 交易被打包进区块                                          │
│ - Crossmint 服务器收到链上确认                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ Crossmint onEvent("checkout:order.paid")                   │
│ - 触发 handlePaymentSuccess()                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ PaymentOrchestrator.handlePaymentSuccess(orderId)          │
│ - POST /api/payments/confirm { orderId, signature }        │
│ - 后端验证签名，确认支付，加积分                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 更新本地状态                                                │
│ - paymentStatus = 'success'                                │
│ - creditsAdded = x                                         │
│ - 显示成功页面                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 后端发送 Webhook (order.paid)                               │
│ - 确保幂等性（防重复加积分）                                │
│ - 更新支付记录                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 错误处理流程

```
┌──────────────────────────────────────────┐
│ 支付失败事件                             │
│ (onEvent("checkout:order.failed"))       │
└─────────────────┬────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    [User 取消]        [链上失败]
        │                   │
        ▼                   ▼
┌──────────────────────────────────────────┐
│ handlePaymentError(errorMessage)         │
│ - paymentStatus = 'error'                │
│ - error = 用户友好的错误提示              │
│ - 不加积分                               │
└─────────────────┬────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
   [显示错误提示]      [重试按钮]
   [关闭弹窗]         [重新选择套餐]
```

---

## 5. 与现有系统的集成点（Integration Points）

### 5.1 集成关系表

| 系统模块 | 集成类型 | 数据流向 | 是否修改 |
|---------|---------|--------|--------|
| AuthContext | 依赖 | 读 user.id | ❌ 否 |
| useUserCredits | 依赖 | 读 credits，支付后调用 refresh | ❌ 否 |
| lib/api.ts | 依赖 | 新增 paymentAPI 对象 | ✅ 新增 |
| types.ts | 依赖 | 新增 PaymentOrder, PaymentPackage 类型 | ✅ 新增 |
| 路由系统 (App.tsx) | 依赖 | 在 /profile 添加 "充值" 按钮 | ✅ 新增 |
| localStorage | 依赖 | 存储 payment_ 前缀的临时数据 | ✅ 新增 |

### 5.2 集成契约（Integration Contracts）

```typescript
// 1. 从 AuthContext 读取用户ID
const { user } = useAuth()
// 假设 user.id 已存在，不为 null

// 2. 刷新积分（支付成功后）
const { mutate: refreshCredits } = useUserCredits()
await refreshCredits() // 触发重新获取积分

// 3. 调用后端 API
const response = await api.payments.confirm({
  orderId: string,
  signature: string,
})

// 4. 现有功能保持不变
// - 交易员管理不受影响
// - 用户登录流程不受影响
// - 积分消耗逻辑不受影响
```

---

## 6. 关键设计决策（Key Design Decisions）

### 6.1 为什么使用 Context 而不是 Zustand?

**原因:**
- 支付功能是**短生命周期状态**（Modal 打开→支付→关闭）
- Context + useState 已足够处理
- Zustand 引入额外复杂度，违反 KISS 原则
- 项目已使用 Context for Auth，保持一致性

### 6.2 为什么完全依赖 Crossmint SDK 处理钱包?

**原因:**
- Crossmint SDK 已完美处理：钱包连接、签署、重试、错误处理
- 我们不应该重复发明轮子
- 前端不应该关心钱包细节（关注点分离）
- 降低安全风险（不自己管理 Private Keys）

### 6.3 为什么强制 Webhook 验证?

**原因:**
- 支付是**财务操作**，必须防篡改
- 无签名验证 = 任何人都能发送假支付成功消息
- HMAC-SHA256 验证成本低，防护强

---

## 7. 扩展性设计（Extensibility）

### 7.1 新增支付方式（假设将来支持 Stripe）

```typescript
// 当前
class PaymentOrchestrator {
  constructor(
    private crossmintService: CrossmintService,
    ...
  )
}

// 未来扩展
interface PaymentProvider {
  initializeCheckout(package: PaymentPackage): Promise<CheckoutSession>
  verifyPayment(signature: string): Promise<boolean>
}

class PaymentOrchestrator {
  constructor(
    private providers: PaymentProvider[], // 支持多个支付商
    ...
  )

  async initiatePayment(packageId: string, providerType: 'crossmint' | 'stripe') {
    const provider = this.providers.find(p => p.type === providerType)
    // ...
  }
}

// 新增 StripeService implements PaymentProvider
```

### 7.2 新增套餐（零代码改动）

```typescript
// 在配置文件中添加
const PAYMENT_PACKAGES = {
  starter: { /* ... */ },
  pro: { /* ... */ },
  vip: { /* ... */ },
  elite: { /* ... */ }, // ✅ 直接添加，组件自动适配
}
```

---

## 8. 性能优化（Performance Considerations）

### 8.1 加载优化

- **懒加载 Crossmint SDK**：仅在用户打开支付 Modal 时加载
- **套餐数据缓存**：使用 SWR 自动缓存，5 分钟 TTL
- **代码分割**：Payment 模块单独打包

### 8.2 网络优化

- **Webhook 重试**：指数退避，最多 3 次
- **支付确认缓存**：5 分钟内相同订单返回缓存结果
- **并行请求**：验证和加积分并行执行

---

## 总结

本架构遵循 **Onion Architecture**（洋葱架构）：
- 清晰的分层（Presentation → Domain → Service → Infrastructure）
- 依赖指向内层（UI 依赖 Domain，Service 依赖 Domain 的接口）
- 强大的可测试性
- 易于扩展和维护
