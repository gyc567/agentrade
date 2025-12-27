# Crossmint Payment Integration - 数据模型

## 1. 值对象（Value Objects）

### 1.1 PaymentPackage（支付套餐）

```typescript
/**
 * 不可变的支付套餐值对象
 * 代表一个固定的积分购买选项
 */
interface PaymentPackage {
  // 唯一标识
  id: "starter" | "pro" | "vip"

  // 基本信息
  name: string                    // e.g., "初级套餐"
  description: string             // e.g., "适合新手用户"

  // 价格信息
  price: {
    amount: number               // 10, 50, 100
    currency: "USDT"             // 仅支持 USDT
    chainPreference?: string      // "polygon" | "base" | "arbitrum"
  }

  // 积分信息
  credits: {
    amount: number               // 500, 3000, 8000
    bonusMultiplier?: number     // 1.0, 1.1, 1.2（赠送比例）
    bonusAmount?: number         // 计算出的赠送积分数
  }

  // 展示信息
  badge?: string                 // "HOT" | "BEST" | "SAVE 10%"
  highlightColor?: string        // CSS 颜色值

  // 有效期
  availableFrom?: Date
  availableUntil?: Date

  // 元数据
  metadata?: Record<string, any>
}

// 🔧 工厂函数，创建固定的套餐配置
export const PAYMENT_PACKAGES: Record<string, PaymentPackage> = {
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
    badge: undefined,
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
```

### 1.2 PaymentOrder（支付订单）

```typescript
/**
 * 支付订单聚合根
 * 代表用户与 Crossmint 之间的一次支付交易
 *
 * 生命周期：
 *   pending → paid → completed
 *             ↓
 *           failed
 */
interface PaymentOrder {
  // === 基本标识符 ===
  id: string                      // 我们的订单 ID（UUID）
  crossmintOrderId: string        // Crossmint 返回的订单 ID

  // === 用户信息 ===
  userId: string                  // 用户 ID（来自 AuthContext）

  // === 套餐信息 ===
  packageId: "starter" | "pro" | "vip"
  packageSnapshot: {              // 订单创建时的套餐快照
    name: string
    credits: number
    bonusCredits: number
    totalCredits: number          // credits + bonus
  }

  // === 支付信息 ===
  payment: {
    amount: number                // 10, 50, 100 (USDT)
    currency: "USDT"
    chainUsed?: string             // "polygon" | "base" | "arbitrum"
    transactionHash?: string      // 区块链交易哈希
    confirmations?: number        // 区块确认数
  }

  // === 状态管理 ===
  status: "pending" | "paid" | "completed" | "failed" | "cancelled"
  statusHistory: Array<{
    status: string
    timestamp: Date
    reason?: string               // 失败原因
  }>

  // === 时间戳 ===
  createdAt: Date                // 订单创建时间
  paidAt?: Date                  // 支付完成时间
  completedAt?: Date             // 积分加入时间

  // === 积分记录 ===
  credits: {
    baseCredits: number           // 基础积分
    bonusCredits: number          // 赠送积分
    totalCredits: number          // 总积分（baseCredits + bonusCredits）
    addedToUserAt?: Date          // 积分加入用户账户的时间
  }

  // === 安全验证 ===
  verification: {
    signature?: string            // Crossmint 签名
    verified: boolean             // 是否已验证
    verifiedAt?: Date
  }

  // === 元数据与审计 ===
  metadata?: {
    userAgent?: string
    ipAddress?: string
    walletAddress?: string        // 用户钱包地址
    referralCode?: string
  }

  // === 重试与异常处理 ===
  retryCount: number              // 确认重试次数
  lastRetryAt?: Date
  errors?: Array<{
    code: string
    message: string
    timestamp: Date
  }>
}

/**
 * PaymentOrder 状态转换图
 *
 * ┌──────────────┐
 * │   pending    │  (用户未支付或支付中)
 * └──────┬───────┘
 *        │
 *   区块链确认
 *        │
 * ┌──────▼───────┐
 * │    paid      │  (交易确认，待加积分)
 * └──────┬───────┘
 *        │
 *  加积分成功
 *        │
 * ┌──────▼───────────┐
 * │   completed   │  (积分已加入)
 * └─────────────────┘
 *
 * 失败路径：
 * pending → failed
 *           ↓
 *        cancelled (用户取消)
 */
```

---

## 2. 聚合根（Aggregates）

### 2.1 UserPaymentHistory（用户支付历史）

```typescript
/**
 * 用户的支付历史聚合根
 * 维护用户所有支付订单和统计信息
 */
interface UserPaymentHistory {
  userId: string

  // 订单列表
  orders: PaymentOrder[]          // 按创建时间降序

  // 统计数据
  statistics: {
    totalOrders: number           // 总订单数
    successfulOrders: number      // 成功订单数
    failedOrders: number          // 失败订单数

    totalSpent: number            // 总支出 (USDT)
    totalCreditsEarned: number    // 总获得积分
    averageOrderValue: number     // 平均订单金额

    lastPurchaseAt?: Date         // 最后购买时间
    firstPurchaseAt?: Date        // 首次购买时间
  }

  // 当前状态
  currentStatus: {
    pendingOrders: number         // 待支付订单数
    creditsAwaitingConfirmation: number  // 待确认积分数
  }
}
```

---

## 3. 事件模型（Event Models）

### 3.1 PaymentEvent（支付事件）

```typescript
/**
 * 支付相关事件
 * 用于事件驱动的状态更新
 */
type PaymentEventType =
  | "payment.initialized"         // 支付流程开始
  | "payment.pending"             // 等待确认
  | "payment.confirmed"           // 支付确认
  | "payment.failed"              // 支付失败
  | "payment.cancelled"           // 支付取消
  | "credits.added"               // 积分已加入
  | "credits.additionFailed"      // 积分加入失败

interface PaymentEvent {
  type: PaymentEventType
  orderId: string
  userId: string
  timestamp: Date

  payload: {
    packageId?: string
    amount?: number
    credits?: number
    reason?: string               // 失败原因
    error?: {
      code: string
      message: string
    }
  }

  metadata?: {
    version: string
    source: string                // "frontend" | "backend" | "webhook"
  }
}
```

---

## 4. 后端数据库表结构（DDL）

### 4.1 payment_orders 表

```sql
CREATE TABLE payment_orders (
  -- 主键与外键
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,

  -- 订单标识
  crossmint_order_id VARCHAR(100) UNIQUE NOT NULL,

  -- 套餐信息
  package_id VARCHAR(20) NOT NULL,  -- "starter" | "pro" | "vip"
  package_snapshot JSON NOT NULL,   -- 套餐快照

  -- 支付信息
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USDT',
  chain_used VARCHAR(20),            -- "polygon" | "base" | "arbitrum"
  transaction_hash VARCHAR(100),

  -- 积分信息
  base_credits INT NOT NULL,
  bonus_credits INT DEFAULT 0,
  total_credits INT NOT NULL,        -- base + bonus

  -- 状态
  status VARCHAR(20) DEFAULT 'pending',
  status_history JSON DEFAULT '[]',

  -- 验证
  signature VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,

  -- 重试
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMP,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- 审计
  metadata JSON,

  -- 索引
  KEY idx_user_id (user_id),
  KEY idx_status (status),
  KEY idx_created_at (created_at),
  KEY idx_user_status (user_id, status),

  -- 幂等性保护
  UNIQUE KEY uk_crossmint_order (crossmint_order_id)
)
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 payment_order_events 表（可选，用于审计）

```sql
CREATE TABLE payment_order_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (order_id) REFERENCES payment_orders(id) ON DELETE CASCADE,
  KEY idx_order_id (order_id),
  KEY idx_event_type (event_type),
  KEY idx_created_at (created_at)
)
DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. TypeScript 完整类型定义

### 5.1 types/payment.ts

```typescript
// ====== 值对象 ======
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

// ====== 订单 ======
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
  metadata?: {
    userAgent?: string
    ipAddress?: string
    walletAddress?: string
    referralCode?: string
  }
  retryCount: number
  lastRetryAt?: Date
  errors?: Array<{
    code: string
    message: string
    timestamp: Date
  }>
}

// ====== 事件 ======
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

// ====== 聚合根 ======
export interface UserPaymentHistory {
  userId: string
  orders: PaymentOrder[]
  statistics: {
    totalOrders: number
    successfulOrders: number
    failedOrders: number
    totalSpent: number
    totalCreditsEarned: number
    averageOrderValue: number
    lastPurchaseAt?: Date
    firstPurchaseAt?: Date
  }
  currentStatus: {
    pendingOrders: number
    creditsAwaitingConfirmation: number
  }
}

// ====== API 请求/响应类型 ======
export interface PaymentConfirmRequest {
  orderId: string
  signature: string
  packageId: string
}

export interface PaymentConfirmResponse {
  success: boolean
  message: string
  creditsAdded: number
  totalCredits: number
  order: {
    id: string
    status: string
    paidAt: Date
  }
}

export interface PaymentErrorResponse {
  error: string
  code: string
  details?: {
    orderId?: string
    reason?: string
  }
}

// ====== Context 类型 ======
export interface PaymentContextType {
  // 状态
  selectedPackage: PaymentPackage | null
  paymentStatus: "idle" | "loading" | "success" | "error"
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

// ====== Crossmint SDK 类型 ======
export interface CrossmintCheckoutProps {
  lineItems: Array<{
    price: string
    currency: string
    quantity: number
    metadata?: Record<string, any>
  }>
  checkoutProps?: {
    payment?: {
      allowedMethods?: string[]
    }
    preferredChains?: string[]
    locale?: string
  }
  onEvent?: (event: CrossmintEvent) => void
}

export interface CrossmintEvent {
  type: string
  payload: {
    orderId: string
    [key: string]: any
  }
}
```

---

## 6. 常量定义

### 6.1 constants/payment.ts

```typescript
/**
 * 支付相关的常量定义
 */

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const

export const PACKAGE_IDS = {
  STARTER: "starter",
  PRO: "pro",
  VIP: "vip",
} as const

export const SUPPORTED_CHAINS = [
  "polygon",
  "base",
  "arbitrum",
] as const

export const ERROR_CODES = {
  // 客户端错误
  INVALID_PACKAGE: "INVALID_PACKAGE",
  UNAUTHORIZED: "UNAUTHORIZED",
  DUPLICATE_ORDER: "DUPLICATE_ORDER",
  PAYMENT_TIMEOUT: "PAYMENT_TIMEOUT",

  // 服务器错误
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SIGNATURE_VERIFICATION_FAILED: "SIGNATURE_VERIFICATION_FAILED",
  CREDITS_UPDATE_FAILED: "CREDITS_UPDATE_FAILED",

  // Crossmint 错误
  CROSSMINT_ERROR: "CROSSMINT_ERROR",
  WALLET_CONNECTION_FAILED: "WALLET_CONNECTION_FAILED",
} as const

export const API_TIMEOUTS = {
  CHECKOUT_INIT: 2000,        // 2 秒
  PAYMENT_CONFIRM: 5000,      // 5 秒
  WEBHOOK_RETRY: 30000,       // 30 秒
} as const

export const RETRY_STRATEGY = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,        // 1 秒
  BACKOFF_MULTIPLIER: 2,      // 指数退避
} as const
```

---

## 7. 数据转换映射

### 7.1 Crossmint → PaymentOrder 映射

```typescript
/**
 * Crossmint Webhook 响应转换为 PaymentOrder
 */
export function mapCrossmintToPaymentOrder(
  crossmintEvent: CrossmintWebhookEvent,
  package: PaymentPackage
): PaymentOrder {
  return {
    id: generateUUID(),
    crossmintOrderId: crossmintEvent.payload.orderId,
    userId: crossmintEvent.payload.metadata.userId,
    packageId: package.id,
    packageSnapshot: {
      name: package.name,
      credits: package.credits.amount,
      bonusCredits: package.credits.bonusAmount || 0,
      totalCredits:
        package.credits.amount + (package.credits.bonusAmount || 0),
    },
    payment: {
      amount: crossmintEvent.payload.totalPrice,
      currency: "USDT",
      chainUsed: crossmintEvent.payload.chainUsed,
      transactionHash: crossmintEvent.payload.transactionHash,
    },
    status: "paid",
    statusHistory: [
      {
        status: "paid",
        timestamp: new Date(),
        reason: "Crossmint webhook confirmed",
      },
    ],
    createdAt: new Date(),
    paidAt: new Date(),
    credits: {
      baseCredits: package.credits.amount,
      bonusCredits: package.credits.bonusAmount || 0,
      totalCredits:
        package.credits.amount + (package.credits.bonusAmount || 0),
    },
    verification: {
      verified: false,
      signature: crossmintEvent.signature,
    },
    retryCount: 0,
  }
}
```

---

## 总结

本数据模型设计遵循以下原则：

1. **值对象的不可变性** - PaymentPackage 是固定的
2. **聚合根的边界** - PaymentOrder 是完整的业务单元
3. **事件溯源** - 所有状态变化都记录在 statusHistory
4. **防防御性** - 存储快照防止关键信息丢失
5. **审计友好** - metadata 和 events 表方便后续查询
6. **幂等性** - crossmint_order_id 唯一性保证重复幂等
