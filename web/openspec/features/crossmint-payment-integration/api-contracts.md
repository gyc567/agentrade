# Crossmint Payment Integration - API 契约

## 1. 前端 Hook API

### 1.1 usePaymentPackages()

**职责**: 获取并缓存所有支付套餐

```typescript
interface UsePaymentPackagesReturn {
  packages: PaymentPackage[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function usePaymentPackages(): UsePaymentPackagesReturn
```

**使用示例**:
```typescript
export function PackageList() {
  const { packages, isLoading, error } = usePaymentPackages()

  if (isLoading) return <div>加载中...</div>
  if (error) return <div>加载失败: {error.message}</div>

  return (
    <div>
      {packages.map(pkg => (
        <div key={pkg.id}>
          <h3>{pkg.name}</h3>
          <p>{pkg.price.amount} USDT</p>
          <p>{pkg.credits.amount + (pkg.credits.bonusAmount || 0)} 积分</p>
        </div>
      ))}
    </div>
  )
}
```

**返回示例**:
```json
{
  "packages": [
    {
      "id": "starter",
      "name": "初级套餐",
      "price": { "amount": 10, "currency": "USDT" },
      "credits": { "amount": 500, "bonusAmount": 0 }
    },
    {
      "id": "pro",
      "name": "专业套餐",
      "price": { "amount": 50, "currency": "USDT" },
      "credits": { "amount": 3000, "bonusAmount": 300 }
    },
    {
      "id": "vip",
      "name": "VIP套餐",
      "price": { "amount": 100, "currency": "USDT" },
      "credits": { "amount": 8000, "bonusAmount": 1600 }
    }
  ],
  "isLoading": false,
  "error": null
}
```

**缓存策略**: SWR（5 分钟 TTL）

---

### 1.2 useCrossmintCheckout()

**职责**: 管理 Crossmint Hosted Checkout 的生命周期

```typescript
interface UseCrossmintCheckoutReturn {
  initCheckout: (packageId: string) => Promise<void>
  handleCheckoutEvent: (event: CrossmintEvent) => void
  status: "idle" | "loading" | "success" | "error"
  error: string | null
  orderId: string | null
  creditsAdded: number
}

function useCrossmintCheckout(): UseCrossmintCheckoutReturn
```

**使用示例**:
```typescript
export function CheckoutContainer() {
  const context = usePaymentContext()
  const {
    initCheckout,
    handleCheckoutEvent,
    status,
    error
  } = useCrossmintCheckout()

  const handlePaymentClick = async () => {
    if (context.selectedPackage) {
      await initCheckout(context.selectedPackage.id)
    }
  }

  return (
    <div>
      <button onClick={handlePaymentClick} disabled={status === "loading"}>
        {status === "loading" ? "处理中..." : "立即支付"}
      </button>

      {status === "error" && <div className="error">{error}</div>}

      <CrossmintHostedCheckout
        onEvent={handleCheckoutEvent}
        // ... 其他配置
      />
    </div>
  )
}
```

**事件处理示例**:
```typescript
const { handleCheckoutEvent } = useCrossmintCheckout()

// Hook 自动处理这些事件
handleCheckoutEvent({
  type: "checkout:order.paid",
  payload: { orderId: "crossmint-order-123" }
})

handleCheckoutEvent({
  type: "checkout:order.failed",
  payload: { error: "Insufficient balance" }
})

handleCheckoutEvent({
  type: "checkout:order.cancelled",
  payload: {}
})
```

---

### 1.3 usePaymentHistory()

**职责**: 获取用户的支付历史记录（可选功能）

```typescript
interface UsePaymentHistoryReturn {
  history: PaymentOrder[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  total: number
  successCount: number
}

function usePaymentHistory(userId: string): UsePaymentHistoryReturn
```

**使用示例**:
```typescript
export function PaymentHistoryPage() {
  const { user } = useAuth()
  const { history, isLoading, refresh } = usePaymentHistory(user.id)

  return (
    <div>
      <button onClick={refresh}>刷新</button>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>套餐</th>
            <th>金额</th>
            <th>积分</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {history.map(order => (
            <tr key={order.id}>
              <td>{order.createdAt.toLocaleDateString()}</td>
              <td>{order.packageSnapshot.name}</td>
              <td>{order.payment.amount} USDT</td>
              <td>{order.credits.totalCredits}</td>
              <td>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## 2. 后端 REST API

### 2.1 POST /api/payments/confirm

**目的**: 确认 Crossmint 支付，将积分加入用户账户

**请求格式**:
```typescript
interface PaymentConfirmRequest {
  orderId: string          // Crossmint 返回的订单 ID
  signature: string        // Crossmint 的签名（可选，增强安全性）
  packageId: string        // 套餐 ID（用于二次验证）
}
```

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/payments/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "orderId": "crossmint-order-123",
    "signature": "0x1234...",
    "packageId": "pro"
  }'
```

**响应格式 (200 OK)**:
```typescript
interface PaymentConfirmResponse {
  success: boolean
  message: string
  creditsAdded: number          // 本次添加的积分
  totalCredits: number          // 用户当前总积分
  bonusCredits: number          // 本次赠送积分
  order: {
    id: string
    status: "completed"
    paidAt: Date
    completedAt: Date
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "支付成功，积分已加入账户",
  "creditsAdded": 3000,
  "bonusCredits": 300,
  "totalCredits": 5800,
  "order": {
    "id": "order-abc123",
    "status": "completed",
    "paidAt": "2025-12-25T10:30:00Z",
    "completedAt": "2025-12-25T10:31:00Z"
  }
}
```

**错误响应 (400 Bad Request)**:
```json
{
  "success": false,
  "error": "Invalid package",
  "code": "INVALID_PACKAGE",
  "details": {
    "reason": "套餐 ID 不存在"
  }
}
```

**错误响应 (401 Unauthorized)**:
```json
{
  "success": false,
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "details": {
    "reason": "JWT token 无效或过期"
  }
}
```

**错误响应 (409 Conflict)**:
```json
{
  "success": false,
  "error": "Order already processed",
  "code": "DUPLICATE_ORDER",
  "details": {
    "orderId": "crossmint-order-123",
    "reason": "该订单已处理过，防止重复加积分"
  }
}
```

**错误响应 (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "details": {
    "reason": "数据库操作失败"
  }
}
```

**认证要求**:
- ✅ 需要 JWT Token（通过 `Authorization: Bearer <token>` 传递）
- ✅ Token 从 localStorage 的 `auth_token` 获取

**超时设置**: 5 秒

**重试策略**:
- 客户端：3 次重试，指数退避
- 服务端：幂等性保证（重复请求返回相同结果）

---

### 2.2 POST /api/webhooks/crossmint

**目的**: 接收 Crossmint 支付完成通知（链上确认）

**Webhook 事件类型**: `order.paid`

**请求格式**:
```typescript
interface CrossmintWebhookPayload {
  eventId: string
  type: "order.paid" | "order.failed"
  timestamp: string              // ISO 8601 格式
  payload: {
    orderId: string
    totalPrice: number
    currency: string
    chainUsed: string             // "polygon" | "base" | "arbitrum"
    transactionHash: string
    metadata: {
      userId: string              // 用户 ID（我们的系统）
      packageId: string
      credits: number
    }
  }
  signature: string               // HMAC-SHA256 签名
}
```

**Webhook 示例（order.paid）**:
```json
{
  "eventId": "evt_123456789",
  "type": "order.paid",
  "timestamp": "2025-12-25T10:30:00Z",
  "payload": {
    "orderId": "crossmint-order-123",
    "totalPrice": 50,
    "currency": "USDT",
    "chainUsed": "polygon",
    "transactionHash": "0x1234567890abcdef...",
    "metadata": {
      "userId": "user-456",
      "packageId": "pro",
      "credits": 3300
    }
  },
  "signature": "sha256=abcd1234..."
}
```

**响应格式 (200 OK)**:
```typescript
interface WebhookResponse {
  success: boolean
  eventId: string
  processedAt: Date
}
```

**响应示例**:
```json
{
  "success": true,
  "eventId": "evt_123456789",
  "processedAt": "2025-12-25T10:30:15Z"
}
```

**签名验证**:
```typescript
// 后端应验证签名
const WEBHOOK_SECRET = process.env.CROSSMINT_WEBHOOK_SECRET
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex')

if (expectedSignature !== incomingSignature) {
  throw new Error('Signature verification failed')
}
```

**幂等性处理**:
- 数据库中 `crossmint_order_id` 为 UNIQUE 约束
- 相同 `orderId` 收到多次，仅处理一次

**重试策略（Crossmint 侧）**:
- 最多 5 次重试
- 指数退避：1s, 2s, 4s, 8s, 16s

---

### 2.3 GET /api/payments/history

**目的**: 获取用户的支付历史

**请求格式**:
```typescript
interface PaymentHistoryQuery {
  userId: string          // 来自 JWT token，自动获取
  page?: number          // 分页，默认 1
  limit?: number         // 每页数量，默认 20，最大 100
  status?: string        // 过滤状态：completed | failed | pending
  sortBy?: string        // 排序字段：createdAt (默认) | paidAt | amount
  sortOrder?: string     // asc | desc (默认)
}
```

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/payments/history?page=1&limit=10&status=completed" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**响应格式 (200 OK)**:
```typescript
interface PaymentHistoryResponse {
  success: boolean
  data: {
    orders: PaymentOrder[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
    summary: {
      totalOrders: number
      successfulOrders: number
      totalSpent: number
      totalCreditsEarned: number
    }
  }
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-123",
        "crossmintOrderId": "crossmint-123",
        "packageId": "pro",
        "status": "completed",
        "payment": {
          "amount": 50,
          "currency": "USDT",
          "chainUsed": "polygon"
        },
        "credits": {
          "baseCredits": 3000,
          "bonusCredits": 300,
          "totalCredits": 3300
        },
        "createdAt": "2025-12-20T10:00:00Z",
        "paidAt": "2025-12-20T10:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    },
    "summary": {
      "totalOrders": 5,
      "successfulOrders": 4,
      "totalSpent": 210,
      "totalCreditsEarned": 11200
    }
  }
}
```

---

## 3. 错误码规范

### 3.1 客户端错误 (4xx)

```typescript
enum ClientErrorCode {
  // 验证错误
  INVALID_PACKAGE = "INVALID_PACKAGE",           // 套餐不存在
  INVALID_PRICE = "INVALID_PRICE",               // 价格无效
  INVALID_CREDITS = "INVALID_CREDITS",           // 积分数无效

  // 认证错误
  UNAUTHORIZED = "UNAUTHORIZED",                 // JWT 无效
  TOKEN_EXPIRED = "TOKEN_EXPIRED",               // Token 过期
  FORBIDDEN = "FORBIDDEN",                       // 无权限

  // 冲突
  DUPLICATE_ORDER = "DUPLICATE_ORDER",           // 订单已处理
  PAYMENT_TIMEOUT = "PAYMENT_TIMEOUT",           // 支付超时
}
```

### 3.2 服务器错误 (5xx)

```typescript
enum ServerErrorCode {
  INTERNAL_ERROR = "INTERNAL_ERROR",             // 内部错误
  DATABASE_ERROR = "DATABASE_ERROR",             // 数据库错误
  SIGNATURE_VERIFICATION_FAILED = "SIGNATURE_VERIFICATION_FAILED",
  CREDITS_UPDATE_FAILED = "CREDITS_UPDATE_FAILED",
  WEBHOOK_PROCESSING_FAILED = "WEBHOOK_PROCESSING_FAILED",
}
```

### 3.3 外部服务错误

```typescript
enum ExternalErrorCode {
  CROSSMINT_ERROR = "CROSSMINT_ERROR",           // Crossmint API 错误
  WALLET_CONNECTION_FAILED = "WALLET_CONNECTION_FAILED",
  BLOCKCHAIN_ERROR = "BLOCKCHAIN_ERROR",        // 区块链错误
}
```

---

## 4. 数据类型完整参考

### 4.1 PaymentPackage（支付套餐）

```typescript
interface PaymentPackage {
  id: "starter" | "pro" | "vip"
  name: string
  description: string
  price: {
    amount: number          // 10, 50, 100
    currency: "USDT"
    chainPreference?: string // "polygon" | "base" | "arbitrum"
  }
  credits: {
    amount: number          // 500, 3000, 8000
    bonusMultiplier?: number
    bonusAmount?: number
  }
  badge?: string
  highlightColor?: string
  availableFrom?: Date
  availableUntil?: Date
  metadata?: Record<string, any>
}
```

### 4.2 PaymentOrder（支付订单）

```typescript
interface PaymentOrder {
  id: string
  crossmintOrderId: string
  userId: string
  packageId: string
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
```

---

## 5. 请求/响应示例集合

### 5.1 完整的支付确认流程

**前端**:
```typescript
const confirmPayment = async (orderId: string, packageId: string) => {
  try {
    const response = await fetch('/api/payments/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        orderId,
        packageId,
        signature: 'optional-crossmint-signature',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Payment confirmation failed:', error)
    throw error
  }
}
```

**后端处理**:
```typescript
// POST /api/payments/confirm
export async function confirmPayment(req: Request) {
  const { orderId, packageId, signature } = await req.json()
  const userId = req.user.id  // 从 JWT 提取

  // 1. 验证套餐
  const package = validatePackage(packageId)
  if (!package) throw new Error('INVALID_PACKAGE')

  // 2. 验证签名（可选但推荐）
  if (signature && !verifySignature(signature, orderId)) {
    throw new Error('SIGNATURE_VERIFICATION_FAILED')
  }

  // 3. 检查幂等性
  const existingOrder = await db.paymentOrders.findOne({
    crossmintOrderId: orderId,
  })
  if (existingOrder) {
    return {
      success: true,
      creditsAdded: existingOrder.credits.totalCredits,
      totalCredits: await getUserTotalCredits(userId),
    }
  }

  // 4. 创建订单记录
  const order = await db.paymentOrders.create({
    id: generateUUID(),
    crossmintOrderId: orderId,
    userId,
    packageId,
    status: 'completed',
    // ... 其他字段
  })

  // 5. 加积分
  await updateUserCredits(userId, package.credits.amount)

  // 6. 返回响应
  return {
    success: true,
    creditsAdded: package.credits.amount,
    totalCredits: await getUserTotalCredits(userId),
    order: { id: order.id, status: 'completed' },
  }
}
```

---

## 6. 频率限制 (Rate Limiting)

```
端点                          限制
─────────────────────────────────────
POST /api/payments/confirm    100 请求/小时 (per user)
GET /api/payments/history     300 请求/小时 (per user)
POST /api/webhooks/crossmint  无限制 (Crossmint 官方调用)
```

---

## 7. 版本控制

**当前 API 版本**: v1

**向后兼容**:
- 所有响应字段均为可选（通过新字段添加而非删除）
- 错误码不变更（仅新增）
- 新参数添加为可选，旧客户端仍可运行

---

## 总结

✅ **清晰的 API 契约**
- 前端 Hook 接口规范
- 后端 REST 端点定义
- 请求/响应格式明确

✅ **完整的错误处理**
- 分类错误码
- 具体的错误消息
- 可操作的 HTTP 状态码

✅ **生产级的质量**
- 幂等性保证
- 签名验证
- 重试策略
- 频率限制

