# 用户密码重置工具 - 使用指南

## 📋 概述

`reset_password.go` 是一个专业的用户密码重置工具，用于：
- 生成全新的 bcrypt 密码哈希
- 验证密码与哈希的匹配
- 安全地更新数据库中的密码

> ⚠️ **重要**: 此工具处理敏感信息，存放在 `.gitignore` 中的 `resetUserPwd/` 目录，**不会提交到远程仓库**。

---

## 🚀 使用方式

### 方式 1: 生成新哈希并直接更新数据库（最常用）

```bash
cd resetUserPwd
go run reset_password.go -email gyc567@gmail.com -password eric8577HH
```

**输出示例**:
```
🔐 生成新的 bcrypt 哈希...
✅ 哈希已生成: $2a$10$P0/vR.002g76aH6KaH4u2O/38j2QJuM51RLM9EZVo2g4.Fmc/Vvr.

🧪 验证密码与哈希...
✅ 验证成功! 密码与哈希匹配

🗄️  连接数据库...
✅ 数据库连接成功

🔍 查询用户信息...
✅ 用户找到: gyc567@gmail.com
   旧哈希长度: 60
   旧哈希起始: $2a$10$02N

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  确认信息:
   邮箱: gyc567@gmail.com
   新密码: eric8577HH
   新哈希: $2a$10$P0/vR.002g76aH6KaH4u2O/38j2QJuM51RLM9EZVo2g4.Fmc/Vvr.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 更新数据库...
✅ 已更新 1 行

✅ 验证更新...
   新哈希长度: 60
   新哈希起始: $2a$10$P0/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 密码重置成功!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 方式 2: 使用已有哈希更新数据库

如果你已经有一个 bcrypt 哈希，直接使用它更新数据库：

```bash
go run reset_password.go \
  -email gyc567@gmail.com \
  -password eric8577HH \
  -hash '$2a$10$P0/vR.002g76aH6KaH4u2O/38j2QJuM51RLM9EZVo2g4.Fmc/Vvr.'
```

---

### 方式 3: 仅验证密码与哈希（不更新数据库）

在更新数据库之前验证密码是否与哈希匹配：

```bash
go run reset_password.go \
  -password eric8577HH \
  -hash '$2a$10$P0/vR.002g76aH6KaH4u2O/38j2QJuM51RLM9EZVo2g4.Fmc/Vvr.' \
  -verify
```

---

### 方式 4: 使用自定义数据库 URL

如果需要连接到非默认数据库：

```bash
go run reset_password.go \
  -email gyc567@gmail.com \
  -password eric8577HH \
  -db 'postgresql://user:pass@host:5432/dbname?sslmode=require'
```

---

## 📊 参数说明

| 参数 | 必需 | 说明 | 示例 |
|------|------|------|------|
| `-email` | ✅ | 用户邮箱地址 | `gyc567@gmail.com` |
| `-password` | ✅ | 新密码（至少 8 位） | `eric8577HH` |
| `-hash` | ❌ | bcrypt 哈希（不提供则自动生成） | `$2a$10$...` |
| `-db` | ❌ | 数据库 URL（不提供则从环境变量读取） | `postgresql://...` |
| `-verify` | ❌ | 仅验证模式，不更新数据库 | - |

---

## 🔄 工作流程

```
┌─────────────────────────────────┐
│  1. 验证命令行参数              │
├─────────────────────────────────┤
│  2. 生成/验证 bcrypt 哈希       │
├─────────────────────────────────┤
│  3. 验证密码与哈希是否匹配      │
├─────────────────────────────────┤
│  4. 连接数据库                  │
├─────────────────────────────────┤
│  5. 查询用户是否存在            │
├─────────────────────────────────┤
│  6. 更新用户密码哈希            │
├─────────────────────────────────┤
│  7. 验证更新成功                │
├─────────────────────────────────┤
│  8. 输出测试登陆命令            │
└─────────────────────────────────┘
```

---

## ✅ 安全特性

1. **密码长度验证** - 至少 8 位
2. **用户存在性检查** - 更新前验证用户是否存在
3. **哈希完整性验证** - 更新后验证哈希长度为 60 字节
4. **bcrypt 匹配验证** - 确保密码与哈希匹配
5. **敏感信息隔离** - 存放在 `.gitignore` 中，不提交到远程仓库

---

## 🚨 常见问题

### Q: 密码重置失败，提示 "用户不存在"
**A:** 检查邮箱拼写，确保用户确实存在于数据库中。

### Q: 密码重置后仍无法登陆
**A:**
1. 确保后端代码已部署到生产环境
2. 检查是否清除了浏览器缓存
3. 查看生产环境的登陆日志

### Q: 如何快速生成密码的 bcrypt 哈希？
**A:** 使用 `-verify` 模式：
```bash
go run reset_password.go -password eric8577HH -verify
```
这会输出生成的哈希，不对数据库进行任何操作。

---

## 📝 环境变量

工具会自动读取以下环境变量：

| 环境变量 | 说明 |
|---------|------|
| `DATABASE_URL` | PostgreSQL 连接 URL |

如果未设置，需要通过 `-db` 参数提供。

---

## 🔐 示例工作流

**场景**: 用户忘记密码，需要重置为 `newPass123`

```bash
# 第 1 步: 生成新哈希
cd resetUserPwd
go run reset_password.go -email gyc567@gmail.com -password newPass123

# 输出会显示:
# ✅ 密码重置成功!
# 🧪 测试登陆:
#    curl -X POST https://nofx-gyc567.replit.app/api/login \
#      -H "Content-Type: application/json" \
#      -d '{"email":"gyc567@gmail.com","password":"newPass123"}'

# 第 2 步: 使用上面的 curl 命令测试登陆
curl -X POST https://nofx-gyc567.replit.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gyc567@gmail.com","password":"newPass123"}'

# 预期返回: 200 OK + token
```

---

## 📂 目录结构

```
nofx/
├── resetUserPwd/              # 密码重置工具目录 (在 .gitignore 中)
│   ├── reset_password.go      # 主脚本
│   └── README.md              # 本文档
├── .gitignore                 # 包含 resetUserPwd/ 条目
└── ... 其他文件
```

---

## 🔒 安全提示

1. **不要泄露密码** - 此工具仅用于合法的密码重置
2. **不要提交到版本控制** - `resetUserPwd/` 在 `.gitignore` 中
3. **定期审计** - 检查密码重置操作的日志
4. **限制访问** - 仅授予需要此工具的人员访问权限

---

## 📞 支持

遇到问题？检查以下内容：

1. ✅ 密码至少 8 位
2. ✅ 邮箱地址正确
3. ✅ 数据库连接正常
4. ✅ 后端代码已部署到生产环境
5. ✅ 浏览器缓存已清除

---

**上次更新**: 2025-12-13
