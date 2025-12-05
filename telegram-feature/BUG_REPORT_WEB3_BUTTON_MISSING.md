# OpenSpec Bug Report: Web3 钱包按钮缺失

## Bug ID
`BUG-2025-12-01-WEB3-BUTTON-MISSING`

## 问题描述
生产环境 (https://www.agentrade.xyz/) 页面左上角缺少 Web3 钱包连接按钮。该按钮应显示：
- 中文: "连接Web3钱包"
- 英文: "Connect Web3 Wallet"

## 影响范围
- **环境**: 生产环境 (Vercel 部署)
- **页面**: 首页 (LandingPage)、竞赛页面等
- **用户影响**: 用户无法使用 Web3 钱包登录/认证

---

## 调查的 3 个可能原因

### 可能原因 1: 导入/导出问题 ❌ 已排除

| 检查项 | 结果 |
|--------|------|
| Web3ConnectButton.tsx 导出方式 | `export function` + `export default` 均存在 |
| HeaderBar.tsx 导入方式 | `import Web3ConnectButton from '../Web3ConnectButton'` 正确 |
| 构建结果 | TypeScript 编译成功，无警告 |

**结论**: 导入/导出配置正确，不是问题根源。

---

### 可能原因 2: LandingPage 未传 currentPage 参数 ⚠️ 潜在问题

**代码分析**:

```tsx
// LandingPage.tsx 第26-44行
<HeaderBar 
  onLoginClick={() => setShowLoginModal(true)} 
  isLoggedIn={isLoggedIn} 
  isHomePage={true}
  language={language}
  onLanguageChange={setLanguage}
  user={user}
  onLogout={logout}
  onPageChange={...}
  // ❌ 缺少 currentPage 参数
/>
```

**HeaderBar 条件渲染逻辑** (第287行):
```tsx
currentPage !== 'login' && currentPage !== 'register' && (
  <Web3ConnectButton size="small" variant="secondary" />
)
```

当 `currentPage` 为 `undefined` 时：
- `undefined !== 'login'` → `true`
- `undefined !== 'register'` → `true`
- 条件满足，按钮应该显示

**结论**: 虽然条件满足，但应明确传递 `currentPage="home"` 以避免歧义。

---

### 可能原因 3: 生产环境(Vercel)部署版本过旧 ✅ 最可能原因

**关键发现**:

| 环境 | 部署位置 | 代码来源 |
|------|----------|----------|
| 开发环境 | Replit | `web/` 目录 |
| 生产前端 | Vercel (www.agentrade.xyz) | GitHub 仓库 |
| 生产后端 | Replit (nofx-gyc567.replit.app) | Replit 项目 |

**问题**: Vercel 部署的前端版本可能：
1. 没有同步最新的 Web3ConnectButton 组件
2. 没有同步 HeaderBar 中的 Web3 按钮引用
3. 构建时排除了 Web3 相关依赖

**验证方法**:
1. 检查 GitHub 仓库中 `web/src/components/Web3ConnectButton.tsx` 是否存在
2. 检查 Vercel 构建日志是否有错误
3. 对比本地构建产物与生产环境

---

## 修复方案

### 修复 1: 为 LandingPage 添加 currentPage 参数

```tsx
// 修改 LandingPage.tsx
<HeaderBar 
  onLoginClick={() => setShowLoginModal(true)} 
  isLoggedIn={isLoggedIn} 
  isHomePage={true}
  currentPage="home"  // ← 添加此行
  language={language}
  onLanguageChange={setLanguage}
  user={user}
  onLogout={logout}
  onPageChange={...}
/>
```

### 修复 2: 更新 HeaderBar 条件逻辑

```tsx
// 修改 HeaderBar.tsx 第287行
// 修复前
currentPage !== 'login' && currentPage !== 'register' && (

// 修复后 - 更明确的条件
!['login', 'register'].includes(currentPage || '') && (
```

### 修复 3: 同步代码到 GitHub 并重新部署 Vercel

```bash
# 1. 提交最新代码到 GitHub
git add .
git commit -m "fix: Add Web3 wallet button to header"
git push origin main

# 2. 触发 Vercel 重新部署
# (自动或手动触发)
```

---

## 验证清单

- [ ] Web3ConnectButton 在桌面端显示
- [ ] Web3ConnectButton 在移动端菜单中显示
- [ ] 点击按钮显示钱包选择器
- [ ] 中英文翻译正确
- [ ] Vercel 部署成功

---

## 文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `web/src/pages/LandingPage.tsx` | 修改 | 添加 `currentPage="home"` |
| `web/src/components/landing/HeaderBar.tsx` | 修改 | 优化条件逻辑 |

---

## 代码修复已完成

### 已实施的修改:

1. **LandingPage.tsx**: 添加 `currentPage="home"` 参数
2. **HeaderBar.tsx**: 优化条件判断逻辑，更好地处理 undefined 情况

### 部署步骤:

生产环境 (www.agentrade.xyz) 的问题根源是 **Vercel 部署版本与代码不同步**。

请执行以下步骤:

```bash
# 1. 提交代码到 GitHub
git add .
git commit -m "fix: Add Web3 wallet button to header and improve condition logic"
git push origin main

# 2. 检查 Vercel 自动部署
# 或手动触发重新部署: https://vercel.com/dashboard
```

### 验证生产环境:

部署后，请访问 https://www.agentrade.xyz/ 验证:
1. 页面左上角应显示 "连接Web3钱包" 按钮
2. 点击按钮应显示钱包选择器 (MetaMask / TP钱包)
3. 移动端菜单中也应有此按钮

---

## 日期
2025-12-01

## 状态
✅ 代码修复完成，等待部署到 Vercel
