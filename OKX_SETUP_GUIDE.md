# OKX API配置设置指南

## 📋 问题诊断

**现象**: 余额显示0.00 USDT
**原因**: 数据库中OKX的API配置为空
**证据**:
```
okx|admin|OKX Futures|cex|1|||0|||||
               ^^^^  ^^^^^^  ^^^^^^^^^^
              空    空      空
```

## 🛠️ 解决方案

### 方法1: 使用环境变量（推荐）

1. 编辑 `.env.local` 文件
```bash
# 在文件末尾添加:
OKX_API_KEY=your_real_api_key
OKX_SECRET_KEY=your_real_secret_key
OKX_PASSPHASE=your_real_passphrase
INITIAL_BALANCE=100
```

2. 重新运行测试
```bash
go run test_okx_from_db.go
```

### 方法2: 使用自动化脚本

1. 设置环境变量
```bash
export OKX_API_KEY=your_api_key
export OKX_SECRET_KEY=your_secret_key
export OKX_PASSPHASE=your_passphrase
```

2. 运行更新脚本
```bash
./update_okx_config.sh
```

3. 测试连接
```bash
go run test_okx_from_db.go
```

### 方法3: 手动SQL更新

1. 打开SQLite数据库
```bash
sqlite3 config.db
```

2. 执行更新命令
```sql
UPDATE exchanges
SET api_key = 'your_api_key',
    secret_key = 'your_secret_key',
    okx_passphrase = 'your_passphrase',
    enabled = 1
WHERE id = 'okx' AND user_id = 'admin';
```

3. 验证更新
```sql
SELECT * FROM exchanges WHERE id = 'okx';
```

4. 退出SQLite
```sql
.quit
```

## 🔑 如何获取OKX API凭证

1. 登录 [OKX官网](https://www.okx.com)
2. 进入 **账户** → **API管理**
3. 点击 **创建V5 API Key**
4. 设置权限：
   - ✅ 读取
   - ✅ 交易
   - ❌ 提现 (安全考虑)
5. 复制以下信息：
   - API Key
   - Secret Key
   - Passphrase (创建API时设置的口令)

## ⚠️ 安全提醒

1. **永远不要**在代码中硬编码API密钥
2. **不要**将 `.env.local` 文件提交到Git
3. **建议**为API设置IP白名单
4. **定期**轮换API密钥
5. **只给**必要的最小权限

## 🧪 测试验证

运行测试工具验证配置是否正确：

```bash
go run test_okx_from_db.go
```

预期输出：
```
✅ 余额获取成功！
📈 账户余额详情:
  总资产: 100.00000000 USDT
  已用: 0.00000000 USDT
  可用: 100.00000000 USDT
```

## 🔍 故障排除

### 错误1: "API Key为空"
- 检查 `.env.local` 是否正确设置
- 确保没有多余的空格或引号
- 重启应用让环境变量生效

### 错误2: "获取余额失败: ..."
- 检查API Key权限是否包含"读取"
- 验证Secret Key和Passphrase是否正确
- 检查网络连接

### 错误3: "账户余额为0"
- 这是正常现象，说明账户确实没有资金
- 检查OKX账户是否有可用余额

## 📊 架构说明

```
配置存储:
┌─────────────┐
│ .env.local  │ ← 环境变量（开发用）
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   config.db │ ← 数据库（生产用）
│  exchanges  │ ← 存储API配置
└─────────────┘
       │
       ▼
┌─────────────┐
│ okx_trader  │ ← 调用OKX API
└─────────────┘
```

配置加载优先级：
1. 环境变量（如果全部设置）
2. 数据库配置
3. 错误退出

## 🎯 总结

问题解决步骤：
1. ✅ 确认问题：API配置为空
2. ✅ 定位原因：数据库中OKX凭证缺失
3. ✅ 提供方案：环境变量、SQL更新、自动化脚本
4. ✅ 验证修复：运行测试工具

哥，现在你只需要填入真实的OKX API凭证，余额就会正确显示了！
