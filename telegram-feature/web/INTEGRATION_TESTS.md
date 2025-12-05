# Web3钱包按钮集成测试文档

## 测试概述

本文档描述了Web3钱包按钮组件的集成测试方案，验证与现有系统的完整集成。

## 测试环境配置

### 前置条件

1. **浏览器环境**
   - Chrome 90+ (推荐)
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. **测试钱包**
   - MetaMask扩展已安装
   - TP钱包扩展已安装（可选）

3. **开发环境**
   ```bash
   cd /path/to/project
   npm install
   npm run dev
   ```

## 测试用例

### TC-001: 组件渲染测试

**测试目标**: 验证Web3ConnectButton组件正确渲染

**测试步骤**:
1. 打开开发者工具
2. 访问首页 (/)
3. 检查DOM结构

**预期结果**:
- ✅ 按钮存在于DOM中
- ✅ 按钮文字显示为"连接Web3钱包"
- ✅ 按钮在登录按钮左侧
- ✅ 移动端菜单中按钮存在
- ✅ 桌面端和移动端按钮样式正确

**验证代码**:
```javascript
// 检查按钮存在
const button = document.querySelector('[aria-label="连接Web3钱包"]');
console.assert(button !== null, '按钮应该存在');

// 检查按钮位置
const loginButton = document.querySelector('a[href="/login"]');
console.assert(button?.previousElementSibling === loginButton, '按钮应该在登录按钮左侧');
```

---

### TC-002: 钱包选择功能测试

**测试目标**: 验证钱包选择弹窗正确显示和交互

**测试步骤**:
1. 点击"连接Web3钱包"按钮
2. 验证弹窗显示
3. 选择钱包类型
4. 观察连接过程

**预期结果**:
- ✅ 弹窗正确显示
- ✅ 标题为"选择您的钱包类型"
- ✅ MetaMask选项可见
- ✅ TP钱包选项可见
- ✅ 已安装状态显示正确
- ✅ 未安装显示安装提示

**验证代码**:
```javascript
// 点击按钮
document.querySelector('[aria-label="连接Web3钱包"]').click();

// 检查弹窗
setTimeout(() => {
  const modal = document.querySelector('[role="dialog"]');
  console.assert(modal !== null, '弹窗应该显示');

  const title = modal.querySelector('h2');
  console.assert(title.textContent === '选择您的钱包类型', '标题应该正确');
}, 100);
```

---

### TC-003: MetaMask连接测试

**测试目标**: 验证MetaMask钱包连接流程

**前置条件**: MetaMask已安装且未连接

**测试步骤**:
1. 点击"连接Web3钱包"按钮
2. 选择MetaMask
3. 在MetaMask弹窗中确认连接
4. 验证连接状态

**预期结果**:
- ✅ 显示"连接中..."状态
- ✅ MetaMask弹窗打开
- ✅ 用户确认后显示地址
- ✅ 按钮显示"已连接: 0x1234...7890"
- ✅ 提供断开连接选项

**验证代码**:
```javascript
// 检查连接状态
const { address, isConnected } = useWeb3();
console.assert(isConnected === true, '应该已连接');
console.assert(address.startsWith('0x'), '地址应该是以太坊格式');

// 检查按钮状态
const button = document.querySelector('button');
console.assert(button.textContent.includes('已连接'), '按钮应该显示已连接状态');
```

---

### TC-004: TP钱包连接测试

**测试目标**: 验证TP钱包连接流程

**前置条件**: TP钱包已安装且未连接

**测试步骤**:
1. 点击"连接Web3钱包"按钮
2. 选择TP钱包
3. 在TP钱包中确认连接
4. 验证连接状态

**预期结果**:
- ✅ 显示"连接中..."状态
- ✅ TP钱包弹窗打开
- ✅ 用户确认后显示地址
- ✅ 按钮显示"已连接: 0x1234...7890"
- ✅ 显示TP钱包标识

---

### TC-005: 错误处理测试

**测试目标**: 验证各种错误情况的处理

#### TC-005-1: 用户拒绝连接

**测试步骤**:
1. 点击"连接Web3钱包"按钮
2. 选择钱包
3. 拒绝MetaMask连接请求
4. 观察错误提示

**预期结果**:
- ✅ 显示错误提示"用户取消了操作"
- ✅ 按钮恢复未连接状态
- ✅ 提供重试选项

#### TC-005-2: 钱包未安装

**测试步骤**:
1. 卸载MetaMask扩展
2. 访问页面
3. 点击"连接Web3钱包"
4. 尝试选择MetaMask

**预期结果**:
- ✅ MetaMask显示"未安装"状态
- ✅ 显示安装链接
- ✅ 点击安装链接打开官网
- ✅ 禁用选择功能

---

### TC-006: 状态持久化测试

**测试目标**: 验证连接状态在页面刷新后保持

**测试步骤**:
1. 连接MetaMask钱包
2. 刷新页面
3. 观察连接状态

**预期结果**:
- ⚠️ 注意: 由于浏览器安全策略，刷新后连接状态会丢失
- ✅ 这是预期行为，需要重新连接

---

### TC-007: 响应式设计测试

**测试目标**: 验证移动端适配

**测试步骤**:
1. 调整浏览器窗口到移动端尺寸 (<768px)
2. 点击汉堡菜单
3. 查看移动端菜单

**预期结果**:
- ✅ 按钮显示在移动端菜单中
- ✅ 按钮文字可读
- ✅ 弹窗占满全屏宽度
- ✅ 触摸友好

**验证代码**:
```javascript
// 模拟移动端尺寸
Object.defineProperty(window, 'innerWidth', { value: 375 });

// 检查移动端菜单
const mobileMenu = document.querySelector('[data-testid="mobile-menu"]');
console.assert(mobileMenu !== null, '移动端菜单应该存在');

// 检查按钮在菜单中
const web3ButtonInMenu = mobileMenu.querySelector('[aria-label="连接Web3钱包"]');
console.assert(web3ButtonInMenu !== null, '按钮应该在移动端菜单中');
```

---

### TC-008: 无障碍访问测试

**测试目标**: 验证无障碍功能

**测试步骤**:
1. 使用Tab键导航
2. 使用Enter键选择
3. 使用Esc键关闭
4. 使用屏幕阅读器

**预期结果**:
- ✅ Tab键可以聚焦到按钮
- ✅ Enter键可以打开弹窗
- ✅ Enter键可以选中钱包
- ✅ Esc键可以关闭弹窗
- ✅ ARIA标签正确设置
- ✅ 屏幕阅读器可以朗读内容

**验证代码**:
```javascript
// 检查ARIA标签
const button = document.querySelector('[aria-label="连接Web3钱包"]');
console.assert(button.getAttribute('aria-label') !== null, '应该设置aria-label');
console.assert(button.getAttribute('aria-expanded') !== null, '应该设置aria-expanded');

// 检查焦点管理
button.focus();
console.assert(document.activeElement === button, '按钮应该获得焦点');
```

---

### TC-009: 多语言测试

**测试目标**: 验证国际化支持

**测试步骤**:
1. 切换语言到中文
2. 检查按钮文字
3. 切换语言到英文
4. 检查按钮文字

**预期结果**:
- ✅ 中文: "连接Web3钱包"
- ✅ 英文: "Connect Web3 Wallet"
- ✅ 弹窗标题正确翻译
- ✅ 所有UI文字正确翻译

**验证代码**:
```javascript
// 切换语言
const { language, setLanguage } = useLanguage();
setLanguage('zh');

// 检查中文
const button = document.querySelector('button');
console.assert(button.textContent === '连接Web3钱包', '应该显示中文');

// 切换到英文
setLanguage('en');
console.assert(button.textContent === 'Connect Web3 Wallet', '应该显示英文');
```

---

### TC-010: 性能测试

**测试目标**: 验证组件性能

**测试步骤**:
1. 使用Performance API测量
2. 检查渲染时间
3. 检查内存使用

**预期结果**:
- ✅ 初始渲染 < 50ms
- ✅ 弹窗打开 < 200ms
- ✅ 内存泄漏 < 5MB

**验证代码**:
```javascript
// 测量渲染性能
const startTime = performance.now();
render(<Web3ConnectButton />);
const endTime = performance.now();
const renderTime = endTime - startTime;
console.assert(renderTime < 50, `渲染时间应该 < 50ms，实际: ${renderTime}ms`);

// 测量连接性能
const connectStart = performance.now();
await connect('metamask');
const connectEnd = performance.now();
const connectTime = connectEnd - connectStart;
console.assert(connectTime < 3000, `连接时间应该 < 3s，实际: ${connectTime}ms`);
```

---

## 自动化测试脚本

### Playwright测试脚本

```typescript
// tests/web3-wallet.e2e.ts
import { test, expect } from '@playwright/test';

test.describe('Web3钱包按钮', () => {
  test('应该正确显示按钮', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('[aria-label="连接Web3钱包"]');
    await expect(button).toBeVisible();
  });

  test('应该可以点击按钮', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="连接Web3钱包"]');
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('应该显示钱包选择器', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="连接Web3钱包"]');
    await expect(page.locator('text=选择您的钱包类型')).toBeVisible();
  });
});
```

---

## 测试报告模板

### 测试结果记录

| 测试用例 | 状态 | 耗时 | 备注 |
|----------|------|------|------|
| TC-001 | ✅ 通过 | 5s | - |
| TC-002 | ✅ 通过 | 10s | - |
| TC-003 | ✅ 通过 | 15s | 需要MetaMask |
| TC-004 | ✅ 通过 | 15s | 需要TP钱包 |
| TC-005 | ✅ 通过 | 20s | - |
| TC-006 | ⚠️ 预期行为 | 5s | - |
| TC-007 | ✅ 通过 | 10s | - |
| TC-008 | ✅ 通过 | 15s | 需要辅助工具 |
| TC-009 | ✅ 通过 | 10s | - |
| TC-010 | ✅ 通过 | 30s | - |

### 缺陷记录

| 缺陷ID | 严重性 | 描述 | 复现步骤 | 状态 |
|--------|--------|------|----------|------|
| DEF-001 | 低 | 某些文字未翻译 | 切换到英文 | 待修复 |

---

## 运行测试

### 手动测试

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **在浏览器中打开**
   ```
   http://localhost:5000
   ```

3. **执行测试用例**
   - 按照测试文档逐步执行
   - 记录结果

### 自动化测试

1. **安装Playwright**
   ```bash
   npm install --save-dev @playwright/test
   npx playwright install
   ```

2. **运行测试**
   ```bash
   npx playwright test
   ```

3. **查看报告**
   ```bash
   npx playwright show-report
   ```

---

## 测试验收标准

### 必须通过的测试

- [ ] TC-001: 组件渲染测试
- [ ] TC-002: 钱包选择功能测试
- [ ] TC-003: MetaMask连接测试
- [ ] TC-005: 错误处理测试
- [ ] TC-007: 响应式设计测试
- [ ] TC-008: 无障碍访问测试

### 建议通过的测试

- [ ] TC-004: TP钱包连接测试
- [ ] TC-009: 多语言测试
- [ ] TC-010: 性能测试

---

## 注意事项

1. **安全考虑**: 永远不要在生产环境测试中暴露真实的私钥
2. **钱包隔离**: 为测试创建独立的测试钱包
3. **浏览器兼容**: 在多个浏览器中测试
4. **网络环境**: 测试不同网络条件下的表现

---

**文档版本**: 1.0
**最后更新**: 2025-12-01
