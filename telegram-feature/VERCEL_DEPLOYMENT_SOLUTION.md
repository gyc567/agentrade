# Vercel 部署权限问题解决方案

## ❌ 错误信息

```
Error: Git author actions@github.com must have access to the team gyc567's projects on Vercel to create deployments.
```

## 🔍 错误原因

Vercel CLI部署时会检查当前git用户身份。当前的git author是`actions@github.com`（GitHub Actions机器人账户），但这个账户没有被授权访问team `gyc567`下的Vercel项目。

Vercel使用团队/个人账户模型进行权限管理，GitHub Actions以`actions@github.com`身份运行，不等同于你的个人Vercel账户，需要显式授权。

---

## 🛠️ 解决方案一：在Vercel Dashboard中添加GitHub Actions为协作者

### 适用场景
- 希望通过GitHub Actions自动部署
- 不想管理Personal Access Token
- 需要团队其他成员也能看到部署

### 操作步骤

#### 步骤1：访问Vercel Dashboard
1. 打开浏览器，访问：[https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 使用你的账户登录（用户名：gyc567）

#### 步骤2：选择项目
1. 在Dashboard中找到项目：**gyc567s-projects/web**
2. 点击项目名称进入项目详情页
3. 或直接访问：https://vercel.com/gyc567s-projects/web

#### 步骤3：访问Settings > Members
1. 点击项目顶部的 **"Settings"** 标签
2. 在左侧菜单中选择 **"Members"** 或 **"Access Control"**

#### 步骤4：添加GitHub机器人账户
1. 点击 **"Add Member"** 或 **"Invite"** 按钮
2. 在邮箱/用户名输入框中输入：
   ```
   actions@github.com
   ```
3. 选择角色权限：
   - **Developer**：可以部署，不能管理项目设置（推荐）
   - **Admin**：完全访问权限（谨慎使用）

#### 步骤5：确认邀请
1. 点击 **"Invite"** 或 **"Add"**
2. 系统会自动发送邀请给GitHub机器人账户
3. 机器人账户会自动接受邀请（通常几秒钟内）

#### 步骤6：验证添加成功
1. 返回Members列表
2. 确认看到 `actions@github.com` 在成员列表中
3. 状态显示为 **"Accepted"** 或 **"Active"**

#### 步骤7：测试部署
1. 推送代码到GitHub仓库：
   ```bash
   git push origin main
   ```
2. 访问：[https://github.com/gyc567/nofx/actions](https://github.com/gyc567/nofx/actions)
3. 查看GitHub Actions运行状态
4. 应该能看到成功的部署

### ✅ 优点
- 官方推荐方式
- 安全的权限控制
- 团队协作友好
- 透明的部署历史

### ⚠️ 注意事项
- 确保选择正确的项目（gyc567s-projects/web）
- 避免给予Admin权限
- 如果有多个项目，需要为每个项目单独添加

---

## 🛠️ 解决方案二：使用Personal Access Token

### 适用场景
- 希望通过Vercel CLI直接部署
- 不使用GitHub Actions
- 需要从不同机器/账户部署

### 操作步骤

#### 步骤1：创建Personal Access Token
1. 访问Vercel Account Settings：
   [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. 点击 **"Create Token"** 按钮
3. 输入token名称（如：`gyc567-cli-token`）
4. 点击 **"Create"**
5. **⚠️ 重要：立即复制token值**，它只显示一次

#### 步骤2：本地配置Token
选择以下任意一种方式：

##### 方式A：环境变量（推荐）
```bash
export VERCEL_TOKEN=你的token值
vercel --prod
```

##### 方式B：命令行参数
```bash
vercel --prod --token=你的token值
```

##### 方式C：项目配置
在项目根目录创建 `.env.local`：
```bash
VERCEL_TOKEN=你的token值
```

然后运行：
```bash
vercel --prod
```

#### 步骤3：验证配置
检查token是否生效：
```bash
vercel whoami
```
应该显示：
```
gyc567
```

#### 步骤4：执行部署
在项目目录中：
```bash
cd web
vercel --prod
```

#### 步骤5：按照提示操作
- 确认项目设置（按Enter接受默认）
- 确认部署（输入 `y`）

#### 步骤6：成功部署
看到类似输出：
```
✅  Production: https://web-xxxxx.vercel.app [1m 23s]
📝  Deployed to production. Run `vercel --prod` to overwrite later.
💡  To change the domain, go to https://vercel.com/gyc567s-projects/web
```

### ✅ 优点
- 快速直接
- 不依赖GitHub Actions
- 可以从任何机器部署
- 绕过git author检查

### ⚠️ 注意事项
- **安全风险**：token是敏感信息，不要提交到Git
- **过期时间**：token有过期时间，需要定期更新
- **权限范围**：token拥有你的账户权限
- **环境变量**：确保在CI/CD环境中正确设置

### 最佳实践
1. **安全存储**：
   ```bash
   # 添加到 ~/.bashrc 或 ~/.zshrc
   export VERCEL_TOKEN=你的token值
   ```

2. **CI/CD使用**：
   在GitHub Actions中添加Secrets：
   - 名称：`VERCEL_TOKEN`
   - 值：你的token值
   - 然后在工作流中使用：`--token=${{ secrets.VERCEL_TOKEN }}`

3. **定期轮换**：
   - 建议每3个月更新一次token
   - 过期后创建新token并替换

---

## 📊 方案对比

| 特性 | 方案一：添加协作者 | 方案二：Personal Token |
|------|-------------------|----------------------|
| **部署方式** | GitHub Actions自动 | Vercel CLI手动 |
| **设置复杂度** | 中等 | 简单 |
| **安全性** | 高 | 中等 |
| **团队协作** | 好 | 一般 |
| **灵活性** | 只能从GitHub | 任何机器 |
| **维护成本** | 低 | 中等 |
| **推荐场景** | 持续集成 | 手动部署 |

---

## 🎯 推荐方案

### 最佳实践：同时使用两种方案

**开发阶段**：
- 使用方案二（Personal Token）进行快速测试和调试
- 可以立即验证部署结果

**生产环境**：
- 使用方案一（添加协作者）实现自动化部署
- 代码合并到main分支自动触发部署
- 便于团队协作和部署历史追踪

---

## 🚀 快速执行

### 要立即部署，选择方案二：

```bash
# 1. 创建token：https://vercel.com/account/tokens

# 2. 设置token（替换YOUR_TOKEN为实际值）
export VERCEL_TOKEN=YOUR_TOKEN

# 3. 部署
cd web
vercel --prod
```

### 要设置自动化，选择方案一：

```
1. 访问：https://vercel.com/gyc567s-projects/web/settings/members
2. 添加：actions@github.com
3. 推送代码：git push origin main
4. 查看：https://github.com/gyc567/nofx/actions
```

---

## 📞 故障排除

### 方案一常见问题

**Q1：邀请被拒绝**
- A：确保使用 `actions@github.com`（不是其他变体）
- A：确保选择的是正确的项目

**Q2：推送代码后仍然失败**
- A：检查Actions日志，看是否使用了正确的token
- A：确认Secrets中包含正确的VERCEL_TOKEN等值

### 方案二常见问题

**Q1：token无效**
- A：检查token是否正确复制
- A：确认token没有过期
- A：重新创建token

**Q2：权限被拒绝**
- A：token可能没有项目访问权限
- A：在Vercel Dashboard中确认token状态

**Q3：部署URL没有更新**
- A：使用 `--prod` 参数强制部署到生产环境
- A：检查Vercel项目设置中的Build Command

---

## 📚 参考链接

- [Vercel官方文档 - Deployment Permissions](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Personal Access Tokens](https://vercel.com/docs/concepts/personal-accounts/pat)

---

**文档创建时间**：2025-11-13
**项目**：Monnaire Trading Agent OS
**作者**：Claude Code Assistant
