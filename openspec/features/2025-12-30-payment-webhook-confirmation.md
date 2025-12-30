# Feature: Payment Webhook Confirmation & Credits Processing

## Summary
实现用户支付完成后的回调确认机制，通过 Crossmint Webhook 自动验证支付并更新用户积分。

## Problem Statement

### 当前问题
1. **缺少 `/api/payments/confirm` 端点**：前端调用该端点确认支付，但后端未实现
2. **Webhook Secret 未配置**：用户提供 `whsec_IxInt84KPDqPP6yn4G44yAXPPdLvJIfk`，需要配置到环境变量
3. **前端积分未刷新**：支付成功后前端没有刷新用户积分余额
4. **无 Webhook 失败回退**：如果 Webhook 失败，没有轮询机制确保积分到账

### 现有基础设施（已实现）
- ✅ Webhook 端点：`POST /webhooks/crossmint` (`api/payment/handler.go:232-267`)
- ✅ HMAC-SHA256 签名验证：`VerifyWebhookSignature()` (`service/payment/service.go:260-273`)
- ✅ 事件处理：`order.paid`, `order.failed`, `order.cancelled`
- ✅ 积分添加：`AddCredits()` (`config/credits.go`)
- ✅ 幂等性处理：检查订单状态避免重复处理

## Solution

### Phase 1: 后端实现

#### 1.1 配置 Webhook Secret
**环境变量配置**
```bash
# .env / Vercel Environment Variables
CROSSMINT_WEBHOOK_SECRET=whsec_IxInt84KPDqPP6yn4G44yAXPPdLvJIfk
```

#### 1.2 添加 ConfirmPayment 端点
**File:** `api/payment/handler.go`
```go
// ConfirmPaymentRequest 确认支付请求
type ConfirmPaymentRequest struct {
    OrderID string `json:"orderId" binding:"required"`
}

// ConfirmPaymentResponse 确认支付响应
type ConfirmPaymentResponse struct {
    Success      bool   `json:"success"`
    Status       string `json:"status"`
    CreditsAdded int    `json:"creditsAdded,omitempty"`
    Message      string `json:"message,omitempty"`
    Error        string `json:"error,omitempty"`
    Code         string `json:"code,omitempty"`
}

// ConfirmPayment 确认支付完成
func (h *Handler) ConfirmPayment(c *gin.Context) {
    // 1. 获取认证用户
    userID, exists := c.Get("user_id")
    if !exists {
        c.JSON(http.StatusUnauthorized, ConfirmPaymentResponse{...})
        return
    }

    // 2. 解析请求
    var req ConfirmPaymentRequest
    if err := c.ShouldBindJSON(&req); err != nil {...}

    // 3. 查询订单
    order, err := h.service.GetPaymentOrderByCrossmintID(req.OrderID)
    if err != nil {...}

    // 4. 验证订单所有权
    if order.UserID != userID.(string) {...}

    // 5. 返回订单状态和积分信息
    c.JSON(http.StatusOK, ConfirmPaymentResponse{
        Success:      order.Status == "completed",
        Status:       order.Status,
        CreditsAdded: order.Credits,
        Message:      getStatusMessage(order.Status),
    })
}
```

#### 1.3 添加路由
**File:** `api/server.go`
```go
// 在 paymentGroup 中添加
paymentGroup.POST("/confirm", s.paymentHandler.ConfirmPayment)
```

#### 1.4 添加 Service 方法
**File:** `service/payment/service.go`
```go
// Service 接口添加
GetPaymentOrderByCrossmintID(ctx context.Context, crossmintOrderID string) (*config.PaymentOrder, error)
```

### Phase 2: 前端实现

#### 2.1 修改 PaymentProvider 刷新积分
**File:** `web/src/features/payment/contexts/PaymentProvider.tsx`
```typescript
// 在 handlePaymentSuccess 成功后刷新用户积分
const handlePaymentSuccess = useCallback(async (orderId: string) => {
    try {
        const result = await orchestrator.handlePaymentSuccess(orderId)
        setCreditsAdded(result.creditsAdded)
        setPaymentStatus("success")

        // 刷新用户积分余额
        await refreshUserCredits()
    } catch (err) {
        setPaymentStatus("error")
    }
}, [orchestrator, refreshUserCredits])
```

#### 2.2 添加积分刷新 Hook
**File:** `web/src/features/credits/hooks/useCreditsRefresh.ts`
```typescript
export function useCreditsRefresh() {
    const { user, setUser } = useAuth()

    const refreshCredits = useCallback(async () => {
        const response = await fetch('/api/v1/user/credits', {
            headers: { Authorization: `Bearer ${getAuthToken()}` }
        })
        const data = await response.json()
        // 更新用户积分状态
        setUser(prev => ({ ...prev, credits: data.credits }))
    }, [setUser])

    return { refreshCredits }
}
```

### Phase 3: 可靠性增强（可选）

#### 3.1 轮询回退机制
**File:** `web/src/features/payment/hooks/usePaymentPolling.ts`
```typescript
export function usePaymentPolling(orderId: string, onComplete: (result) => void) {
    useEffect(() => {
        if (!orderId) return

        const pollInterval = setInterval(async () => {
            const result = await confirmPayment(orderId)
            if (result.status === 'completed') {
                clearInterval(pollInterval)
                onComplete(result)
            }
        }, 3000) // 每3秒轮询

        // 最多轮询5分钟
        const timeout = setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000)

        return () => {
            clearInterval(pollInterval)
            clearTimeout(timeout)
        }
    }, [orderId, onComplete])
}
```

## Data Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │      │   Backend   │      │  Crossmint  │      │  Database   │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │                    │
       │ 1. createOrder()   │                    │                    │
       │───────────────────>│                    │                    │
       │                    │ 2. Create order    │                    │
       │                    │───────────────────>│                    │
       │                    │    orderId+secret  │                    │
       │                    │<───────────────────│                    │
       │    orderId+secret  │                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
       │ 3. Crossmint Checkout (user pays)       │                    │
       │─────────────────────────────────────────>                    │
       │                    │                    │                    │
       │                    │ 4. Webhook: order.paid                  │
       │                    │<───────────────────│                    │
       │                    │                    │ 5. Update order    │
       │                    │─────────────────────────────────────────>
       │                    │                    │ 6. Add credits     │
       │                    │─────────────────────────────────────────>
       │                    │                    │                    │
       │ 7. confirmPayment() (poll/event)        │                    │
       │───────────────────>│                    │                    │
       │   status=completed │                    │                    │
       │   creditsAdded=N   │                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │
       │ 8. refreshCredits()│                    │                    │
       │───────────────────>│ 9. Get balance     │                    │
       │                    │─────────────────────────────────────────>
       │    credits balance │                    │                    │
       │<───────────────────│                    │                    │
```

## Files to Modify

### Backend (Go)
| File | Change |
|------|--------|
| `api/payment/handler.go` | 添加 `ConfirmPayment()` handler |
| `api/server.go` | 添加 `/payments/confirm` 路由 |
| `service/payment/service.go` | 添加 `GetPaymentOrderByCrossmintID()` 接口方法 |
| `config/payment.go` | 确保 `GetPaymentOrderByCrossmintID()` 存在 |
| `.env` | 添加 `CROSSMINT_WEBHOOK_SECRET` |

### Frontend (TypeScript)
| File | Change |
|------|--------|
| `contexts/PaymentProvider.tsx` | 支付成功后刷新积分 |
| `hooks/useCreditsRefresh.ts` | 新增积分刷新 hook |
| `services/PaymentApiService.ts` | 确保 `confirmPayment()` 正确调用 |

## Environment Configuration

```bash
# Vercel Environment Variables
CROSSMINT_WEBHOOK_SECRET=whsec_IxInt84KPDqPP6yn4G44yAXPPdLvJIfk

# Optional: Crossmint API (已配置)
CROSSMINT_SERVER_API_KEY=sk_staging_xxx
CROSSMINT_API_URL=https://staging.crossmint.com/api
CROSSMINT_COLLECTION_ID=xxx
```

## Test Plan

### Unit Tests
1. `ConfirmPayment` handler - 正常流程、无权限、订单不存在
2. HMAC 签名验证 - 有效签名、无效签名、空签名
3. 幂等性处理 - 重复确认同一订单

### Integration Tests
1. 完整支付流程：创建订单 → Webhook → 确认 → 积分到账
2. Webhook 重试机制
3. 前端积分刷新

### E2E Tests
1. 用户支付完成后积分余额更新
2. 支付失败后显示错误信息

## Rollback Plan
1. 移除 `/payments/confirm` 路由
2. 环境变量回滚（删除 webhook secret）
3. Git revert 相关提交

## Acceptance Criteria
- [ ] Webhook secret 配置到环境变量
- [ ] `/api/payments/confirm` 端点正常工作
- [ ] 支付成功后自动添加积分
- [ ] 前端支付成功后刷新积分余额
- [ ] 幂等性处理：重复 webhook 不会重复添加积分
- [ ] HMAC-SHA256 签名验证通过
- [ ] 100% 测试覆盖率

## Security Considerations
1. **签名验证**：所有 Webhook 请求必须通过 HMAC-SHA256 验证
2. **订单所有权**：`confirmPayment` 验证用户只能确认自己的订单
3. **幂等性**：防止重复处理同一订单
4. **速率限制**：10 requests/minute per user

## Timeline
- Phase 1 (后端): 2-3 hours
- Phase 2 (前端): 1-2 hours
- Phase 3 (可选): 1 hour
- Testing: 1-2 hours

**Total: 5-8 hours**
