# ⚡ NOFX 快速部署指南

> **30分钟完成部署！** 🚀

---

## 🎯 选择你的部署方案

### 方案一：Vercel + Railway（推荐⭐⭐⭐⭐⭐）
- ✅ 简单快速
- ✅ 有免费额度
- ✅ 零配置
- ⏱️ **预计时间**: 30分钟

### 方案二：仅本地Docker开发
- ✅ 完全离线
- ✅ 数据隐私
- ❌ 外部无法访问
- ⏱️ **预计时间**: 10分钟

---

## 🚀 方案一：Vercel + Railway 部署

### 步骤1️⃣：准备代码

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd nofx

# 2. 配置config.json
cp config.json.example config.json
# 编辑 config.json，填入你的API密钥
```

### 步骤2️⃣：创建GitHub仓库

```bash
git init
git add .
git commit -m "init: nofx project"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 步骤3️⃣：部署后端（Railway）⚡ 5分钟

1. 打开 [https://railway.app](https://railway.app)
2. 点击 **"Login"** → GitHub登录
3. **"New Project"** → **"Deploy from GitHub repo"**
4. 选择你的仓库
5. **等待自动部署**（约3分钟）
6. 记录后端URL：`https://xxxxx.railway.app`

**重要**：部署后需要上传 `config.json` 文件！

### 步骤4️⃣：部署前端（Vercel）⚡ 5分钟

1. 打开 [https://vercel.com](https://vercel.com)
2. 点击 **"Sign Up"** → GitHub登录
3. **"New Project"** → 选择你的仓库
4. 配置：
   - **Framework**: Vite
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量：
   ```
   VITE_API_URL=https://xxxxx.railway.app
   ```
6. 点击 **"Deploy"** → 等待2分钟
7. 🎉 **部署完成！**

### 步骤5️⃣：配置后端config.json

在Railway项目页面：
1. 点击 **"Variables"** 标签
2. 添加新变量：
   - **Name**: `CONFIG_FILE`
   - **Value**: 你的 `config.json` 内容（复制粘贴）
3. 点击 **"Add"**
4. **重新部署**（自动触发）

### 步骤6️⃣：测试

- 前端：访问 `https://xxxxx.vercel.app`
- 后端：访问 `https://xxxxx.railway.app/health`
- 应该看到：`{"status":"ok"}`

---

## 🐳 方案二：Docker本地开发

### 快速启动

```bash
# 1. 配置环境
cp .env.example .env
cp web/.env.example web/.env.local
# 编辑这两个文件，填入API密钥

# 2. 一键启动
docker-compose up -d

# 3. 访问
# 前端：http://localhost:3000
# 后端：http://localhost:8080/health
```

### 停止服务

```bash
docker-compose down
```

---

## 🔧 常见问题

### ❓ Q: 部署后页面空白？

**A**: 检查环境变量 `VITE_API_URL` 是否设置正确

### ❓ Q: API调用404？

**A**: 确认后端Railway已正常部署，且config.json已配置

### ❓ Q: CORS错误？

**A**: 后端需要允许Vercel域名。修改 `api/server.go` 添加：
```go
c.Header("Access-Control-Allow-Origin", "https://your-vercel-url.vercel.app")
```

### ❓ Q: 构建失败？

**A**:
```bash
# 前端测试
cd web && npm run build

# 后端测试
go mod tidy
go build
```

---

## 📝 环境变量清单

### 后端环境变量（Railway）
- `NOFX_BACKEND_PORT=8080`
- `HYPERLIQUID_PRIVATE_KEY=xxx`
- `BINANCE_API_KEY=xxx`
- `DEEPSEEK_KEY=xxx`
- `CONFIG_FILE`（完整config.json内容）

### 前端环境变量（Vercel）
- `VITE_API_URL=https://xxxx.railway.app`

---

## 🎓 下一步

部署成功后，你可以：

1. **🔗 绑定自定义域名**
2. **📊 配置监控告警**
3. **🔐 加固安全设置**
4. **⚡ 优化性能**
5. **🧪 功能测试**

详细说明请查看：《[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)》

---

**💡 提示**：遇到问题？查看部署日志和浏览器控制台错误信息！