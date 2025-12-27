# 支付接口安全审计报告

**日期**: 2025-12-27
**范围**: Crossmint 支付集成模块
**严重级别**: 🔴 高 / 🟡 中 / 🟢 低

---

## 执行摘要

对支付接口实现代码进行了全面审计，发现 **3 个高风险** 和 **2 个中风险** 的安全问题。这些问题都是可修复的，但需要立即关注。

### 总体评分
- ✅ **架构设计**: 清晰、模块隔离好、符合单一职责原则
- ⚠️ **安全防护**: 关键防线缺失（签名验证、幂等性、Token管理）
- ✅ **类型安全**: TypeScript 类型覆盖完整
- ⚠️ **扩展性**: 硬编码限制了套餐动态性

---

## 审计详情

### 1. 🔴 [高] - Webhook 签名验证不足

**位置**: `web/src/features/payment/services/CrossmintService.ts:122-132`

**问题描述**:
```typescript
verifyPaymentSignature(signature: unknown, payload: unknown): boolean {
  if (!signature || typeof signature !== "string") {
    return false
  }
  // Basic check - in production, use HMAC verification
  return signature.length > 0  // ❌ 只检查长度，没有真正验证
}
```

**风险等级**: **高**
**影响**: 攻击者可以伪造 Webhook，导致积分被错误地加到账户

**修复建议**:
```typescript
import crypto from 'crypto'

verifyPaymentSignature(signature: string, payload: string): boolean {
  const secret = process.env.CROSSMINT_WEBHOOK_SECRET
  if (!secret) {
    console.warn("[Crossmint] Webhook secret not configured")
    return false
  }

  // HMAC-SHA256 验证
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  )
}
```

**优先级**: P0 - 立即修复

---

### 2. 🔴 [高] - Token 管理安全风险

**位置**: `web/src/features/payment/services/PaymentOrchestrator.ts:91`

**问题描述**:
```typescript
async handlePaymentSuccess(orderId: string): Promise<PaymentConfirmResponse> {
  const response = await fetch("/api/payments/confirm", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("auth_token")}`, // ❌ 从 localStorage 读取
    },
    body: JSON.stringify({ orderId }),
  })
}
```

**风险等级**: **高**
**影响**:
- localStorage 可被 XSS 攻击窃取
- 不安全的跨域共享

**修复建议**:
```typescript
// 方案 1: 使用 HttpOnly Cookie（推荐）
// 后端设置: Set-Cookie: auth_token=...; HttpOnly; Secure; SameSite=Strict
const response = await fetch("/api/payments/confirm", {
  method: "POST",
  credentials: "include", // 自动携带 Cookie
  body: JSON.stringify({ orderId }),
})

// 方案 2: 从服务端获取临时 Token
const tokenResponse = await fetch("/api/auth/payment-token", {
  credentials: "include"
})
const { token } = await tokenResponse.json()
const response = await fetch("/api/payments/confirm", {
  headers: { "Authorization": `Bearer ${token}` },
  body: JSON.stringify({ orderId }),
})
```

**优先级**: P0 - 立即修复

---

### 3. 🔴 [高] - 支付幂等性缺失

**位置**: `web/src/features/payment/services/PaymentOrchestrator.ts:160-181`

**问题描述**:
```typescript
async retryPaymentConfirmation(orderId: string, maxRetries: number = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await this.handlePaymentSuccess(orderId) // ❌ 没有幂等性 Key
    } catch (error) {
      // 重试逻辑...
    }
  }
}
```

**风险等级**: **高**
**影响**:
- 网络波动导致重复支付
- Webhook 多次触发导致积分重复加

**修复建议**:
```typescript
// 使用幂等性 Key (Idempotency-Key)
async retryPaymentConfirmation(orderId: string, maxRetries: number = 3) {
  const idempotencyKey = `payment_${orderId}_${Date.now()}` // 唯一标识

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: {
          "Idempotency-Key": idempotencyKey, // 后端用这个去重
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      })
      return await response.json()
    } catch (error) {
      // 重试逻辑...
    }
  }
}

// 后端需要实现：
// 1. 在 payment_orders 表创建 UNIQUE(idempotency_key)
// 2. 收到重复的 idempotency_key 时，返回之前的结果而不是重新处理
```

**优先级**: P0 - 立即修复

---

### 4. 🟡 [中] - 硬编码套餐 ID 导致扩展性差

**位置**: `web/src/features/payment/types/payment.ts:9`

**问题描述**:
```typescript
export interface PaymentPackage {
  id: "starter" | "pro" | "vip"  // ❌ 硬编码的联合类型
}

// constants/packages.ts
export const PACKAGE_IDS = ["starter", "pro", "vip"] as const
export type PackageId = typeof PACKAGE_IDS[number]
```

**风险等级**: **中**
**影响**:
- 后端可动态添加套餐（credits.go 有完整的 CRUD），但前端类型系统阻止了这一点
- 前后端数据不一致
- 每次添加新套餐都需要改类型

**修复建议**:
```typescript
// 改为字符串，从后端动态获取
export interface PaymentPackage {
  id: string  // ✅ 灵活
  name: string
  description: string
  // ...
}

// hooks/usePaymentPackages.ts
export function usePaymentPackages() {
  const [packages, setPackages] = useState<PaymentPackage[]>([])

  useEffect(() => {
    // 从后端获取最新套餐
    fetch("/api/v1/credit-packages")
      .then(r => r.json())
      .then(data => setPackages(data))
  }, [])

  return packages
}
```

**优先级**: P1 - 下个迭代修复

---

### 5. 🟡 [中] - 错误处理缺少细粒度

**位置**: `web/src/features/payment/services/PaymentOrchestrator.ts:115-124`

**问题描述**:
```typescript
handlePaymentError(error: Error | string): void {
  const errorMessage = typeof error === "string" ? error : error.message
  console.error("[Payment Error]", errorMessage)

  if (typeof window !== "undefined" && window.__paymentErrorCallback) {
    ;(window as any).__paymentErrorCallback(errorMessage)
  }
}
```

**风险等级**: **中**
**影响**:
- 没有区分错误类型（网络错误 vs 业务错误）
- 没有错误日志上报机制
- 用户看到的错误消息可能不友好

**修复建议**:
```typescript
enum PaymentErrorCode {
  NETWORK_ERROR = "NETWORK_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  TIMEOUT = "TIMEOUT",
  SERVER_ERROR = "SERVER_ERROR",
}

async handlePaymentError(error: Error | string, context?: Record<string, any>) {
  let errorCode = PaymentErrorCode.SERVER_ERROR
  let userMessage = "支付处理失败，请重试"

  if (error instanceof NetworkError) {
    errorCode = PaymentErrorCode.NETWORK_ERROR
    userMessage = "网络连接失败，请检查网络"
  } else if (error instanceof ValidationError) {
    errorCode = PaymentErrorCode.VALIDATION_ERROR
    userMessage = "数据验证失败，请检查输入"
  }

  // 上报到监控系统
  if (typeof window !== "undefined") {
    window.__paymentErrorCallback?.({
      code: errorCode,
      message: userMessage,
      details: error instanceof Error ? error.stack : error,
      context,
      timestamp: new Date().toISOString(),
    })
  }
}
```

**优先级**: P2 - 优化项

---

## 代码质量评分

| 维度 | 评分 | 评注 |
|------|------|------|
| **代码结构** | 9/10 | 模块清晰，职责单一 |
| **类型安全** | 9/10 | TypeScript 覆盖完整 |
| **安全防护** | 4/10 | ❌ 关键防线缺失 |
| **错误处理** | 6/10 | ⚠️ 需要细化 |
| **测试覆盖** | 5/10 | ⚠️ 缺少单元测试 |
| **文档完整度** | 7/10 | 有基本注释，需要补充 |
| **扩展性** | 5/10 | ⚠️ 硬编码限制 |

**总体评分**: **6.5/10** - 架构好，但安全性需紧急加强

---

## 后端检查清单

后端需要实现的安全措施：

- [ ] **Webhook 验证** - 验证 Crossmint Webhook 签名（HMAC-SHA256）
- [ ] **幂等性处理** - 实现 `Idempotency-Key` 去重机制
- [ ] **积分加锁** - 数据库事务中使用 `SELECT FOR UPDATE` 防止并发问题
- [ ] **审计日志** - 记录所有支付操作（谁、什么时候、多少、结果）
- [ ] **支付超时处理** - 设定支付超时时间，自动标记为失败
- [ ] **重试机制** - 后端主动重试失败的支付确认
- [ ] **价格验证** - 确认支付金额与套餐价格一致（防止前端篡改）

---

## 前端检查清单

- [x] **模块结构** - ✅ 清晰
- [ ] **Webhook 验证** - ❌ 需要修复
- [ ] **Token 管理** - ❌ 改用 HttpOnly Cookie
- [ ] **幂等性** - ❌ 需要实现 Idempotency-Key
- [ ] **错误处理** - ⚠️ 需要细化
- [ ] **动态套餐** - ⚠️ 从后端获取而不是硬编码
- [ ] **单元测试** - ❌ 缺失，建议覆盖 80% 以上
- [ ] **监控上报** - ⚠️ 需要实现

---

## 风险排序

### 立即修复（P0）
1. ❌ Webhook 签名验证不足 → **伪造支付风险**
2. ❌ Token 从 localStorage 读取 → **XSS 风险**
3. ❌ 支付重复加积分 → **经济损失**

### 下个迭代（P1）
4. ⚠️ 硬编码套餐 ID → **扩展性问题**
5. ⚠️ 错误处理不够细致 → **可维护性问题**

---

## 建议改进方案

### 短期（1-2 天）
1. 实现 HMAC 签名验证
2. 改用 HttpOnly Cookie 存储认证令牌
3. 添加幂等性 Key 机制
4. 后端实现幂等性检查

### 中期（1-2 周）
1. 从后端动态获取套餐列表
2. 增加单元测试（目标 80% 覆盖）
3. 实现细粒度错误处理和上报
4. 添加支付监控和告警

### 长期（1 个月）
1. 实现完整的支付审计日志
2. 加入 E2E 测试覆盖所有支付场景
3. 集成 APM 监控
4. 支持多货币和多支付网关

---

## 审计人员

- **AI Code Assistant (Claude Code)**
- **审计时间**: 2025-12-27
- **下次复审**: 2026-01-27

---

## 签核

- [ ] 产品经理审核
- [ ] 安全团队审核
- [ ] 后端团队审核
- [ ] 发版前必须完成 P0 项
