# 🚀 NOFX项目Vercel部署完整指南

> **面向新手小白的零基础部署教程** 📚
>
> 作者：Claude Code助手
>
> 适用版本：NOFX v1.0+

---

## 📋 部署方案总览

由于NOFX是**Go后端 + React前端**的架构，我们需要采用**前后端分离部署**：

| 组件 | 部署平台 | 原因 |
|------|----------|------|
| 🎨 **前端React** | **Vercel** | 原生支持Vite构建，全球CDN，自动扩容 |
| ⚙️ **后端Go API** | **Railway/Render** | Go后端需要独立环境 |
| 🗃️ **配置文件** | **Git仓库** | 版本控制和自动同步 |

---

## 🎯 方案一：前端Vercel + 后端Railway（推荐）

### 优势
- ✅ Railway支持Go应用，部署简单
- ✅ 每月有免费额度
- ✅ 自动HTTPS
- ✅ 支持自定义域名
- ✅ 可连接GitHub自动部署

---

## 📦 第一部分：后端部署到Railway

### 步骤1：注册Railway账户

1. 打开 [https://railway.app](https://railway.app)
2. 点击 **"Login"** → 选择 **"Login with GitHub"**
3. 使用GitHub账户登录（没有GitHub？先去注册一个！）

### 步骤2：创建新项目

1. 登录后，点击 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 选择你的NOFX项目仓库
4. Railway会自动检测到这是一个Go项目！

### 步骤3：配置环境变量

在Railway项目页面，点击 **"Variables"** 标签，添加以下环境变量：

```bash
# Go应用配置
NOFX_BACKEND_PORT=8080
NOFX_TIMEZONE=Asia/Shanghai

# 交易配置（根据需要修改）
API_SERVER_PORT=8080
MAX_DAILY_LOSS=10.0
MAX_DRAWDOWN=20.0

# 交易API密钥（⚠️ 重要：改成你的真实密钥）
HYPERLIQUID_PRIVATE_KEY=your_private_key_here
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key
DEEPSEEK_KEY=your_deepseek_key
```

**如何获取API密钥？**
- **DeepSeek**: 访问 [https://platform.deepseek.com](https://platform.deepseek.com) 注册获取
- **Binance**: 登录Binance → API管理 → 创建新密钥
- **Hyperliquid**: 根据官方文档生成私钥

### 步骤4：上传配置文件

1. 在项目根目录创建 `config.json` 文件（如果不存在）
2. 在Railway中，点击 **"Settings"** → **"Variables"**
3. 添加一个变量：`CONFIG_FILE`，值为 `{"traders":[...],"leverage":{...}}`
4. 或者直接在项目根目录提交 `config.json` 文件

### 步骤5：配置build命令

Railway会自动检测Go项目，但如果你需要自定义，在项目根目录创建 `railway.toml`：

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "./nofx"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 步骤6：部署

1. Railway会自动开始构建（需要3-5分钟）
2. 构建完成后，点击 **"Domains"** 标签
3. 你会看到一个类似 `https://your-app-name.railway.app` 的URL
4. 记录这个URL，这就是你的**后端API地址**！

---

## 🎨 第二部分：前端部署到Vercel

### 步骤1：注册Vercel账户

1. 打开 [https://vercel.com](https://vercel.com)
2. 点击 **"Sign Up"** → 选择 **"Continue with GitHub"**
3. 使用GitHub账户登录

### 步骤2：导入GitHub项目

1. 登录后，点击 **"New Project"**
2. 选择你的NOFX项目
3. Vercel会自动检测这是一个Vite + React项目

### 步骤3：配置构建设置

在项目配置页面，设置如下：

| 配置项 | 值 |
|--------|-----|
| **Framework Preset** | Vite |
| **Root Directory** | `web` （因为前端代码在web文件夹） |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 步骤4：配置环境变量

点击 **"Environment Variables"**，添加以下变量：

```bash
# API后端地址（⚠️ 改成你的Railway后端地址）
VITE_API_URL=https://your-app-name.railway.app

# 例如：
# VITE_API_URL=https://nofx-backend-123.railway.app

# 应用配置
VITE_APP_TITLE=NOFX AI交易竞赛平台
VITE_APP_VERSION=1.0.0
```

### 步骤5：配置Vite代理（重要！）

在 `web/vite.config.ts` 中，确保代理配置正确：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // 重要：生产环境需要使用环境变量
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

### 步骤6：更新前端API配置

修改 `web/src/lib/api.ts` 文件，确保使用环境变量：

```typescript
// 获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// API请求封装
export const api = {
  async getCompetition() {
    const response = await fetch(`${API_BASE_URL}/api/competition`)
    return response.json()
  },

  async getTraders() {
    const response = await fetch(`${API_BASE_URL}/api/traders`)
    return response.json()
  },

  async getStatus(traderId?: string) {
    const url = traderId
      ? `${API_BASE_URL}/api/status?trader_id=${traderId}`
      : `${API_BASE_URL}/api/status`
    const response = await fetch(url)
    return response.json()
  },

  // ... 其他API方法
}
```

### 步骤7：部署

1. 点击 **"Deploy"** 按钮
2. Vercel开始构建和部署（约2-3分钟）
3. 部署完成后，你会得到一个 `https://your-project.vercel.app` 的URL
4. 🎉 **恭喜！你的前端已经上线了！**

---

## 🔗 第三部分：连接前后端

### 验证部署是否成功

1. **测试后端API**：
   ```bash
   # 在浏览器中打开你的Railway地址
   https://your-app-name.railway.app/health

   # 应该返回：{"status":"ok"}
   ```

2. **测试前端应用**：
   - 打开你的Vercel地址
   - 检查页面是否正常加载
   - 查看浏览器控制台（F12），是否有CORS错误

### 解决常见问题

#### ❌ 问题1：CORS跨域错误

**错误信息**：
```
Access to fetch at 'https://xxx.railway.app/api/competition'
from origin 'https://xxx.vercel.app' has been blocked by CORS policy
```

**解决方案**：
后端代码中已经配置了CORS，但需要确保允许Vercel域名。在 `api/server.go` 中：

```go
// 在main函数或初始化函数中添加
config := gin.Config{
    DisableCors: false,
    AllowOrigins: []string{
        "https://your-app.vercel.app",
        "http://localhost:3000", // 开发环境
    },
}
```

**更简单的方案**（推荐）：
在 `config.json` 中添加：

```json
{
  "cors": {
    "allowed_origins": [
      "https://your-app.vercel.app"
    ]
  },
  "traders": [...]
}
```

然后更新Go代码读取这个配置。

#### ❌ 问题2：API请求404

**检查**：
1. Vite代理配置是否正确
2. 环境变量 `VITE_API_URL` 是否设置
3. 后端路由是否正确

#### ❌ 问题3：构建失败

**前端构建失败**：
```bash
# 本地测试构建
cd web
npm run build

# 查看错误日志，针对性修复
```

**后端构建失败**：
```bash
# 检查Go版本（需要1.25+）
go version

# 检查依赖
go mod tidy
```

---

## 🔐 第四部分：安全配置

### 1. 配置自定义域名（可选但推荐）

**后端（Railway）**：
1. Railway项目 → **Settings** → **Domains**
2. 点击 **"Custom Domain"**
3. 输入你的域名（如：`api.yourdomain.com`）
4. 按提示配置DNS记录

**前端（Vercel）**：
1. Vercel项目 → **Settings** → **Domains**
2. 点击 **"Add Domain"**
3. 输入你的域名（如：`nofx.yourdomain.com`）
4. 配置DNS CNAME记录指向Vercel

### 2. 设置环境变量安全

**⚠️ 永远不要在代码中硬编码API密钥！**

- ✅ 使用Railway/Vercel的环境变量
- ✅ 定期轮换API密钥
- ✅ 限制API密钥权限（Binance密钥只启用期货交易）

### 3. 配置HTTPS

**好消息**：Railway和Vercel都**自动提供HTTPS**，无需手动配置！

---

## 📊 第五部分：监控和维护

### 1. 查看日志

**Railway后端日志**：
- 登录Railway → 项目 → **"Deploy"** 标签 → 点击部署 → **"Logs"**

**Vercel前端日志**：
- 登录Vercel → 项目 → **"Functions"** 标签 → 查看函数日志

### 2. 性能监控

**Railway**提供：
- CPU使用率
- 内存使用率
- 网络流量
- 响应时间

**Vercel**提供：
- 页面加载时间
- 带宽使用量
- 函数执行时间

### 3. 自动部署

**配置自动部署**：
1. 将代码推送到GitHub：`git push origin main`
2. Railway会自动检测并重新部署
3. Vercel也会自动重新构建和部署

---

## 🛠️ 完整部署检查清单

### ✅ 部署前检查

- [ ] GitHub仓库已创建
- [ ] config.json文件已配置
- [ ] API密钥已获取
- [ ] Go版本 ≥ 1.25
- [ ] Node.js版本 ≥ 18

### ✅ 后端部署检查

- [ ] Railway账户已注册
- [ ] 项目已导入
- [ ] 环境变量已配置
- [ ] config.json已上传
- [ ] 构建成功
- [ ] `/health` 端点可访问
- [ ] 记录后端URL

### ✅ 前端部署检查

- [ ] Vercel账户已注册
- [ ] web目录配置正确
- [ ] VITE_API_URL环境变量已设置
- [ ] 构建成功
- [ ] 页面可正常访问
- [ ] API调用正常
- [ ] 无控制台错误

### ✅ 联调测试

- [ ] 前端能成功调用后端API
- [ ] CORS配置正确
- [ ] 数据显示正常
- [ ] 图表渲染正常
- [ ] 移动端兼容性测试

---

## 🎓 常见问题FAQ

### Q1: 为什么要前后端分离部署？

**A**:
- Vercel主要优化前端应用（Next.js, React, Vue）
- Go后端需要长期运行的服务，Railway更合适
- 分离部署更灵活，后端可以随时替换平台

### Q2: 可以用其他后端平台吗？

**A**: 当然可以！推荐平台：
- **Render** - 类似Railway，Go支持很好
- **DigitalOcean App Platform** - 功能全面
- **AWS Elastic Beanstalk** - 功能强大但复杂
- **Heroku** - 经典PaaS平台

### Q3: 有免费额度吗？

**A**:
- **Railway**: 新用户有$5免费额度，约够用1个月
- **Vercel**: 个人账户有100GB带宽和无限部署次数
- **Render**: 有免费套餐，但会休眠

### Q4: 如何更新部署？

**A**:
1. 修改代码
2. 推送到GitHub：`git add . && git commit -m "update" && git push`
3. 等待自动部署（约3-5分钟）
4. 访问URL验证

### Q5: 遇到问题怎么排查？

**A**:
1. 查看部署平台日志
2. 检查环境变量是否正确
3. 本地测试构建：`cd web && npm run build`
4. 查看浏览器控制台错误

---

## 🎉 部署成功！

恭喜你完成了NOFX项目的部署！ 🎊

你的网站现在应该可以访问了：
- **前端**: `https://your-project.vercel.app`
- **后端**: `https://your-app-name.railway.app`

### 下一步

1. 🧪 **功能测试**: 登录系统，查看交易数据
2. 🎨 **UI定制**: 修改前端样式和主题
3. 📈 **性能优化**: 启用缓存，优化API响应
4. 🔐 **安全加固**: 配置更严格的API访问控制
5. 🌐 **域名绑定**: 使用自定义域名（可选）

### 获得帮助

- 📧 **邮件支持**: 通过部署平台的工单系统
- 💬 **社区论坛**: Railway和Vercel都有活跃的Discord
- 📖 **文档**: [Railway Docs](https://docs.railway.app) | [Vercel Docs](https://vercel.com/docs)

---

## 📚 进阶学习

想深入了解部署？推荐学习：

1. **Docker容器化**: 将前后端打包成Docker镜像
2. **CI/CD**: 使用GitHub Actions自动化部署
3. **监控告警**: 集成Sentry/Prometheus监控
4. **负载均衡**: 使用Nginx进行反向代理
5. **高可用**: 配置多实例部署

---

**© 2025 NOFX部署指南 | 祝部署顺利！ 🚀**