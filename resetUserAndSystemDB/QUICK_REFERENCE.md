# 快速参考 - 密码重置命令

## 最常用的命令

### 1️⃣ 生成新哈希并更新数据库
```bash
cd resetUserPwd
go run reset_password.go -email <email> -password <password>
```

**示例**:
```bash
go run reset_password.go -email gyc567@gmail.com -password eric8577HH
```

---

### 2️⃣ 使用已有哈希更新数据库
```bash
go run reset_password.go -email <email> -password <password> -hash <hash>
```

---

### 3️⃣ 仅验证密码与哈希
```bash
go run reset_password.go -password <password> -hash <hash> -verify
```

---

### 4️⃣ 测试登陆 (部署后)
```bash
curl -X POST https://nofx-gyc567.replit.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gyc567@gmail.com","password":"eric8577HH"}'
```

---

## 密钥参数

| 参数 | 用途 |
|------|------|
| `-email` | 用户邮箱 |
| `-password` | 新密码 |
| `-hash` | bcrypt 哈希 (可选) |
| `-db` | 数据库 URL (可选) |
| `-verify` | 仅验证模式 |

---

## 工作目录

```bash
cd /Users/guoyingcheng/dreame/code/nofx/resetUserPwd
go run reset_password.go -email <email> -password <password>
```

---

## 预期输出

✅ 成功时输出:
```
✅ 密码重置成功!
🧪 测试登陆:
   curl -X POST https://nofx-gyc567.replit.app/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"...","password":"..."}'
```

---

## 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `密码太短` | 密码少于 8 位 | 使用至少 8 位密码 |
| `用户不存在` | 邮箱不匹配 | 检查邮箱拼写 |
| `数据库连接失败` | DATABASE_URL 未设置 | 检查 .env.local |
| `密码验证失败` | 哈希或密码错误 | 检查 -hash 参数 |

---

## 一键命令 (复制即用)

```bash
# 重置 gyc567@gmail.com 的密码为 eric8577HH
cd /Users/guoyingcheng/dreame/code/nofx/resetUserPwd && go run reset_password.go -email gyc567@gmail.com -password eric8577HH
```

---

**使用前务必阅读完整文档**: `resetUserPwd/README.md`
