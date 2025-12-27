# Payment Feature - 支付套餐展示页面 (Delta Spec)

## ADDED Requirements

### Requirement: 支付套餐展示页面

系统 SHALL 提供一个独立的 `/pricing` 页面，用户可以浏览、对比和选择购买积分套餐。

#### Scenario: 用户访问套餐页面

- **WHEN** 用户访问 `/pricing` 页面
- **THEN** 页面加载并展示所有可用的积分套餐（最少 3 个）
- **AND** 每个套餐卡片显示：名称、价格（USDT）、基础积分、赠送积分、总积分
- **AND** 推荐套餐显示徽章（如 "HOT" 或 "BEST SAVE"）
- **AND** 页面响应式，支持手机、平板、桌面视图

#### Scenario: 套餐数据来源

- **WHEN** 页面初始化时
- **THEN** 系统调用 `GET /api/v1/credit-packages` 获取最新套餐列表
- **AND** 如果 API 失败，使用硬编码的默认套餐列表
- **AND** 套餐数据缓存 5 分钟，期间不重复请求

#### Scenario: 用户对比套餐

- **WHEN** 用户在套餐页面
- **THEN** 页面显示套餐对比表，包含：
  - 套餐名称和价格
  - 包含的功能特性（例如：支持的区块链）
  - 赠送积分比例
  - 成本效益分析（每 USDT 能获得多少积分）

#### Scenario: 用户选择购买

- **WHEN** 用户点击套餐卡片上的 "立即购买" 按钮
- **THEN** PaymentModal 弹出，展示所选套餐的支付界面
- **AND** 支付流程与现有 PaymentModal 流程一致
- **AND** 支付成功后，用户积分被添加到账户

#### Scenario: 国际化支持

- **WHEN** 用户切换语言（中文 / 英文）
- **THEN** 套餐页面所有文案（名称、特性、按钮等）都更新为对应语言
- **AND** 套餐对比表的特性列表也使用对应语言显示

#### Scenario: 错误处理

- **WHEN** API 请求超时或失败
- **THEN** 页面显示友好的错误提示，并建议用户重试
- **AND** 自动使用硬编码的默认套餐列表作为 fallback
- **AND** 用户仍可以选择购买套餐（基于 fallback 数据）

---

### Requirement: 套餐卡片组件 (PricingCard)

系统 SHALL 提供可复用的套餐卡片组件，用于展示单个积分套餐的信息。

#### Scenario: 组件基本渲染

- **WHEN** PricingCard 组件接收套餐数据（id、name、price、credits 等）
- **THEN** 组件正确渲染套餐卡片，显示：
  - 套餐名称
  - 价格（USDT）
  - 基础积分和赠送积分
  - "立即购买" 按钮

#### Scenario: 推荐徽章

- **WHEN** 套餐数据包含 `badge` 字段（如 "HOT" 或 "BEST SAVE"）
- **THEN** 组件在卡片右上角显示徽章
- **AND** 如果套餐有 `highlightColor`，卡片边框或背景使用该颜色高亮

#### Scenario: 响应式设计

- **WHEN** 用户在不同尺寸的屏幕上查看
- **THEN** 套餐卡片宽度自适应：
  - 手机 (< 640px): 满宽
  - 平板 (640px-1024px): 50% 宽度
  - 桌面 (> 1024px): 33% 宽度

#### Scenario: 积分计算展示

- **WHEN** 组件接收 `credits: { amount: 3000, bonusMultiplier: 1.1, bonusAmount: 300 }`
- **THEN** 卡片显示：
  - 基础积分: 3,000
  - 赠送积分: 300
  - 总积分: 3,300

#### Scenario: 不可用套餐处理

- **WHEN** 套餐的 `isActive` 为 false
- **THEN** 组件灰显卡片，"立即购买" 按钮被禁用
- **AND** 显示 "暂时不可用" 或类似提示

---

### Requirement: 动态套餐数据获取 (usePricingData Hook)

系统 SHALL 提供一个 React Hook，用于从后端动态获取和缓存积分套餐数据。

#### Scenario: 基本使用

- **WHEN** 组件调用 `const { packages, loading, error } = usePricingData()`
- **THEN** Hook 返回：
  - `packages`: PaymentPackage[] 套餐列表
  - `loading`: boolean 加载中标志
  - `error`: Error | null 错误信息
  - `refetch`: () => void 手动刷新函数

#### Scenario: API 调用

- **WHEN** Hook 初始化或手动调用 `refetch()`
- **THEN** Hook 发起请求 `GET /api/v1/credit-packages`
- **AND** 解析响应并更新 `packages` 状态

#### Scenario: 缓存和 TTL

- **WHEN** Hook 首次获取数据后（假设为 T0 时刻）
- **THEN** 5 分钟内再次调用 Hook，直接返回缓存数据，不发起新请求
- **AND** 超过 5 分钟后，缓存失效，下次调用时重新请求
- **AND** 用户可调用 `refetch()` 强制刷新，绕过缓存

#### Scenario: Fallback 处理

- **WHEN** API 请求失败（超时、404、500 等）
- **THEN** Hook 返回硬编码的默认套餐列表（PAYMENT_PACKAGES）
- **AND** `error` 状态记录错误信息，但 `packages` 不为空

#### Scenario: 国际化集成

- **WHEN** 用户切换语言或 i18n locale 变化
- **THEN** Hook 自动获取对应语言的套餐数据（如果后端支持）
- **OR** 前端本地化套餐名称和描述

#### Scenario: 内存泄漏防护

- **WHEN** 组件卸载时
- **THEN** Hook 的网络请求被正确取消（使用 AbortController）
- **AND** 订阅被清理，不产生内存泄漏

---

### Requirement: 套餐特性和常量 (pricing-content)

系统 SHALL 提供统一的套餐特性文案、区块链列表等常量，支持多语言。

#### Scenario: 特性列表

- **WHEN** 套餐页面渲染对比表时
- **THEN** 系统加载 `PRICING_FEATURES` 常量，显示所有套餐共有的特性列表
- **AND** 特性包括：支持的区块链（Polygon、Base、Arbitrum）、最大订单数、优先级等

#### Scenario: FAQ 文案

- **WHEN** 用户查看套餐页面下方的常见问题
- **THEN** 系统显示 `PRICING_FAQ` 数据，包含：
  - 问题（中英文）
  - 答案（中英文）
  - 可展开/折叠

---

## MODIFIED Requirements

### Requirement: 支付套餐类型定义

系统的 `PaymentPackage` 类型定义 SHALL 支持动态套餐管理，不限制套餐 ID 为固定的三个值。

**Before**:
```typescript
export interface PaymentPackage {
  id: "starter" | "pro" | "vip"  // 硬编码的联合类型
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
}
```

**After**:
```typescript
export interface PaymentPackage {
  id: string  // ✅ 改为灵活的字符串
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
  isActive?: boolean  // ✅ 新增：支持禁用套餐
}
```

#### Scenario: 类型兼容性

- **WHEN** 现有代码使用 `PaymentPackage` 类型
- **THEN** 改动不产生编译错误或运行时问题
- **AND** 现有的 "starter" | "pro" | "vip" 字符串仍然有效（字符串是兼容的）

#### Scenario: 验证逻辑更新

- **WHEN** 后端返回一个未知的套餐 ID（如 "ultimate"）
- **THEN** 前端不拒绝它（不再有类型检查），而是接受并渲染
- **AND** 数据验证由后端负责（后端 `/api/v1/credit-packages` 返回的数据已经验证）

---

### Requirement: PaymentModal 对动态套餐的支持

系统的 `PaymentModal` 组件 SHALL 支持接收动态套餐数据，不依赖硬编码的套餐列表。

**Change Details**:
- PaymentModal 现有的接口保持不变（接收 `package` props）
- 但内部不再假设 `package.id` 只能是 "starter" | "pro" | "vip"
- 新增可选 feature：如果不传 `package` props，从 `usePricingData()` 获取套餐列表供用户选择

#### Scenario: 支持动态套餐

- **WHEN** PaymentModal 接收任意 `package` 数据（ID 为任何字符串）
- **THEN** 组件正确处理，不产生类型错误或运行时错误

#### Scenario: 向后兼容

- **WHEN** 现有代码传入 `package={{ id: "pro", ... }}`
- **THEN** PaymentModal 继续正常工作，无需改动调用代码

---

## REMOVED Requirements

（无移除项）

---

## 验收标准

- ✅ `/pricing` 页面成功渲染，显示三个套餐卡片
- ✅ 套餐数据从 `/api/v1/credit-packages` 正确获取和缓存
- ✅ "立即购买" 按钮打开 PaymentModal，支付流程完整
- ✅ 中英文切换成功，所有文案正确显示
- ✅ 响应式设计在手机、平板、桌面上都可用
- ✅ TypeScript 编译无错误，no `any` 类型
- ✅ 单元测试覆盖 80% 以上，所有关键路径有测试
- ✅ E2E 测试覆盖完整的套餐选择和支付流程
- ✅ 性能：套餐页面加载时间 < 2s，首屏 LCP < 2.5s
- ✅ API 失败时，使用 fallback 常量，用户仍可购买
