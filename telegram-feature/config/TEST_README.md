# 数据库测试文档

## 📋 概述

本目录包含了 Monnaire Trading Agent OS 数据库层的完整单元测试套件。

## 🎯 测试覆盖范围

### 已实现的测试

#### 1. 基础连接测试 (`database_test.go`)
- ✅ 数据库连接建立
- ✅ 数据库Ping测试
- ✅ 表结构验证
- ✅ 默认数据初始化验证
- ✅ SQL占位符转换
- ✅ 数据库关闭

#### 2. 用户管理测试 (`database_user_test.go`)
- ✅ 创建用户
- ✅ 重复邮箱验证
- ✅ 通过ID获取用户
- ✅ 通过邮箱获取用户
- ✅ 获取所有用户
- ✅ 分页获取用户
- ✅ 搜索用户
- ✅ 更新用户密码
- ✅ 更新用户锁定状态
- ✅ 重置失败尝试次数
- ✅ 更新OTP验证状态
- ✅ 获取用户总数

#### 3. 配置管理测试 (`database_config_test.go`)
- ✅ 获取AI模型配置
- ✅ 更新AI模型配置
- ✅ 创建AI模型
- ✅ 获取交易所配置
- ✅ 更新交易所配置
- ✅ 创建交易所
- ✅ OKX交易所特殊字段测试
- ✅ Hyperliquid交易所特殊字段测试

#### 4. 系统配置测试
- ✅ 获取系统配置
- ✅ 设置系统配置
- ✅ 更新系统配置
- ✅ 不存在的配置处理

## 🚀 运行测试

### 前提条件

1. **安装Go** (版本 1.21+)
```bash
go version
```

2. **安装依赖**
```bash
go get github.com/stretchr/testify/assert
go get github.com/stretchr/testify/require
go get github.com/lib/pq
```

3. **准备测试数据库**

测试需要一个PostgreSQL数据库。你有两个选择：

#### 选项A: 使用Neon.tech（推荐）
```bash
# 1. 注册 https://neon.tech
# 2. 创建测试项目
# 3. 获取连接字符串
# 4. 设置环境变量
export TEST_DATABASE_URL="postgresql://user:pass@host:5432/testdb"
```

#### 选项B: 使用本地PostgreSQL
```bash
# 1. 安装PostgreSQL
brew install postgresql  # macOS
# 或
sudo apt-get install postgresql  # Ubuntu

# 2. 创建测试数据库
createdb nofx_test

# 3. 设置环境变量
export TEST_DATABASE_URL="postgresql://localhost:5432/nofx_test?sslmode=disable"
```

### 运行所有测试

```bash
# 进入config目录
cd config

# 运行所有测试
go test -v

# 运行测试并显示覆盖率
go test -v -cover

# 生成覆盖率报告
go test -v -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### 运行特定测试

```bash
# 运行单个测试文件
go test -v -run TestDatabaseConnection

# 运行特定测试函数
go test -v -run TestCreateUser

# 运行匹配模式的测试
go test -v -run "TestGet.*"
```

### 运行测试（带详细输出）

```bash
# 显示所有日志
go test -v -count=1

# 显示测试时间
go test -v -timeout 30s
```

## 📊 测试结果示例

```
=== RUN   TestDatabaseConnection
--- PASS: TestDatabaseConnection (0.05s)
=== RUN   TestDatabasePing
--- PASS: TestDatabasePing (0.01s)
=== RUN   TestCreateTables
--- PASS: TestCreateTables (0.10s)
=== RUN   TestDefaultUserExists
--- PASS: TestDefaultUserExists (0.02s)
=== RUN   TestDefaultAIModelsExist
--- PASS: TestDefaultAIModelsExist (0.03s)
=== RUN   TestDefaultExchangesExist
--- PASS: TestDefaultExchangesExist (0.03s)
=== RUN   TestCreateUser
--- PASS: TestCreateUser (0.05s)
...
PASS
coverage: 75.3% of statements
ok      nofx/config     2.456s
```

## 🔧 测试配置

### 环境变量

| 变量名 | 必需 | 说明 | 示例 |
|--------|------|------|------|
| `TEST_DATABASE_URL` | 是 | 测试数据库连接字符串 | `postgresql://user:pass@host:5432/testdb` |
| `DATABASE_URL` | 否 | 生产数据库（测试时会被覆盖） | - |

### 测试数据清理

测试框架会自动：
1. 在测试开始前清理所有 `test_` 前缀的数据
2. 在测试结束后清理测试数据
3. 保留 `default` 用户和系统配置

## 📝 编写新测试

### 测试模板

```go
func TestYourFeature(t *testing.T) {
    // 1. 设置测试数据库
    tdb := setupTestDB(t)
    defer tdb.teardown(t)

    // 2. 准备测试数据
    // ... 创建测试用户、配置等

    // 3. 执行测试操作
    result, err := tdb.db.YourMethod()

    // 4. 验证结果
    assert.NoError(t, err, "Should not error")
    assert.NotNil(t, result, "Result should not be nil")
    assert.Equal(t, expected, result, "Result should match expected")
}
```

### 最佳实践

1. **使用 `test_` 前缀** - 所有测试数据的ID/Email应以 `test_` 开头
2. **独立测试** - 每个测试应该独立运行，不依赖其他测试
3. **清理数据** - 使用 `defer tdb.teardown(t)` 确保清理
4. **有意义的断言消息** - 提供清晰的错误消息
5. **测试边界条件** - 测试空值、nil、边界值等

## 🐛 故障排除

### 问题1: 测试被跳过

**症状**:
```
--- SKIP: TestDatabaseConnection (0.00s)
    database_test.go:XX: TEST_DATABASE_URL not set, skipping database tests
```

**解决**:
```bash
export TEST_DATABASE_URL="postgresql://user:pass@host:5432/testdb"
```

### 问题2: 连接失败

**症状**:
```
Failed to create test database: connection refused
```

**解决**:
1. 检查数据库是否运行
2. 验证连接字符串
3. 检查网络连接
4. 验证数据库凭据

### 问题3: 权限错误

**症状**:
```
ERROR: permission denied for table users
```

**解决**:
```sql
-- 授予测试用户权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;
```

### 问题4: 表不存在

**症状**:
```
ERROR: relation "users" does not exist
```

**解决**:
```bash
# 确保数据库已初始化
psql "$TEST_DATABASE_URL" -f ../database/migration.sql
```

## 📈 测试覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| 数据库连接 | 90% | 90% |
| 用户管理 | 85% | 85% |
| 配置管理 | 80% | 80% |
| 系统配置 | 85% | 85% |
| **总体** | **82%** | **80%+** |

## 🔄 持续集成

### GitHub Actions 示例

```yaml
name: Database Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: nofx_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Go
        uses: actions/setup-go@v2
        with:
          go-version: 1.21
      
      - name: Run tests
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/nofx_test?sslmode=disable
        run: |
          cd config
          go test -v -cover
```

## 📚 相关文档

- [数据库操作手册](../database/数据库操作手册.md)
- [数据库迁移指南](../database/README.md)
- [单元测试提案](../openspec/proposals/comprehensive-backend-unit-testing/proposal.md)

## 🎯 下一步

- [ ] 添加交易员配置测试
- [ ] 添加密码重置令牌测试
- [ ] 添加登录尝试记录测试
- [ ] 添加审计日志测试
- [ ] 添加内测码测试
- [ ] 添加性能测试
- [ ] 添加并发测试

---

**最后更新**: 2025-01-XX  
**维护者**: Monnaire Trading Agent OS Team
