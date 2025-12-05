# OKX交易所缺失问题修复指南

## 问题描述
前端页面 `/traders` → `Exchange` → `Add Exchange` → `Select Exchange` 下拉菜单中只显示3个交易所选项，缺少OKX交易所。

## 问题根因
1. API接口 `/api/supported-exchanges` 返回的数据中缺少OKX
2. 数据库文件 `config.db` 中的 `exchanges` 表缺少OKX记录
3. 表结构设计使用 `id` 作为 PRIMARY KEY，可能导致数据插入冲突

## 修复方案

### 方案一：直接SQL修复（推荐，最快）

在Replit控制台执行以下命令：

```bash
# 进入Replit项目目录
cd /home/runner/$(ls /home/runner | grep nofx)

# 执行SQL修复
sqlite3 config.db "INSERT OR IGNORE INTO exchanges (id, user_id, name, type, enabled) VALUES ('okx', 'default', 'OKX Futures', 'okx', 0);"

# 验证修复结果
sqlite3 config.db "SELECT id, name, type FROM exchanges WHERE user_id = 'default' ORDER BY id;"
```

预期结果应该显示4个交易所：
```
aster|Aster DEX|aster
binance|Binance Futures|binance
hyperliquid|Hyperliquid|hyperliquid
okx|OKX Futures|okx
```

### 方案二：使用修复脚本

在Replit控制台执行：

```bash
# 进入项目目录
cd /home/runner/$(ls /home/runner | grep nofx)

# 执行修复脚本
sqlite3 config.db < fix_okx_exchange.sql
```

### 方案三：重启服务（如果方案一不生效）

```bash
# 停止服务
pkill -f nofx-backend

# 重新启动服务
./nofx-backend &
```

## 验证修复

访问前端页面 https://web-pink-omega-40.vercel.app/traders

点击 "Exchanges" → "Add Exchange"，在 "Select Exchange" 下拉菜单中应该看到4个选项：
- Binance Futures (CEX)
- Hyperliquid (DEX)
- Aster DEX (DEX)
- **OKX Futures (CEX)** ← 新增

## 长期解决方案

修改 `config/database.go` 文件的 `initDefaultData` 函数（第343-361行），将 `INSERT OR IGNORE` 改为 `INSERT OR REPLACE`，确保即使有冲突也能正确插入数据：

```go
for _, exchange := range exchanges {
    _, err := d.db.Exec(`
        INSERT OR REPLACE INTO exchanges (id, user_id, name, type, enabled)
        VALUES (?, 'default', ?, ?, 0)
    `, exchange.id, exchange.name, exchange.typ)
    // ...
}
```

## 技术细节

### 数据库查询
API调用路径：
1. 前端调用 `api.getSupportedExchanges()`
2. 发送 GET 请求到 `/api/supported-exchanges`
3. 后端 `handleGetSupportedExchanges` 函数执行数据库查询
4. 从 `config.db` 的 `exchanges` 表查询 `user_id = 'default'` 的记录
5. 返回JSON响应

### 表结构
```sql
CREATE TABLE exchanges (
    id TEXT PRIMARY KEY,  -- 问题所在：应该使用 (id, user_id) 复合主键
    user_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    enabled BOOLEAN DEFAULT 0,
    -- ... 其他字段
);
```

### 默认数据初始化
在 `initDefaultData` 函数中定义了4个默认交易所：
1. binance
2. hyperliquid
3. aster
4. okx ← 目标交易所

但由于 `INSERT OR IGNORE` 和 PRIMARY KEY 冲突，OKX可能没有成功插入。

## 预防措施

1. **改进表结构**：将 PRIMARY KEY 从 `id` 改为 `(id, user_id)` 复合主键
2. **改进初始化逻辑**：使用 `INSERT OR REPLACE` 确保数据一致性
3. **添加数据验证**：在服务启动时验证默认数据的完整性
4. **数据库迁移脚本**：提供数据库结构升级和修复的工具

## 参考资源

- 数据库文件：`config.db`
- API端点：`GET /api/supported-exchanges`
- 后端代码：`api/server.go:1538`
- 数据库代码：`config/database.go:324`
