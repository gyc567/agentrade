# Vercel Deploy Skills - Vercel 部署技能手册

## 📚 目录

- [概述](#概述)
- [前置要求](#前置要求)
- [部署流程](#部署流程)
- [配置文件](#配置文件)
- [环境变量](#环境变量)
- [部署命令](#部署命令)
- [部署后验证](#部署后验证)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)
- [Vercel CLI 命令参考](#vercel-cli-命令参考)
- [自动化部署](#自动化部署)

---

## 概述

本技能手册描述了将 `nofx-web` 前端项目部署到 Vercel 云服务器的完整流程。

**项目类型**: React + Vite 前端应用
**部署平台**: Vercel
**部署方式**: Vercel CLI
**当前项目路径**: `/Users/guoyingcheng/dreame/code/nofx/web`

---

## 前置要求

### 1. 系统要求

- Node.js >= 16.0.0
- npm 或 yarn 包管理器
- Git 版本控制

### 2. 必需软件

#### Vercel CLI (全局安装)
```bash
npm install -g vercel
```

**验证安装**:
```bash
vercel --version
```

**当前版本**: v48.10.3

### 3. 账户要求

- Vercel 账户 (可免费注册)
- GitHub/GitLab/Bitbucket 账户（可选，用于 Git 集成）

### 4. 访问权限

- Vercel 项目的管理权限
- 部署目标项目的读写权限

---

## 部署流程

### 步骤 1: 项目准备

#### 1.1 检查项目结构
```bash
# 确保在项目根目录
cd /Users/guoyingcheng/dreame/code/nofx/web

# 检查关键文件
ls -la package.json
ls -la vercel.json
ls -la .env.local
```

#### 1.2 验证依赖
```bash
# 安装依赖
npm install

# 或使用 yarn
yarn install
```

#### 1.3 本地构建测试
```bash
# 本地构建
npm run build

# 预览构建结果（可选）
npm run preview
```

**预期输出**:
```
✓ 2744 modules transformed.
✓ built in 1m 9s

dist/
├── index.html
└── assets/
    ├── index-D1-Tezt9.css
    ├── index-8zLFkdPg.js
    └── ...
```

### 步骤 2: 登录 Vercel

#### 2.1 交互式登录
```bash
vercel login
```

**支持的方式**:
- GitHub
- GitLab
- Bitbucket
- Email

**示例输出**:
```
> log in to Vercel
? Continue with GitHub (recommended) › (Y/n)
```

选择对应方式完成登录。

#### 2.2 验证登录状态
```bash
vercel whoami
```

**期望输出**:
```
your-username
```

### 步骤 3: 部署项目

#### 3.1 首次部署（交互式）
```bash
# 在项目根目录执行
vercel

# 或指定项目名称
vercel --prod --confirm
```

**交互式配置**:
```
? Set up and deploy "~/your-project-path"? [Y/n] y
? Which scope do you want to deploy to? Your Personal Account
? Link to existing project? [y/N] n
? What's your project's name? nofx-web
? In which directory is your code located? ./
? Want to override the settings? [y/N] n
```

#### 3.2 生产环境部署（推荐）
```bash
# 直接部署到生产环境
vercel --prod
```

**示例输出**:
```
✅  Production: https://your-app.vercel.app [1m 23s]
📝  Deployed to production. Run `vercel --prod` to overwrite later.
💡  To change the domain, go to https://vercel.com/your-username/nofx-web/settings/domains

🔗  Deployed to production. To change the domain, go to:
   https://vercel.com/your-username/nofx-web/settings/domains

📦  Deployed to production. Run `vercel logs` to view the logs.
```

### 步骤 4: 部署后验证

#### 4.1 检查部署状态
```bash
vercel ls
```

**示例输出**:
```
Deployments for your-username/nofx-web:

  58m  https://your-app.vercel.app    ● Ready     Production      23s    gyc567
  2h   https://xxx.vercel.app        ● Error     Production      25s    gyc567
  1d   https://yyy.vercel.app        ● Ready     Preview         20s    gyc567
```

#### 4.2 访问部署地址
```bash
# 检查网站可访问性
curl -I https://your-app.vercel.app

# 预期结果
HTTP/2 200 OK
```

#### 4.3 查看部署详情
```bash
vercel inspect https://your-app.vercel.app
```

---

## 配置文件

### vercel.json

**位置**: 项目根目录

**内容示例**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**关键配置项**:

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `buildCommand` | 构建命令 | `"npm run build"` |
| `outputDirectory` | 构建输出目录 | `"dist"` |
| `installCommand` | 依赖安装命令 | `"npm install"` |
| `framework` | 框架标识 | `"vite"` |
| `rewrites` | URL 重写规则 | SPA 路由支持 |

### SPA 路由支持

**问题**: React Router 等 SPA 框架需要所有路由重定向到 `index.html`

**解决方案**:
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

**解释**:
- 匹配所有非 `api/` 路径
- 重定向到 `index.html`
- 允许 React Router 处理客户端路由

---

## 环境变量

### 1. 本地环境变量

#### .env.local
**位置**: 项目根目录

**内容示例**:
```bash
# API 后端地址
VITE_API_URL=https://nofx-gyc567.replit.app

# 应用配置
VITE_APP_TITLE=Monnaire Trading Agent OS
VITE_APP_VERSION=1.0.0

# 开发环境
NODE_ENV=development
```

**注意**:
- `.env.local` 文件不会被提交到 Git
- 适用于本地开发

### 2. Vercel 环境变量

#### 通过 CLI 设置
```bash
# 设置环境变量
vercel env add VITE_API_URL production

# 按提示输入值
? What's the value of VITE_API_URL? https://nofx-gyc567.replit.app
✅  Added to production Environment Variables

# 列出环境变量
vercel env ls

# 删除环境变量
vercel env rm VITE_API_URL
```

#### 通过 Web Dashboard 设置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目
3. 进入 `Settings` → `Environment Variables`
4. 添加变量:
   - `Name`: `VITE_API_URL`
   - `Value`: `https://nofx-gyc567.replit.app`
   - `Environment`: Production, Preview, Development

### 3. 环境变量配置逻辑

```typescript
// src/lib/apiConfig.ts
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return '/api';  // 开发环境
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'https://nofx-gyc567.replit.app';
  return `${apiUrl}/api`;
}
```

---

## 部署命令

### 基础命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `vercel` | 部署到预览环境 | `vercel` |
| `vercel --prod` | 部署到生产环境 | `vercel --prod` |
| `vercel --prod --confirm` | 自动确认部署 | `vercel --prod --confirm` |
| `vercel --token <token>` | 使用 Token 部署 | `vercel --prod --token xxx` |

### 常用选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `--prod` | 生产环境 | `vercel --prod` |
| `--confirm` | 自动确认 | `vercel --prod --confirm` |
| `--token` | 指定 Token | `vercel --token $VERCEL_TOKEN` |
| `--scope` | 指定 Scope | `vercel --scope company-name` |
| `--yes` | 跳过所有确认 | `vercel --yes` |

### 完整部署示例

```bash
# 进入项目目录
cd /Users/guoyingcheng/dreame/code/nofx/web

# 安装依赖
npm install

# 本地构建测试
npm run build

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod --confirm

# 检查部署状态
vercel ls
```

---

## 部署后验证

### 1. 手动验证

#### 1.1 访问网站
打开浏览器，访问部署的 URL：
```
https://your-app.vercel.app
```

**预期结果**: 网站正常加载，无 404/500 错误

#### 1.2 检查控制台
打开浏览器开发者工具 (F12)，检查:
- Console 标签：无红色错误
- Network 标签：API 请求正常
- Application 标签：LocalStorage/缓存正常

#### 1.3 测试关键功能
- 页面导航
- 用户登录/注册
- API 数据加载
- 路由跳转

### 2. 命令行验证

#### 2.1 HTTP 状态检查
```bash
curl -I https://your-app.vercel.app

# 预期输出
HTTP/2 200 OK
```

#### 2.2 API 端点检查
```bash
# 检查 API 可用性
curl https://nofx-gyc567.replit.app/api/supported-exchanges

# 预期输出：JSON 格式的交易所列表
```

#### 2.3 构建产物检查
```bash
# 检查 CSS/JS 文件
curl -I https://your-app.vercel.app/assets/index-xxx.css
curl -I https://your-app.vercel.app/assets/index-xxx.js
```

### 3. 自动化验证脚本

**示例脚本** (`deploy-verify.sh`):
```bash
#!/bin/bash
set -e

echo "🚀 开始验证部署..."

# 检查网站可访问性
status_code=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app)
if [ "$status_code" -eq 200 ]; then
  echo "✅ 网站可访问"
else
  echo "❌ 网站不可访问 (HTTP $status_code)"
  exit 1
fi

# 检查 API 可用性
api_status=$(curl -s -o /dev/null -w "%{http_code}" https://nofx-gyc567.replit.app/api/supported-exchanges)
if [ "$api_status" -eq 200 ]; then
  echo "✅ API 可用"
else
  echo "❌ API 不可用 (HTTP $api_status)"
  exit 1
fi

echo "🎉 部署验证通过!"
```

**使用方法**:
```bash
chmod +x deploy-verify.sh
./deploy-verify.sh
```

---

## 常见问题

### Q1: 构建失败 - "Command not found"

**现象**:
```
Error: Command "npm run build" not found
```

**原因**:
- `package.json` 中缺少 `build` 脚本
- 依赖未安装

**解决方案**:
```bash
# 检查 package.json
cat package.json | grep -A 5 '"scripts"'

# 安装依赖
npm install

# 重新构建
npm run build
```

### Q2: 部署成功但页面空白

**现象**:
- 部署成功，无 404/500 错误
- 页面空白，Console 有错误

**原因**:
- SPA 路由未配置
- 资源路径错误
- 环境变量未设置

**解决方案**:
1. 检查 `vercel.json` 配置
2. 确认环境变量设置
3. 查看构建日志:
   ```bash
   vercel logs https://your-app.vercel.app
   ```

### Q3: API 请求失败

**现象**:
- 页面加载正常
- 数据不显示
- Console 显示 API 错误

**原因**:
- 环境变量 `VITE_API_URL` 未设置
- 后端 API 不可用
- CORS 配置错误

**解决方案**:
```bash
# 检查环境变量
vercel env ls

# 重新设置环境变量
vercel env add VITE_API_URL production

# 测试 API 可用性
curl https://nofx-gyc567.replit.app/api/supported-exchanges
```

### Q4: 旧版本缓存

**现象**:
- 部署新版本后，页面显示旧内容
- 强制刷新后才显示新版本

**原因**:
- 浏览器缓存
- CDN 缓存

**解决方案**:
1. **用户端**:
   - 硬性刷新: `Ctrl+Shift+R`
   - 清空缓存
   - 无痕模式测试

2. **开发者端**:
   ```bash
   # 重新部署覆盖
   vercel --prod --confirm

   # 或等待 CDN 刷新 (5-10 分钟)
   ```

### Q5: 域名未配置

**现象**:
- 部署成功，但无法访问
- 返回 "Domain Not Found"

**原因**:
- 域名未绑定
- DNS 配置错误

**解决方案**:
1. 在 Vercel Dashboard 添加域名
2. 配置 DNS 记录:
   ```
   类型: CNAME
   名称: www
   值: cname.vercel-dns.com
   ```
3. 或使用 Vercel 默认域名

### Q6: 部署时间过长

**现象**:
- 部署超过 5 分钟
- 频繁超时

**原因**:
- 依赖过多
- 构建资源大
- 网络问题

**解决方案**:
1. **优化构建**:
   ```json
   // package.json
   {
     "scripts": {
       "build": "vite build --minify"
     }
   }
   ```

2. **代码分割**:
   ```typescript
   // 动态导入
   const Component = lazy(() => import('./Component'));
   ```

3. **使用 `vercel --prod --confirm` 跳过交互**

---

## 最佳实践

### 1. 部署前检查清单

- [ ] **代码审查**: 确保无 console.log、debugger 等调试代码
- [ ] **依赖更新**: 检查 `package.json` 是否有安全漏洞
- [ ] **环境变量**: 确认所有必需的环境变量已设置
- [ ] **本地测试**: 本地构建和预览通过
- [ ] **API 健康检查**: 后端 API 可用性验证

### 2. 部署策略

#### 开发环境
```bash
# 频繁部署，快速迭代
vercel
```

#### 生产环境
```bash
# 稳定版本，减少频繁部署
vercel --prod --confirm
```

### 3. 版本管理

#### 标签化部署
```bash
# 标记特定版本
vercel tag v1.0.0

# 查看标签
vercel ls
```

#### 回滚策略
```bash
# 回滚到上一个版本
vercel rollback https://your-app.vercel.app

# 回滚到指定部署
vercel rollback https://your-app.vercel.app --target dpl_xxx
```

### 4. 监控与日志

#### 查看日志
```bash
# 实时日志
vercel logs https://your-app.vercel.app

# 历史日志
vercel logs --no-follow https://your-app.vercel.app
```

#### 性能监控
- 使用 [Vercel Analytics](https://vercel.com/analytics)
- 配置 Web Vitals 监控
- 设置错误追踪 (Sentry, LogRocket)

### 5. 安全配置

#### 环境变量安全
- **敏感信息**: 绝不在代码中硬编码
- **定期轮换**: 定期更新 API Key
- **最小权限**: 仅授予必需的环境变量

#### HTTPS 强制
Vercel 默认启用 HTTPS，无需额外配置。

#### CSP 配置
在 `vercel.json` 中配置 Content Security Policy:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'"
        }
      ]
    }
  ]
}
```

---

## Vercel CLI 命令参考

### 部署命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `vercel` | 部署到预览环境 | `vercel` |
| `vercel --prod` | 部署到生产环境 | `vercel --prod` |
| `vercel --prod --confirm` | 自动部署到生产 | `vercel --prod --confirm` |
| `vercel --token <token>` | 使用 Token 部署 | `vercel --prod --token $VERCEL_TOKEN` |

### 管理命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `vercel login` | 登录 Vercel | `vercel login` |
| `vercel whoami` | 显示当前用户 | `vercel whoami` |
| `vercel logout` | 退出登录 | `vercel logout` |

### 项目管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `vercel ls` | 列出所有部署 | `vercel ls` |
| `vercel inspect <url>` | 查看部署详情 | `vercel inspect https://app.vercel.app` |
| `vercel logs <url>` | 查看日志 | `vercel logs https://app.vercel.app` |
| `vercel rm <url>` | 删除部署 | `vercel rm https://app.vercel.app` |

### 环境变量管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `vercel env add <name> <env>` | 添加环境变量 | `vercel env add VITE_API_URL production` |
| `vercel env ls` | 列出环境变量 | `vercel env ls` |
| `vercel env rm <name>` | 删除环境变量 | `vercel env rm VITE_API_URL` |

### 域名管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `vercel domains` | 管理域名 | `vercel domains` |
| `vercel alias <url> <domain>` | 绑定域名 | `vercel alias https://app.vercel.app mydomain.com` |

### 其他命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `vercel --version` | 显示版本 | `vercel --version` |
| `vercel help` | 显示帮助 | `vercel help` |
| `vercel init` | 初始化项目 | `vercel init` |

---

## 自动化部署

### 1. Git 集成部署

#### 推送自动部署
1. 将代码推送到 Git 仓库
2. Vercel 自动检测并部署

**示例**:
```bash
git add .
git commit -m "Update"
git push origin main
```

#### 手动触发部署
```bash
# 推送触发部署
git push origin main
```

### 2. CI/CD 流水线

#### GitHub Actions 示例
**`.github/workflows/deploy.yml`**:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**配置步骤**:
1. 在 GitHub 仓库设置中添加 `VERCEL_TOKEN` 秘钥
2. 推送代码到 `main` 分支
3. 自动触发部署

### 3. 脚本自动化

#### 完整部署脚本
**`scripts/deploy.sh`**:
```bash
#!/bin/bash

# 配置
PROJECT_NAME="nofx-web"
VERCEL_TOKEN="your-token-here"  # 或从环境变量读取

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 开始部署 $PROJECT_NAME...${NC}"

# 1. 检查依赖
echo -e "${YELLOW}📦 检查依赖...${NC}"
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json 不存在${NC}"
  exit 1
fi

# 2. 安装依赖
echo -e "${YELLOW}📥 安装依赖...${NC}"
npm install

# 3. 本地构建
echo -e "${YELLOW}🔨 本地构建...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ 构建失败${NC}"
  exit 1
fi

# 4. 部署到生产环境
echo -e "${YELLOW}🚀 部署到生产环境...${NC}"
vercel --prod --yes --token $VERCEL_TOKEN

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ 部署成功!${NC}"
else
  echo -e "${RED}❌ 部署失败${NC}"
  exit 1
fi

echo -e "${GREEN}🎉 部署完成!${NC}"
```

**使用方法**:
```bash
# 给脚本执行权限
chmod +x scripts/deploy.sh

# 执行部署
./scripts/deploy.sh
```

---

## 总结

本技能手册涵盖了 Vercel 部署的完整流程，从基础配置到高级自动化，包括:

- ✅ **部署流程**: 从准备到验证的完整步骤
- ✅ **配置管理**: vercel.json 和环境变量
- ✅ **CLI 命令**: 常用命令和选项
- ✅ **问题排查**: 常见问题和解决方案
- ✅ **最佳实践**: 安全、性能、监控建议
- ✅ **自动化**: CI/CD 和脚本部署

**关键要点**:
1. 部署前本地构建测试
2. 使用 `--prod` 部署到生产环境
3. 配置环境变量，特别是 API URL
4. 监控部署状态和日志
5. 使用自动化脚本提高效率

**项目当前状态**:
- ✅ Vercel CLI 已安装 (v48.10.3)
- ✅ 配置文件已设置 (vercel.json)
- ✅ 环境变量已配置 (.env.local)
- ✅ 构建通过 (2744 模块)
- ✅ 部署就绪

---

**文档版本**: v1.0.0
**最后更新**: 2025-11-18
**适用项目**: nofx-web (React + Vite)
**部署平台**: Vercel
