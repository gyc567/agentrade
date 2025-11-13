# NOFX 后端部署到 Render 详细教程 👨‍💻

> **哥，这个文档是为新手小白准备的，一步一步跟着做就能成功部署！**

## 📋 目录

- [项目简介](#项目简介)
- [准备工作](#准备工作)
- [Render 账号注册](#render-账号注册)
- [配置步骤](#配置步骤)
  - [步骤1: 准备配置文件](#步骤1-准备配置文件)
  - [步骤2: 上传代码到 GitHub](#步骤2-上传代码到-github)
  - [步骤3: 在 Render 创建 Web Service](#步骤3-在-render-创建-web-service)
  - [步骤4: 配置构建命令](#步骤4-配置构建命令)
  - [步骤5: 配置启动命令](#步骤5-配置启动命令)
  - [步骤6: 添加环境变量](#步骤6-添加环境变量)
- [部署测试](#部署测试)
- [常见问题](#常见问题)
- [后续维护](#后续维护)

---

## 🎯 项目简介

NOFX 是一个 **AI 驱动的加密货币交易系统**，包含：

- **后端**: Go 语言开发，提供 API 接口
- **前端**: React + TypeScript，提供管理界面
- **数据库**: SQLite（轻量级，无需额外配置）

**技术栈**:
- Go 1.25
- Gin Web Framework
- SQLite3
- React 18 + TypeScript
- Vite + TailwindCSS

---

## 🔧 准备工作

### 必需账号

1. **Render 账号** - 部署平台
2. **GitHub 账号** - 代码托管

### 本地工具

- **Git** - 代码版本控制
- **文本编辑器** - VS Code 或 Sublime Text

---

## 🚀 Render 账号注册

### 第一步：注册 Render 账号

1. 打开浏览器，访问：https://dashboard.render.com
2. 点击 **"Sign Up"** 注册
3. 选择注册方式（推荐用 GitHub 账号登录）:
   - GitHub 授权登录 ✅（推荐）
   - Google 登录
   - Email 注册

### 第二步：验证邮箱

1. 检查邮箱收件箱（包括垃圾邮件）
2. 点击验证链接完成激活

---

## ⚙️ 配置步骤

### 步骤1: 准备配置文件

#### 1.1 创建 config.json

在项目根目录，确保有 `config.json` 文件：

```bash
# 如果没有，复制示例文件
cp config.json.example config.json
```

#### 1.2 编辑 config.json

重要：确保启用至少一个交易员（trader），否则服务启动后会立即关闭：

```json
{
  "traders": [
    {
      "id": "binance_qwen",
      "name": "Binance Qwen Trader",
      "enabled": true,  // ✅ 改为 true
      "ai_model": "qwen",
      "exchange": "binance",
      "binance_api_key": "你的币安API密钥",
      "binance_secret_key": "你的币安_secret密钥",
      "qwen_key": "你的通义千问API密钥",
      "initial_balance": 1000,
      "scan_interval_minutes": 3
    }
  ],
  "api_server_port": 8080,
  "max_daily_loss": 10.0,
  "max_drawdown": 20.0
}
```

⚠️ **注意**:
- 至少设置一个 `enabled: true`
- 填写真实的 API 密钥（测试网可以先用假的）

---

### 步骤2: 上传代码到 GitHub

#### 2.1 创建 GitHub 仓库

1. 登录 GitHub: https://github.com
2. 点击右上角 **"+"** → **"New repository"**
3. 仓库信息:
   - Repository name: `nofx-backend` （或任意名称）
   - Description: `NOFX AI Trading System Backend`
   - 设置为 **Public** 或 **Private**
4. 点击 **"Create repository"**

#### 2.2 推送代码

在项目根目录执行：

```bash
# 初始化 git（如果还没初始化）
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit: NOFX backend code"

# 关联 GitHub 仓库（替换 YOUR_USERNAME 和 YOUR_REPO）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

💡 **提示**: 推送可能需要输入 GitHub 用户名和密码（推荐用 Personal Access Token）

---

### 步骤3: 在 Render 创建 Web Service

#### 3.1 登录 Render

1. 打开 https://dashboard.render.com
2. 登录你的账号

#### 3.2 创建 Web Service

1. 在 Dashboard 点击 **"New +"**
2. 选择 **"Web Service"**
3. 选择构建方式:
   - 选择 **"Build and deploy from a Git repository"** ✅

#### 3.3 连接 GitHub

1. 选择 **"Build and deploy from a Git repository"**
2. 点击 **"Connect"** 连接你的 GitHub
3. 授权 Render 访问你的仓库
4. 从列表中选择你的 NOFX 仓库

---

### 步骤4: 配置构建命令

在 Web Service 配置页面，填写以下信息：

#### 基础配置

| 字段 | 值 |
|------|-----|
| **Name** | `nofx-backend` （或自定义） |
| **Region** | 选择离你最近的区域 |
| **Branch** | `main` |
| **Root Directory** | 留空（因为在根目录） |

#### 构建和部署配置

**关键设置**:

- **Runtime**: 选择 **"Go"** ✅
- **Build Command**: 复制粘贴以下命令:

```bash
apk add --no-cache gcc g++ musl-dev && \
go mod download && \
CGO_ENABLED=1 GOOS=linux go build -o nofx main.go
```

⚠️ **注意**: 复制时确保换行符正确

**构建命令说明**:
```bash
apk add --no-cache gcc g++ musl-dev    # 安装 C 编译器（TA-Lib 需要）
go mod download                        # 下载 Go 依赖
CGO_ENABLED=1 go build -o nofx main.go # 编译 Go 程序
```

---

### 步骤5: 配置启动命令

在 **"Start Command"** 字段填写：

```bash
./nofx
```

**环境变量设置**:
- **PORT**: `8080` （Render 会自动注入，但写上更保险）

---

### 步骤6: 添加环境变量

#### 6.1 添加 Go 环境配置

滚动到 **"Environment"** 部分，添加：

| Key | Value |
|-----|-------|
| `GO_VERSION` | `1.25` |
| `CGO_ENABLED` | `1` |

#### 6.2 添加应用配置

在 **"Environment"** 部分继续添加：

| Key | Value | 说明 |
|-----|-------|------|
| `NOFX_TIMEZONE` | `Asia/Shanghai` | 时区设置 |

#### 6.3 添加自定义环境变量（可选）

如果你的 config.json 里有敏感信息，可以通过环境变量设置：

例如，设置管理员模式：
```bash
ADMIN_MODE=true
```

⚠️ **注意**: Render 环境变量优先于 config.json 中的值

---

### 步骤7: 创建磁盘

#### 7.1 为什么需要磁盘？

Render 的文件系统是临时性的，应用重启后会丢失数据。需要创建磁盘来持久化：
- `config.db` - SQLite 数据库
- `decision_logs` - 决策日志

#### 7.2 创建磁盘

1. 在 Render Dashboard，点击 **"New +"**
2. 选择 **"Disk"**
3. 配置：
   - **Name**: `nofx-data`
   - **Size**: `1GB` （足够用）
   - **Mount Path**: `/data` （默认路径）
4. 点击 **"Create Disk"**

#### 7.3 将磁盘挂载到服务

1. 回到你的 Web Service 配置页面
2. 找到 **"Disks"** 部分
3. 点击 **"Add Disk"**
4. 选择刚创建的磁盘
5. 设置挂载路径：
   - Mount Path: `/`
   - Sub Path: `data`

#### 7.4 更新启动命令

修改 **"Start Command"** 为：

```bash
mkdir -p decision_logs && \
./nofx
```

这样会创建必要的目录

---

### 步骤8: 配置健康检查

Render 会自动检查应用是否正常运行。确保你的应用有 `/api/health` 端点（NOFX 已经包含）。

---

## ✅ 部署测试

### 启动部署

1. 点击页面底部 **"Create Web Service"**
2. Render 开始构建和部署

### 查看构建日志

1. 点击进入你的 Service
2. 在 **"Logs"** 标签页查看日志
3. 构建过程大约需要 **5-10 分钟**

### 成功标志

日志中出现：

```
✅ 构建成功
✅ 服务启动成功
✅ 端口监听: 8080
```

### 访问测试

构建完成后，Render 会提供一个 URL，格式如：
`https://nofx-backend.onrender.com`

#### 测试 API

```bash
# 测试健康检查端点
curl https://YOUR_SERVICE_NAME.onrender.com/api/health

# 应该返回类似：
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## ❗ 常见问题

### Q1: 构建失败 - 提示找不到 C 编译器

**错误**:
```
exec: "gcc": executable file not found in $PATH
```

**解决方案**:
确保构建命令包含：
```bash
apk add --no-cache gcc g++ musl-dev
```

---

### Q2: 构建失败 - TA-Lib 编译错误

**错误**:
```
/usr/local/lib/libtalib.a: could not read symbols: Invalid operation
```

**解决方案**:
修改构建命令，确保使用正确的编译器标志：
```bash
CGO_ENABLED=1 CGO_CFLAGS="-D_LARGEFILE64_SOURCE" go build -o nofx main.go
```

---

### Q3: 应用启动后立即退出

**可能原因**:
- 没有启用任何 trader（所有 `enabled: false`）
- API 密钥错误
- 磁盘挂载问题

**解决方案**:
1. 检查 config.json，确保至少一个 trader 设置 `enabled: true`
2. 查看 **"Logs"** 了解退出原因

---

### Q4: 数据库文件丢失

**问题**: 重启后配置消失

**解决方案**:
- 必须创建并挂载 Render Disk
- 确保数据库文件保存在磁盘挂载路径

---

### Q5: 端口绑定错误

**错误**:
```
bind: address already in use
```

**解决方案**:
Render 会自动注入 `PORT` 环境变量。修改代码使用：
```go
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}
```

---

### Q6: API 密钥泄露

**风险**: config.json 被提交到 GitHub

**解决方案**:
1. 创建 `.env` 文件（不要提交到 Git）
2. 使用环境变量存储敏感信息
3. 更新 config.json 读取环境变量

---

### Q7: 免费版限制

Render 免费版的限制：
- 服务 15 分钟无请求会休眠
- 休眠后首次请求需要 30 秒启动
- 每月有 750 小时运行时长限制

**解决方案**:
- 考虑升级到付费版（$7/月）获得 24/7 运行
- 或使用定时任务保持服务唤醒

---

## 🔄 后续维护

### 更新部署

1. 本地修改代码
2. 重新提交到 GitHub:
   ```bash
   git add .
   git commit -m "Update: your changes"
   git push origin main
   ```
3. Render 自动检测到更新并重新部署

### 查看日志

1. 进入 Render Dashboard
2. 选择你的 Service
3. 点击 **"Logs"** 标签页
4. 可以实时查看日志输出

### 扩展配置

- **升级付费版**: 获得 24/7 稳定运行
- **添加自定义域名**: 在 Service 设置中配置
- **开启自动扩展**: 在 Service 设置中配置

---

## 📚 参考资源

- **Render 官方文档**: https://render.com/docs
- **Go on Render 指南**: https://render.com/docs/go
- **NOFX 项目**: 本项目 GitHub 仓库
- **问题反馈**: 创建 GitHub Issue

---

## 🎉 部署完成！

恭喜！你已经成功将 NOFX 后端部署到 Render。

**下一步**:
1. 测试 API 功能
2. 配置前端（可选）
3. 设置监控和告警
4. 开始你的 AI 交易之旅！

---

**📧 有问题？**

- 查看 Render 日志排查问题
- 参考常见问题部分
- 在 GitHub 提交 Issue

---

*生成时间: 2024-11-12*
*版本: v1.0*
