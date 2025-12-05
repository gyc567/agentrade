# 🚀 Vercel 快速部署指南

## 一键部署 (当前项目)

```bash
# 1. 进入项目目录
cd /Users/guoyingcheng/dreame/code/nofx/web

# 2. 安装依赖 (首次需要)
npm install

# 3. 本地构建测试
npm run build

# 4. 登录 Vercel (首次需要)
vercel login

# 5. 部署到生产环境
vercel --prod --confirm

# 6. 检查部署状态
vercel ls
```

---

## 环境变量设置

```bash
# 设置 API URL
vercel env add VITE_API_URL production
# 输入: https://nofx-gyc567.replit.app

# 查看环境变量
vercel env ls
```

---

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `vercel` | 部署到预览环境 |
| `vercel --prod` | 部署到生产环境 |
| `vercel --prod --confirm` | 自动确认部署 |
| `vercel ls` | 查看部署历史 |
| `vercel logs <url>` | 查看日志 |
| `vercel inspect <url>` | 查看部署详情 |

---

## 配置文件

**vercel.json**:
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

**.env.local**:
```bash
VITE_API_URL=https://nofx-gyc567.replit.app
```

---

## 验证部署

```bash
# 检查网站可访问性
curl -I https://your-app.vercel.app

# 检查 API 可用性
curl https://nofx-gyc567.replit.app/api/supported-exchanges
```

**期望结果**: HTTP 200 OK

---

## 故障排查

### 构建失败
```bash
# 检查依赖
npm install

# 本地测试构建
npm run build
```

### 页面空白
- 检查环境变量 `VITE_API_URL`
- 确认 `vercel.json` 配置正确
- 查看日志: `vercel logs <url>`

### API 错误
- 验证后端 API: `https://nofx-gyc567.replit.app/api`
- 重新设置环境变量: `vercel env add VITE_API_URL production`

---

## 自动化脚本

**deploy.sh**:
```bash
#!/bin/bash
vercel --prod --confirm
```

**使用方法**:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 项目状态 ✅

- ✅ Vercel CLI: v48.10.3 (已安装)
- ✅ 配置文件: vercel.json (已配置)
- ✅ 环境变量: .env.local (已设置)
- ✅ 构建测试: 通过 (2744 模块)
- ✅ 部署就绪: 是

---

**详细文档**: [vercel-deploy-skills.md](./vercel-deploy-skills.md)
