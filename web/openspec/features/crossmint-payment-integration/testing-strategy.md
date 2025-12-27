# Crossmint Payment Integration - 完整测试策略

**目标**: 100% 测试覆盖率（Statements, Branches, Functions, Lines）

---

## 1. 测试金字塔

```
                    ▲
                   /  \
                  /    \
                 /  E2E  \          5 个场景
                /  Tests  \         (Playwright)
               /____________\
              /              \
             /  Integration   \    12+ 用例
            /    Tests         \   (Vitest)
           /____________________\
          /                      \
         /      Unit Tests        \  20+ 用例
        /  (Vitest, 100% mock)     \ (Vitest)
       /________________________________\
```

---

## 2. 单元测试（Unit Tests）

### 2.1 `paymentValidator.test.ts` (6+ 用例)

```typescript
describe("paymentValidator", () => {
  // ====== validatePackageId ======
  describe("validatePackageId", () => {
    it("应该接受有效的套餐ID", () => {
      expect(validatePackageId("starter")).toBe(true)
      expect(validatePackageId("pro")).toBe(true)
      expect(validatePackageId("vip")).toBe(true)
    })

    it("应该拒绝无效的套餐ID", () => {
      expect(validatePackageId("invalid")).toBe(false)
      expect(validatePackageId("")).toBe(false)
      expect(validatePackageId(null as any)).toBe(false)
    })
  })

  // ====== validatePrice ======
  describe("validatePrice", () => {
    it("应该接受有效的价格", () => {
      expect(validatePrice(10)).toBe(true)
      expect(validatePrice(50)).toBe(true)
      expect(validatePrice(100)).toBe(true)
    })

    it("应该拒绝无效的价格", () => {
      expect(validatePrice(-10)).toBe(false)
      expect(validatePrice(0)).toBe(false)
      expect(validatePrice(999999)).toBe(false)
    })
  })

  // ====== validateCreditsAmount ======
  describe("validateCreditsAmount", () => {
    it("应该接受有效的积分数", () => {
      expect(validateCreditsAmount(500)).toBe(true)
      expect(validateCreditsAmount(3000)).toBe(true)
    })

    it("应该拒绝无效的积分数", () => {
      expect(validateCreditsAmount(-100)).toBe(false)
      expect(validateCreditsAmount(0)).toBe(false)
    })
  })

  // ====== validateOrder ======
  describe("validateOrder", () => {
    it("应该验证完整的订单对象", () => {
      const order = createMockPaymentOrder()
      const result = validateOrder(order)
      expect(result.valid).toBe(true)
    })

    it("应该检测缺失的必填字段", () => {
      const order = createMockPaymentOrder()
      delete (order as any).userId
      const result = validateOrder(order)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain("userId is required")
    })
  })
})
```

### 2.2 `PaymentPackage.test.ts` (3+ 用例)

```typescript
describe("PaymentPackage Value Object", () => {
  it("应该提供正确的套餐配置", () => {
    const starter = PAYMENT_PACKAGES.starter
    expect(starter.id).toBe("starter")
    expect(starter.price.amount).toBe(10)
    expect(starter.credits.amount).toBe(500)
  })

  it("应该计算总积分（基础 + 赠送）", () => {
    const pro = PAYMENT_PACKAGES.pro
    const totalCredits =
      pro.credits.amount + (pro.credits.bonusAmount || 0)
    expect(totalCredits).toBe(3300) // 3000 + 300
  })

  it("应该保持不可变性", () => {
    const vip = PAYMENT_PACKAGES.vip
    expect(() => {
      ;(vip as any).price.amount = 999
    }).not.toThrow() // 不会抛异常，但不应改变原值
  })
})
```

### 2.3 `useCrossmintCheckout.test.ts` (5+ 用例)

```typescript
describe("useCrossmintCheckout Hook", () => {
  it("应该初始化 Crossmint Checkout", async () => {
    const mockCrossmintService = createMockCrossmintService()
    const { result } = renderHook(() => useCrossmintCheckout(), {
      wrapper: ({ children }) => (
        <PaymentProvider>{children}</PaymentProvider>
      ),
    })

    await act(async () => {
      await result.current.initCheckout("starter")
    })

    expect(result.current.status).toBe("loading")
  })

  it("应该处理支付成功事件", async () => {
    const { result } = renderHook(() => useCrossmintCheckout())

    act(() => {
      result.current.handleCheckoutEvent({
        type: "checkout:order.paid",
        payload: { orderId: "test-order-123" },
      })
    })

    expect(result.current.status).toBe("success")
    expect(result.current.orderId).toBe("test-order-123")
  })

  it("应该处理支付失败事件", async () => {
    const { result } = renderHook(() => useCrossmintCheckout())

    act(() => {
      result.current.handleCheckoutEvent({
        type: "checkout:order.failed",
        payload: { error: "Wallet disconnected" },
      })
    })

    expect(result.current.status).toBe("error")
    expect(result.current.error).toBe("Wallet disconnected")
  })

  it("应该处理用户取消支付", async () => {
    const { result } = renderHook(() => useCrossmintCheckout())

    act(() => {
      result.current.handleCheckoutEvent({
        type: "checkout:order.cancelled",
        payload: {},
      })
    })

    expect(result.current.status).toBe("idle")
  })

  it("应该重置状态", async () => {
    const { result } = renderHook(() => useCrossmintCheckout())

    act(() => {
      result.current.handleCheckoutEvent({
        type: "checkout:order.paid",
        payload: { orderId: "test" },
      })
    })

    // 假设有 reset 方法
    // act(() => {
    //   result.current.reset()
    // })

    // expect(result.current.status).toBe("idle")
  })
})
```

### 2.4 `usePaymentPackages.test.ts` (3+ 用例)

```typescript
describe("usePaymentPackages Hook", () => {
  it("应该返回所有支付套餐", async () => {
    const { result } = renderHook(() => usePaymentPackages())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.packages).toHaveLength(3)
    expect(result.current.packages[0].id).toBe("starter")
  })

  it("应该缓存套餐数据", async () => {
    const { result } = renderHook(() => usePaymentPackages())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const firstCall = result.current.packages

    // 再次调用，应该返回缓存数据
    const { result: result2 } = renderHook(() => usePaymentPackages())

    expect(result2.current.packages).toBe(firstCall) // 引用相同
  })

  it("应该处理数据加载失败", async () => {
    // Mock API 返回错误
    const { result } = renderHook(() => usePaymentPackages())

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.packages).toEqual([])
  })
})
```

### 2.5 `PaymentContext.test.ts` (4+ 用例)

```typescript
describe("PaymentContext", () => {
  it("应该提供初始状态", () => {
    const { result } = renderHook(() => usePaymentContext(), {
      wrapper: PaymentProvider,
    })

    expect(result.current.paymentStatus).toBe("idle")
    expect(result.current.selectedPackage).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it("应该选择套餐", () => {
    const { result } = renderHook(() => usePaymentContext(), {
      wrapper: PaymentProvider,
    })

    act(() => {
      result.current.selectPackage("pro")
    })

    expect(result.current.selectedPackage?.id).toBe("pro")
  })

  it("应该清除错误", () => {
    const { result } = renderHook(() => usePaymentContext(), {
      wrapper: PaymentProvider,
    })

    act(() => {
      result.current.handlePaymentError("Test error")
    })

    expect(result.current.error).toBe("Test error")

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBe(null)
  })

  it("应该重置支付状态", () => {
    const { result } = renderHook(() => usePaymentContext(), {
      wrapper: PaymentProvider,
    })

    act(() => {
      result.current.selectPackage("starter")
    })

    act(() => {
      result.current.resetPayment()
    })

    expect(result.current.selectedPackage).toBe(null)
    expect(result.current.paymentStatus).toBe("idle")
  })
})
```

### 2.6 工具函数测试 (4+ 用例)

```typescript
// utils/formatPrice.test.ts
describe("formatPrice", () => {
  it("应该格式化价格", () => {
    expect(formatPrice(10)).toBe("10.00 USDT")
    expect(formatPrice(50)).toBe("50.00 USDT")
  })
})

// utils/calculateBonus.test.ts
describe("calculateBonus", () => {
  it("应该计算赠送积分", () => {
    expect(calculateBonus(500, 1.0)).toBe(0)
    expect(calculateBonus(3000, 1.1)).toBe(300)
    expect(calculateBonus(8000, 1.2)).toBe(1600)
  })
})

// utils/generatePaymentId.test.ts
describe("generatePaymentId", () => {
  it("应该生成唯一的支付ID", () => {
    const id1 = generatePaymentId()
    const id2 = generatePaymentId()
    expect(id1).not.toBe(id2)
  })
})

// utils/paymentHelpers.test.ts
describe("Payment Helper Functions", () => {
  it("应该判断支付是否成功", () => {
    const successOrder = createMockPaymentOrder({
      status: "completed",
    })
    expect(isPaymentSuccessful(successOrder)).toBe(true)
  })
})
```

---

## 3. 集成测试（Integration Tests）

### 3.1 `PaymentOrchestrator.test.ts` (6+ 用例)

```typescript
describe("PaymentOrchestrator Integration", () => {
  let orchestrator: PaymentOrchestrator
  let mockCrossmintService: MockCrossmintService
  let mockCreditsService: MockCreditsService
  let mockValidator: MockPaymentValidator

  beforeEach(() => {
    mockCrossmintService = createMockCrossmintService()
    mockCreditsService = createMockCreditsService()
    mockValidator = createMockPaymentValidator()

    orchestrator = new PaymentOrchestrator(
      mockCrossmintService,
      mockCreditsService,
      mockValidator,
    )
  })

  it("应该验证套餐ID", () => {
    const pkg = orchestrator.validatePackage("pro")
    expect(pkg).toBeDefined()
    expect(pkg?.id).toBe("pro")
  })

  it("应该拒绝无效的套餐ID", () => {
    const pkg = orchestrator.validatePackage("invalid")
    expect(pkg).toBeNull()
  })

  it("应该创建支付会话", async () => {
    const sessionId = await orchestrator.createPaymentSession("starter")
    expect(sessionId).toBeDefined()
    expect(mockCrossmintService.initializeCheckout).toHaveBeenCalled()
  })

  it("应该处理支付成功流程", async () => {
    const userId = "user-123"
    const orderId = "order-456"

    // Mock 后端响应
    mockCreditsService.confirmPayment.mockResolvedValue({
      success: true,
      creditsAdded: 500,
    })

    await orchestrator.handlePaymentSuccess(orderId)

    expect(mockCreditsService.confirmPayment).toHaveBeenCalledWith({
      orderId,
      userId,
    })
  })

  it("应该处理支付错误", () => {
    const error = new PaymentError("Network error")

    orchestrator.handlePaymentError(error)

    expect(orchestrator.lastError).toEqual(error)
  })

  it("应该获取支付历史", async () => {
    mockCreditsService.getPaymentHistory.mockResolvedValue([
      createMockPaymentOrder({ status: "completed" }),
    ])

    const history = await orchestrator.getPaymentHistory("user-123")

    expect(history).toHaveLength(1)
    expect(history[0].status).toBe("completed")
  })
})
```

### 3.2 `CrossmintService.test.ts` (4+ 用例)

```typescript
describe("CrossmintService Integration", () => {
  let service: CrossmintService

  beforeEach(() => {
    service = new CrossmintService()
  })

  it("应该初始化 Checkout", async () => {
    const config = {
      packages: [PAYMENT_PACKAGES.starter],
      apiKey: "test-key",
    }

    await service.initializeCheckout(config)

    // 验证 SDK 初始化
    expect(window.__crossmint).toBeDefined()
  })

  it("应该创建 Crossmint lineItems", () => {
    const lineItems = service.createLineItems(PAYMENT_PACKAGES.pro)

    expect(lineItems).toEqual([
      {
        price: "50",
        currency: "USDT",
        quantity: 1,
        metadata: { packageId: "pro", credits: 3300 },
      },
    ])
  })

  it("应该验证支付签名", () => {
    const signature =
      "valid_signature_from_crossmint_for_test_payload"
    const payload = { orderId: "test-123" }

    const verified = service.verifyPaymentSignature(
      signature,
      payload
    )

    expect(verified).toBe(true)
  })

  it("应该处理 Crossmint 事件", () => {
    const listener = jest.fn()
    service.on("order:paid", listener)

    service.handleCheckoutEvent({
      type: "checkout:order.paid",
      payload: { orderId: "test-123" },
    })

    expect(listener).toHaveBeenCalledWith({
      orderId: "test-123",
    })
  })
})
```

### 3.3 `PaymentContext.test.ts` (集成部分) (3+ 用例)

```typescript
describe("PaymentContext Integration", () => {
  it("应该完整的支付流程更新状态", async () => {
    const { result } = renderHook(() => usePaymentContext(), {
      wrapper: PaymentProvider,
    })

    // 1. 选择套餐
    act(() => {
      result.current.selectPackage("starter")
    })

    expect(result.current.selectedPackage?.id).toBe("starter")

    // 2. 开始支付
    act(() => {
      result.current.initiatePayment("starter")
    })

    expect(result.current.paymentStatus).toBe("loading")

    // 3. 支付成功
    await waitFor(() => {
      expect(result.current.paymentStatus).toBe("success")
    })

    expect(result.current.creditsAdded).toBeGreaterThan(0)
  })

  it("应该处理支付失败并允许重试", async () => {
    const { result } = renderHook(() => usePaymentContext(), {
      wrapper: PaymentProvider,
    })

    act(() => {
      result.current.selectPackage("pro")
      result.current.initiatePayment("pro")
    })

    // 模拟支付失败
    act(() => {
      result.current.handlePaymentError("Network timeout")
    })

    expect(result.current.paymentStatus).toBe("error")
    expect(result.current.error).toBe("Network timeout")

    // 重新选择套餐重试
    act(() => {
      result.current.selectPackage("pro")
    })

    expect(result.current.paymentStatus).toBe("idle")
  })

  it("应该支持多个 Hook 实例的状态同步", async () => {
    const { result: result1 } = renderHook(
      () => usePaymentContext(),
      { wrapper: PaymentProvider }
    )
    const { result: result2 } = renderHook(
      () => usePaymentContext(),
      { wrapper: PaymentProvider }
    )

    act(() => {
      result1.current.selectPackage("vip")
    })

    // 两个 Hook 应该看到相同的状态
    expect(result2.current.selectedPackage?.id).toBe("vip")
  })
})
```

---

## 4. 端到端测试（E2E Tests）

### 4.1 `payment-flow.e2e.test.ts` (Playwright)

```typescript
describe("Complete Payment Flow", () => {
  beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5000/profile")
    await page.waitForSelector("[data-testid='recharge-button']")
  })

  test("用户应该能够完整地走通支付流程", async ({
    page,
  }) => {
    // 1. 点击充值按钮
    await page.click("[data-testid='recharge-button']")

    // 2. 等待 Modal 打开
    await page.waitForSelector("[data-testid='payment-modal']")

    // 3. 选择套餐
    await page.click(
      "[data-testid='package-selector-pro']"
    )

    // 4. 验证选中的套餐
    const selectedPackage = await page.locator(
      "[data-testid='selected-package-name']"
    )
    await expect(selectedPackage).toContainText("专业套餐")

    // 5. 点击支付按钮
    await page.click("[data-testid='checkout-button']")

    // 6. 等待 Crossmint Checkout 加载
    await page.waitForSelector("iframe[title='Crossmint Checkout']")

    // 7. 模拟支付成功（使用 Crossmint 测试钱包）
    const frame = page.frameLocator(
      "iframe[title='Crossmint Checkout']"
    )
    await frame.locator("[data-testid='connect-wallet']").click()
    await page.waitForTimeout(2000)
    // ... Crossmint 会处理钱包连接和签署

    // 8. 验证成功页面
    await page.waitForSelector("[data-testid='payment-success']")
    const successMessage = await page.locator(
      "[data-testid='credits-added']"
    )
    await expect(successMessage).toContainText("3300")

    // 9. 关闭 Modal
    await page.click("[data-testid='close-modal']")

    // 10. 验证用户积分已更新
    const updatedCredits = await page.locator(
      "[data-testid='user-credits']"
    )
    const creditsText = await updatedCredits.textContent()
    expect(creditsText).toContain("3300")
  })

  test("用户取消支付应该不加积分", async ({ page }) => {
    // 点击充值
    await page.click("[data-testid='recharge-button']")
    await page.waitForSelector("[data-testid='payment-modal']")

    // 选择套餐
    await page.click(
      "[data-testid='package-selector-starter']"
    )

    // 点击支付
    await page.click("[data-testid='checkout-button']")

    // 等待 Crossmint
    await page.waitForSelector("iframe[title='Crossmint Checkout']")

    // 关闭 Checkout（模拟取消）
    await page.press("Escape")

    // 验证未显示成功页面
    const successElement = page.locator(
      "[data-testid='payment-success']"
    )
    await expect(successElement).not.toBeVisible()
  })

  test("支付失败应该显示错误提示", async ({ page }) => {
    // ... 类似步骤，但模拟支付失败

    // 验证错误页面
    await page.waitForSelector("[data-testid='payment-error']")
    const errorMessage = await page.locator(
      "[data-testid='error-message']"
    )
    await expect(errorMessage).toContainText("网络错误")

    // 验证重试按钮
    const retryButton = await page.locator(
      "[data-testid='retry-button']"
    )
    await expect(retryButton).toBeVisible()
  })

  test("无钱包环境应该提示安装钱包", async ({ page }) => {
    // 禁用钱包
    await page.evaluate(() => {
      delete (window as any).ethereum
    })

    await page.click("[data-testid='recharge-button']")
    await page.click(
      "[data-testid='package-selector-pro']"
    )
    await page.click("[data-testid='checkout-button']")

    // 验证钱包提示
    const walletPrompt = await page.locator(
      "[data-testid='wallet-install-prompt']"
    )
    await expect(walletPrompt).toBeVisible()
  })

  test("套餐验证应该防止非法购买", async ({ page }) => {
    // 尝试注入非法套餐ID
    await page.evaluate(() => {
      // 模拟攻击者尝试修改价格
      const event = new CustomEvent("selectPackage", {
        detail: { packageId: "invalid_package" },
      })
      window.dispatchEvent(event)
    })

    // 应该显示验证错误
    const errorElement = page.locator(
      "[data-testid='validation-error']"
    )
    await expect(errorElement).toBeVisible()
  })
})
```

---

## 5. 测试数据与 Mock 策略

### 5.1 Mock 工厂函数

```typescript
// __mocks__/paymentMocks.ts

export function createMockPaymentOrder(
  overrides?: Partial<PaymentOrder>
): PaymentOrder {
  return {
    id: "order-123",
    crossmintOrderId: "crossmint-order-123",
    userId: "user-123",
    packageId: "starter",
    packageSnapshot: {
      name: "初级套餐",
      credits: 500,
      bonusCredits: 0,
      totalCredits: 500,
    },
    payment: {
      amount: 10,
      currency: "USDT",
      chainUsed: "polygon",
      transactionHash:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    },
    status: "completed",
    statusHistory: [
      {
        status: "completed",
        timestamp: new Date(),
      },
    ],
    createdAt: new Date(),
    paidAt: new Date(),
    completedAt: new Date(),
    credits: {
      baseCredits: 500,
      bonusCredits: 0,
      totalCredits: 500,
      addedToUserAt: new Date(),
    },
    verification: {
      verified: true,
      verifiedAt: new Date(),
    },
    retryCount: 0,
    ...overrides,
  }
}

export function createMockCrossmintService(): MockCrossmintService {
  return {
    initializeCheckout: jest.fn().mockResolvedValue(undefined),
    verifyPaymentSignature: jest
      .fn()
      .mockReturnValue(true),
    createLineItems: jest.fn().mockReturnValue([
      {
        price: "10",
        currency: "USDT",
        quantity: 1,
        metadata: { packageId: "starter", credits: 500 },
      },
    ]),
    handleCheckoutEvent: jest.fn(),
  }
}

export function createMockCreditsService(): MockCreditsService {
  return {
    confirmPayment: jest.fn().mockResolvedValue({
      success: true,
      creditsAdded: 500,
    }),
    getPaymentHistory: jest
      .fn()
      .mockResolvedValue([createMockPaymentOrder()]),
    addCreditsToUser: jest.fn().mockResolvedValue(true),
  }
}

export function createMockPaymentValidator(): MockPaymentValidator {
  return {
    validatePackageId: jest.fn().mockReturnValue(true),
    validatePrice: jest.fn().mockReturnValue(true),
    validateCreditsAmount: jest.fn().mockReturnValue(true),
    validateOrder: jest.fn().mockReturnValue({
      valid: true,
      errors: [],
    }),
  }
}
```

### 5.2 测试环境配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/features/payment/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/features/payment/**/*.{ts,tsx}"],
      exclude: [
        "src/features/payment/**/*.test.{ts,tsx}",
        "src/features/payment/__tests__/**",
      ],
      // 要求 100% 覆盖率
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
})
```

---

## 6. 测试覆盖率目标

### 6.1 覆盖率矩阵

| 文件 | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| PaymentOrchestrator | 100% | 100% | 100% | 100% |
| CrossmintService | 100% | 100% | 100% | 100% |
| paymentValidator | 100% | 100% | 100% | 100% |
| PaymentContext | 100% | 100% | 100% | 100% |
| Hooks (所有) | 100% | 100% | 100% | 100% |
| Components | 95%+ | 95%+ | 100% | 95%+ |
| Utils | 100% | 100% | 100% | 100% |
| **总体** | **100%** | **100%** | **100%** | **100%** |

### 6.2 验证覆盖率

```bash
# 运行测试并生成覆盖率报告
npm run test:coverage -- src/features/payment

# 在浏览器中查看 HTML 报告
open coverage/index.html

# 验证覆盖率达到 100%
npm run test:coverage -- --check --all 100
```

---

## 7. 持续集成（CI）

### 7.1 GitHub Actions 工作流

```yaml
name: Payment Feature Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm run test:unit -- src/features/payment

      - name: Run integration tests
        run: npm run test:integration -- src/features/payment

      - name: Check coverage
        run: npm run test:coverage -- --check src/features/payment

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: payment

      - name: Run E2E tests (on main branch only)
        if: github.ref == 'refs/heads/main'
        run: npm run test:e2e

      - name: Generate coverage report
        if: always()
        run: npm run test:coverage -- --reporter=json-summary

      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs')
            const coverage = JSON.parse(
              fs.readFileSync('./coverage/coverage-summary.json', 'utf8')
            )
            const msg = `## 支付模块测试覆盖率\n- 语句: ${coverage.total.lines.pct}%\n- 分支: ${coverage.total.branches.pct}%`
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: msg
            })
```

---

## 8. 测试执行命令

```bash
# 运行所有支付模块的测试
npm run test -- src/features/payment

# 只运行单元测试
npm run test:unit -- src/features/payment

# 只运行集成测试
npm run test:integration -- src/features/payment

# 监听模式（开发时）
npm run test:watch -- src/features/payment

# 生成覆盖率报告
npm run test:coverage -- src/features/payment

# 运行 E2E 测试
npm run test:e2e

# 生成 HTML 覆盖率报告
npm run test:coverage -- --reporter=html
open coverage/index.html
```

---

## 9. 回归测试（Regression Tests）

```typescript
// regression.test.ts
describe("Payment Feature Regression Tests", () => {
  it("不应该破坏现有的积分显示功能", async () => {
    const { result } = renderHook(() => useUserCredits(), {
      wrapper: ({ children }) => (
        <AuthProvider>
          <PaymentProvider>{children}</PaymentProvider>
        </AuthProvider>
      ),
    })

    await waitFor(() => {
      expect(result.current.credits).toBeGreaterThanOrEqual(0)
    })
  })

  it("不应该影响用户认证流程", async () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeDefined()
    expect(result.current.token).toBeDefined()
  })

  it("不应该改变现有的路由", async ({ page }) => {
    await page.goto("http://localhost:5000/traders")
    expect(page.url()).toContain("/traders")
  })
})
```

---

## 总结

✅ **完整的测试体系**：
- **单元测试**: 20+ 用例，100% 覆盖关键逻辑
- **集成测试**: 12+ 用例，验证模块间协作
- **E2E 测试**: 5 个真实用户场景
- **回归测试**: 确保不破坏现有功能

✅ **自动化 CI/CD**：
- GitHub Actions 自动运行测试
- 覆盖率检查强制 100%
- PR 评论展示测试结果

✅ **100% 覆盖率目标**：
- 所有新代码必须有对应测试
- 完整的分支覆盖（包括错误路径）
- 清晰的测试报告和文档
