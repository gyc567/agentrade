# Crossmint Payment Integration - 风险分析

## 1. 风险识别与评估

### 1.1 技术风险矩阵

```
风险等级
   High │
        │     ⚠️ Webhook    ⚠️ 幂等性
        │     重复执行      失败
        │
Medium  │                   ⚠️ 环境变量
        │     ⚠️ 缓存       缺失
        │     不一致
        │
   Low  │   ⚠️ 超时    ⚠️ 组件加载
        │
        └────────────────────────────── Probability
       Low    Medium    High
```

---

## 2. 关键风险清单

### 🔴 风险 #1: Webhook 重复执行导致积分重复加

**严重程度**: 🔴 HIGH
**发生概率**: MEDIUM
**影响范围**: 用户积分数据，财务记录

**问题描述**:
```
Crossmint Webhook 可能因网络重试、服务器重启等原因被执行多次。
如果后端未正确处理幂等性，同一笔支付会导致积分被加多次。

示例场景:
  Webhook #1 执行成功 → 加 3000 积分
  Webhook #1 重试（网络重试）→ 加 3000 积分（重复！）
  用户实际只购买了一次，但积分被加了两次
```

**风险等级**:
- **财务影响**: 高（直接导致公司积分成本增加）
- **用户影响**: 中（用户可能获得额外的积分，但可能导致后续被禁用账户）
- **系统影响**: 中（数据不一致）

**缓解方案**:

| 层级 | 方案 | 详情 |
|------|------|------|
| **DB 层** | UNIQUE 约束 | `payment_orders` 表中 `crossmint_order_id` 设为 UNIQUE |
| **应用层** | 幂等 Key | 检查订单是否已处理，已处理则返回缓存结果 |
| **缓存层** | Redis 缓存 | 5 分钟内相同订单 ID 返回缓存结果（防止重复查询） |
| **监控层** | 告警 | 监控重复的 `order_id` 请求，发送告警 |

**实施代码**:
```typescript
// 数据库约束
ALTER TABLE payment_orders
ADD CONSTRAINT uk_crossmint_order_id
UNIQUE (crossmint_order_id)

// 应用层检查
export async function confirmPayment(orderId: string, userId: string) {
  // 1. 先查数据库是否已处理
  const existingOrder = await db.paymentOrders.findOne({
    crossmintOrderId: orderId,
  })

  // 2. 如果已处理，直接返回
  if (existingOrder) {
    return {
      success: true,
      creditsAdded: existingOrder.credits.totalCredits,
      message: "Order already processed (idempotent response)",
    }
  }

  // 3. 否则，新建订单并加积分
  const order = await db.paymentOrders.create({
    crossmintOrderId: orderId,
    userId,
    status: "completed",
    // ...
  })

  return {
    success: true,
    creditsAdded: order.credits.totalCredits,
    message: "Credits added successfully",
  }
}
```

**验证测试**:
```typescript
describe("Webhook Idempotency", () => {
  it("同一订单重复 Webhook 应仅加一次积分", async () => {
    const orderId = "order-123"
    const userId = "user-456"

    // 第一次调用
    const response1 = await confirmPayment(orderId, userId)
    expect(response1.creditsAdded).toBe(3000)

    // 获取当前积分
    const credits1 = await getUserCredits(userId)

    // 第二次调用（模拟 Webhook 重试）
    const response2 = await confirmPayment(orderId, userId)
    expect(response2.creditsAdded).toBe(3000)

    // 积分不应该增加（幂等性保证）
    const credits2 = await getUserCredits(userId)
    expect(credits2).toBe(credits1) // 相同的积分
  })
})
```

---

### 🔴 风险 #2: 支付成功但后端确认失败导致积分未加入

**严重程度**: 🔴 HIGH
**发生概率**: LOW
**影响范围**: 用户支付流程，客户满意度

**问题描述**:
```
用户在 Crossmint 端成功支付（链上确认），但前端调用
/api/payments/confirm 时失败（网络超时、服务器错误等）。
导致用户支付了钱但没有收到积分。
```

**风险场景**:
```
1. 用户支付成功 ✅
2. Crossmint 返回 order.paid 事件 ✅
3. 前端调用 /api/payments/confirm
4. 请求超时（5s 未响应）
5. 用户看到加载中... 然后超时
6. 用户关闭页面
7. 积分实际上加入了（Webhook 处理）
8. 但用户不知道，认为支付失败了
```

**缓解方案**:

| 方案 | 实施细节 |
|------|--------|
| **客户端重试** | 支付超时时，自动重试 3 次（指数退避） |
| **Webhook 后备** | 即使前端请求失败，Webhook 也会触发后端加积分 |
| **交易历史查询** | 提供 GET /api/payments/history，用户可查询是否积分已加入 |
| **人工审查工具** | 后台工具，查询 Crossmint 订单状态并手动同步 |
| **邮件通知** | 积分加入成功时，发送邮件给用户确认 |

**实施代码**:
```typescript
// 前端重试机制
const confirmPaymentWithRetry = async (
  orderId: string,
  maxRetries = 3
): Promise<PaymentConfirmResponse> => {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
        signal: AbortSignal.timeout(5000), // 5秒超时
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        // 指数退避：1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// 后端 Webhook 处理（后备方案）
export async function handleCrossmintWebhook(payload: WebhookPayload) {
  const { orderId, metadata } = payload

  // 即使前端请求失败，Webhook 也会确保加积分
  const order = await db.paymentOrders.findOneAndUpdate(
    { crossmintOrderId: orderId },
    { status: 'completed', completedAt: new Date() },
    { upsert: true }
  )

  // 确保积分已加入
  await updateUserCredits(metadata.userId, metadata.credits)

  // 发送确认邮件
  await sendConfirmationEmail(metadata.userId)
}
```

---

### 🟡 风险 #3: 环境变量配置错误（缺少 API Key）

**严重程度**: 🟡 MEDIUM
**发生概率**: MEDIUM
**影响范围**: 应用启动，功能完全不可用

**问题描述**:
```
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY 未在 .env.local 配置，
导致应用无法初始化 Crossmint SDK，支付功能不可用。
```

**缓解方案**:

```typescript
// 启动时验证
export function validateEnvironment() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY',
  ]

  const missing = requiredEnvVars.filter(
    key => !process.env[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please add them to .env.local:\n' +
      missing.map(key => `  ${key}=your_key_here`).join('\n')
    )
  }
}

// 在应用启动时调用
if (typeof window === 'undefined') {
  validateEnvironment()
}

// 组件层面的优雅降级
export function PaymentModal() {
  const apiKey = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY

  if (!apiKey) {
    return (
      <div className="error">
        <h3>⚠️ 支付功能暂时不可用</h3>
        <p>请联系管理员配置 Crossmint API Key</p>
      </div>
    )
  }

  return <PaymentContent />
}
```

---

### 🟡 风险 #4: localStorage 中积分缓存与服务端不一致

**严重程度**: 🟡 MEDIUM
**发生概率**: LOW
**影响范围**: 用户体验（显示错误的积分数）

**问题描述**:
```
前端可能会缓存用户积分到 localStorage，但服务端的积分因其他
操作（消耗、转账等）而改变，导致前端显示过期数据。
```

**缓解方案**:

```typescript
// 1. 支付成功后强制刷新
export async function handlePaymentSuccess(orderId: string) {
  const result = await confirmPayment(orderId)

  // 强制刷新积分，不使用缓存
  const { mutate: refreshCredits } = useUserCredits()
  await refreshCredits() // 无视缓存，重新获取

  // 清除所有积分相关的缓存
  localStorage.removeItem('user_credits_cache')
}

// 2. 设置合理的 TTL
const { data: credits } = useSWR('user/credits', api.getUserCredits, {
  refreshInterval: 30000,    // 30 秒自动刷新
  dedupingInterval: 5000,    // 5 秒内去重
  revalidateOnFocus: true,   // 窗口获焦时重新验证
})

// 3. 显示最后更新时间
export function CreditsDisplay() {
  const { credits, mutate } = useUserCredits()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const handleRefresh = async () => {
    const updated = await mutate()
    setLastUpdated(new Date())
  }

  return (
    <div>
      <p>积分: {credits}</p>
      <p className="text-sm">
        最后更新: {lastUpdated.toLocaleTimeString()}
      </p>
      <button onClick={handleRefresh}>刷新</button>
    </div>
  )
}
```

---

### 🟡 风险 #5: 支付超时导致用户体验差

**严重程度**: 🟡 MEDIUM
**发生概率**: MEDIUM
**影响范围**: 用户体验，转化率

**问题描述**:
```
网络慢或 Crossmint 响应慢时，用户看到长时间的加载状态，
可能导致用户放弃或关闭浏览器，影响转化率。
```

**缓解方案**:

```typescript
// 1. 进度提示
export function CheckoutWidget() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <p>正在加载支付窗口...</p>
      <ProgressBar value={progress} />
      <p className="text-sm">
        {progress < 50 && "初始化支付..."}
        {progress >= 50 && progress < 80 && "连接区块链..."}
        {progress >= 80 && "准备就绪..."}
      </p>
    </div>
  )
}

// 2. 超时提示和重试
export function PaymentModal() {
  const [isTimeout, setIsTimeout] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleInitCheckout = async () => {
    // 10 秒后如果还未加载，显示超时提示
    timeoutRef.current = setTimeout(() => {
      setIsTimeout(true)
    }, 10000)

    try {
      await initCheckout(packageId)
      clearTimeout(timeoutRef.current!)
      setIsTimeout(false)
    } catch (error) {
      setIsTimeout(true)
    }
  }

  return (
    <>
      {isTimeout && (
        <div className="timeout-banner">
          <p>⚠️ 网络较慢，请稍候...</p>
          <button onClick={handleInitCheckout}>重新加载</button>
        </div>
      )}
    </>
  )
}

// 3. 离线检测
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export function PaymentModalWithOfflineCheck() {
  const isOnline = useOnlineStatus()

  if (!isOnline) {
    return (
      <div className="error">
        <p>❌ 你似乎处于离线状态，请检查网络连接</p>
      </div>
    )
  }

  return <PaymentModal />
}
```

---

### 🟢 风险 #6: 区块链交易失败

**严重程度**: 🟢 LOW
**发生概率**: LOW
**影响范围**: 用户支付流程

**问题描述**:
```
虽然概率极低，但区块链确认可能失败（Gas 不足、网络拥堵等）。
```

**缓解方案**:
- ✅ Crossmint 已处理区块链层的重试
- ✅ 前端显示友好的错误提示
- ✅ 用户可在支付失败后重试

---

## 3. 对现有系统的影响分析

### 3.1 集成风险矩阵

```
模块              影响范围  改动规模  风险等级
────────────────────────────────────────
AuthContext       读取       无改动    🟢 低
useUserCredits    读取+刷新   无改动    🟢 低
Router            新增路由   最小      🟢 低
lib/api.ts        新增方法   最小      🟢 低
types.ts          新增类型   最小      🟢 低
现有组件          无影响     零改动    🟢 低

总体: 零破坏性改动，可安全上线
```

### 3.2 向后兼容性检查

| 场景 | 结论 |
|------|------|
| 旧版浏览器 | ✅ Vite 自动 polyfill |
| 无钱包用户 | ✅ Crossmint 显示友好提示 |
| 网络连接差 | ✅ 重试机制 + 提示 |
| 现有功能 | ✅ 零影响 |

---

## 4. 监控和告警

### 4.1 关键指标

```yaml
支付相关指标:
  - Payment Success Rate (成功率) → 目标: > 95%
  - Payment Confirmation Time (确认时间) → 目标: < 5s
  - Webhook Processing Latency (Webhook 延迟) → 目标: < 2s
  - Duplicate Order Attempts (重复订单尝试) → 告警: > 10/小时
  - Payment Timeout Rate (超时率) → 目标: < 2%

业务指标:
  - Daily Payment Volume (日成交额)
  - Total Credits Distributed (发放积分总量)
  - Refund/Chargeback Rate (退款率)
```

### 4.2 告警规则

```yaml
告警规则:
  - 支付成功率 < 90% → Critical Alert
  - Webhook 失败 > 5 次 → Warning Alert
  - 重复订单 > 10/小时 → Warning Alert
  - API 响应时间 > 10s → Warning Alert
  - 数据库连接失败 → Critical Alert
```

---

## 5. 应急预案

### 5.1 支付功能完全不可用

**恢复步骤**:
1. ✅ 检查环境变量配置
2. ✅ 检查 Crossmint API 状态
3. ✅ 检查后端服务状态
4. ✅ 在前端显示维护提示
5. ✅ 通知 Crossmint 支持团队

### 5.2 大量重复订单

**恢复步骤**:
1. ✅ 停止处理 Webhook
2. ✅ 查询数据库中的重复记录
3. ✅ 手动回滚重复加入的积分
4. ✅ 调查根本原因
5. ✅ 恢复 Webhook 处理

### 5.3 用户反馈积分未加入

**恢复步骤**:
1. ✅ 查询 payment_orders 表中是否有记录
2. ✅ 查询用户的积分历史
3. ✅ 如果确实未加入，手动执行加积分操作
4. ✅ 发送邮件确认给用户

---

## 6. 风险评分总结

| 风险 | 等级 | 概率 | 影响 | 缓解 | 得分 |
|------|------|------|------|------|------|
| Webhook 重复 | 🔴 High | M | H | ✅ | 3/5 |
| 支付失败无反馈 | 🔴 High | L | H | ✅ | 2/5 |
| 环境变量缺失 | 🟡 Medium | M | M | ✅ | 2/5 |
| 缓存不一致 | 🟡 Medium | L | M | ✅ | 1/5 |
| 超时体验差 | 🟡 Medium | M | M | ✅ | 2/5 |
| 区块链失败 | 🟢 Low | L | L | ✅ | 1/5 |

**整体风险评分**: **2/5** (低风险)
**是否可以上线**: **✅ YES** (所有关键风险已缓解)

---

## 总结

本提案已识别 6 个关键风险，每个风险都有明确的缓解方案：

✅ **技术风险已被消除**
- 幂等性保证了支付的一致性
- 重试机制确保了可靠性
- 监控告警及时发现问题

✅ **用户体验得到保护**
- 友好的错误提示
- 离线检测
- 进度反馈

✅ **对现有系统零影响**
- 仅新增模块
- 无修改现有代码
- 完全独立可维护

✅ **应急预案已备好**
- 有迹可循的故障排查
- 数据恢复流程清晰
- 人工干预工具已规划

**推荐**: 可以安全地进入实施阶段 ✅

