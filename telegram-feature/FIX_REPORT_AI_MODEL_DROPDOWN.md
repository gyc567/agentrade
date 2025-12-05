# 修复报告：AI 模型下拉菜单无选项问题

## 问题描述
用户登录后，配置 AI 大模型时，下拉菜单没有显示任何选项。

## 调查过程

### 调查的三个可能原因

| 可能原因 | 调查结果 | 结论 |
|----------|----------|------|
| **1. 数据库中没有 AI 模型数据** | 数据库有记录，但 `user_id = 'default'` | ❌ 部分正确 |
| **2. API 查询使用错误的 userID** | Admin 模式下使用 `user_id = 'admin'`，数据库无 admin 记录 | ✅ **根本原因** |
| **3. 前端处理 API 响应错误** | 前端逻辑正确，问题在后端数据 | ❌ 排除 |

### 根本原因分析

问题在于数据库表结构设计：

```sql
-- ai_models 表主键只有 id (单列)
PRIMARY KEY (id)

-- exchanges 表主键是复合主键 (id, user_id)
PRIMARY KEY (id, user_id)
```

这导致：
- `exchanges` 表可以为每个用户存储相同 exchange_id 的记录 → **交易所下拉菜单正常**
- `ai_models` 表只能存储一条相同 model_id 的记录 → **AI模型下拉菜单为空**

在 admin 模式下：
1. `authMiddleware` 设置 `user_id = "admin"`
2. `handleGetModelConfigs` 使用 `user_id` 查询 AI 模型
3. 数据库中没有 `user_id = 'admin'` 的 AI 模型记录
4. API 返回空数组 `[]`

## 修复方案

### 1. 修改表结构定义

```go
// 修改前：单主键
`CREATE TABLE IF NOT EXISTS ai_models (
        id TEXT PRIMARY KEY,
        ...
)`

// 修改后：复合主键
`CREATE TABLE IF NOT EXISTS ai_models (
        id TEXT NOT NULL,
        user_id TEXT NOT NULL DEFAULT 'default',
        ...
        PRIMARY KEY (id, user_id)
)`
```

### 2. 添加安全迁移逻辑

新增 `migrateAIModelsTable()` 函数，使用 RENAME 策略确保数据安全：

```go
func (d *Database) migrateAIModelsTable() error {
    // 1. 检查是否有之前迁移失败的备份，自动恢复
    // 2. ALTER TABLE ai_models RENAME TO ai_models_old (原子操作)
    // 3. CREATE TABLE ai_models (..., PRIMARY KEY (id, user_id))
    // 4. INSERT INTO ai_models ... SELECT ... FROM ai_models_old
    // 5. DROP TABLE ai_models_old
    // 
    // 每一步失败都有回滚逻辑，确保数据不丢失
}
```

### 3. 更新初始化逻辑

```go
// 修改前：只为 default 用户创建
for _, model := range aiModels {
    d.exec(`INSERT ... VALUES ($1, 'default', ...) ON CONFLICT (id) DO NOTHING`)
}

// 修改后：为 default 和 admin 用户都创建
modelUsers := []string{"default", "admin"}
for _, userID := range modelUsers {
    for _, model := range aiModels {
        d.exec(`INSERT ... VALUES ($1, $2, ...) ON CONFLICT (id, user_id) DO NOTHING`)
    }
}
```

## 修改的文件

| 文件 | 修改内容 |
|------|----------|
| `config/database.go` | 1. 修改 ai_models 表结构定义使用复合主键<br>2. 添加 migrateAIModelsTable() 迁移函数<br>3. 更新 initDefaultData() 为多用户初始化 AI 模型 |

## 验证结果

### 修复前
```bash
$ curl http://localhost:8080/api/models
[]
```

### 修复后
```bash
$ curl http://localhost:8080/api/models
[
  {"id":"deepseek","user_id":"admin","name":"DeepSeek","provider":"deepseek",...},
  {"id":"qwen","user_id":"admin","name":"Qwen","provider":"qwen",...}
]
```

### 数据库状态
```sql
SELECT id, user_id, name FROM ai_models ORDER BY user_id, id;

id       | user_id | name
---------|---------|----------
deepseek | admin   | DeepSeek
qwen     | admin   | Qwen
deepseek | default | DeepSeek
qwen     | default | Qwen
...      | ...     | ...
```

## 迁移安全性

迁移逻辑采用以下安全措施：

1. **原子重命名**：使用 `ALTER TABLE RENAME` 而非 `DROP` + `CREATE`
2. **失败回滚**：每一步失败都会恢复原表
3. **崩溃恢复**：检测遗留的 `ai_models_old` 表并自动恢复
4. **数据完整性**：先完成所有迁移步骤，最后才删除备份表

## 部署说明

修复已在开发环境验证通过。要将修复部署到生产环境：

1. 点击 Replit 的 **"Publish"** 按钮
2. 选择 **Reserved VM** 部署类型
3. 点击 **Publish**

迁移将在应用启动时自动执行。

## 日期
2025-11-29
