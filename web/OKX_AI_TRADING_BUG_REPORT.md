# OKX AI 交易功能 Bug 报告

## 1. Bug 描述

**问题**: OKX 交易所配置中的 `Passphrase`（口令）字段无法正确保存

**影响**:
- 用户无法成功配置 OKX 交易所用于 AI 交易
- 所有使用 OKX 交易所的 AI 交易员都将无法正常工作
- 会导致 API 认证失败，因为 OKX 交易所需要 passphrase 进行 API 调用

**重现步骤**:
1. 登录系统并导航到 AI 交易员页面
2. 点击"添加交易所"按钮
3. 从下拉菜单中选择 OKX 交易所
4. 填写 API Key、Secret Key 和 Passphrase
5. 点击"保存配置"按钮
6. 再次编辑该 OKX 交易所配置
7. 观察到 Passphrase 字段为空

## 2. 根因分析

### 问题根源
在 `ExchangeConfigModal` 组件的 `handleSubmit` 函数中，当处理 OKX 交易所配置时，虽然正确验证了 Passphrase 字段，但在调用 `onSave` 函数时没有将 Passphrase 传递给父组件的 `handleSaveExchangeConfig` 函数。

### 代码定位
**文件**: `/Users/guoyingcheng/dreame/code/nofx/web/src/components/AITradersPage.tsx`

**问题代码**:
```typescript
} else if (selectedExchange?.id === 'okx') {
  if (!apiKey.trim() || !secretKey.trim() || !passphrase.trim()) return;
  await onSave(selectedExchangeId, apiKey.trim(), secretKey.trim(), testnet);
}
```

**分析**:
- 第 3 行：验证了 `passphrase` 是必填字段
- 第 4 行：调用 `onSave` 时只传递了 4 个参数，遗漏了 `passphrase`

## 3. 修复方案

### 修复代码
```typescript
} else if (selectedExchange?.id === 'okx') {
  if (!apiKey.trim() || !secretKey.trim() || !passphrase.trim()) return;
  await onSave(selectedExchangeId, apiKey.trim(), secretKey.trim(), testnet, undefined, undefined, undefined, undefined, passphrase.trim());
}
```

### 辅助修改
需要更新 `ExchangeConfigModal` 组件的 `onSave` 函数签名，将 `okxPassphrase` 作为第 9 个参数：

```typescript
onSave: (exchangeId: string, apiKey: string, secretKey?: string, testnet?: boolean, hyperliquidWalletAddr?: string, asterUser?: string, asterSigner?: string, asterPrivateKey?: string, okxPassphrase?: string) => Promise<void>;
```

## 4. 修复验证

### 编译验证
执行 `npm run build` 命令，确认 TypeScript 类型检查通过，没有编译错误。

### 功能验证
1. 登录系统并导航到 AI 交易员页面
2. 点击"添加交易所"按钮
3. 从下拉菜单中选择 OKX 交易所
4. 填写 API Key、Secret Key 和 Passphrase（例如：`test-api-key`, `test-secret-key`, `test-passphrase`）
5. 点击"保存配置"按钮
6. 再次编辑该 OKX 交易所配置
7. 验证 Passphrase 字段中显示的是之前填写的值 `test-passphrase`

### 后端 API 验证
查看网络请求，确认 OKX 交易所配置保存时，`okx_passphrase` 字段已正确发送到后端 API。

## 5. 潜在风险

### 修复影响范围
- 仅影响 OKX 交易所的配置功能
- 不影响其他交易所的配置
- 不影响 AI 交易员的其他功能

### 回滚方案
如果修复出现问题，可以将代码回滚到修复前的版本，即：
```typescript
await onSave(selectedExchangeId, apiKey.trim(), secretKey.trim(), testnet);
```

## 6. 总结

该 Bug 是由于参数传递不完整导致的简单逻辑错误，修复后可以确保 OKX 交易所的 Passphrase 字段能够正确保存和使用。

**修复状态**: 已完成
**修复人**: 系统维护者
**修复日期**: 2025-11-19

---

## 附录: 相关代码文件

### 1. ExchangeConfigModal 组件定义
```typescript
function ExchangeConfigModal({
  allExchanges,
  editingExchangeId,
  onSave,
  onDelete,
  onClose,
  language
}: {
  allExchanges: Exchange[];
  editingExchangeId: string | null;
  onSave: (exchangeId: string, apiKey: string, secretKey?: string, testnet?: boolean, hyperliquidWalletAddr?: string, asterUser?: string, asterSigner?: string, asterPrivateKey?: string, okxPassphrase?: string) => Promise<void>;
  onDelete: (exchangeId: string) => void;
  onClose: () => void;
  language: Language;
}) {
  // 组件实现...
}
```

### 2. handleSaveExchangeConfig 函数
```typescript
const handleSaveExchangeConfig = async (exchangeId: string, apiKey: string, secretKey?: string, testnet?: boolean, hyperliquidWalletAddr?: string, asterUser?: string, asterSigner?: string, asterPrivateKey?: string, okxPassphrase?: string) => {
  // 函数实现...
};
```
