# 实施任务清单

## Phase 0: 安全加固（架构审查新增 - P0 优先级）

### 任务 0.1: 输入验证
- [ ] 在 Handler 层添加参数验证中间件
- [ ] 验证积分数量为正整数
- [ ] 验证调整原因长度 2-200 字符
- [ ] 编写验证逻辑单元测试

### 任务 0.2: 频率限制
- [ ] 实现 Redis 或内存频率限制器
- [ ] 配置积分操作限制：每分钟 10 次
- [ ] 配置管理员操作限制：每分钟 30 次
- [ ] 编写频率限制单元测试

### 任务 0.3: 审计日志
- [ ] 在 `AdjustUserCredits` 中添加审计日志记录
- [ ] 记录成功和失败的管理员操作
- [ ] 确保审计日志包含 IP 地址、用户代理
- [ ] 编写审计日志单元测试

---

## Phase 1: 数据库设计 (Day 1)

### 任务 1.1: 创建迁移脚本
- [ ] 创建目录 `database/migrations/20251201_credits/`
- [ ] 编写 `001_create_tables.sql`
- [ ] 添加复合索引 `idx_credit_transactions_user_created`（架构审查优化）
- [ ] 编写回滚脚本 `001_rollback.sql`
- [ ] 本地测试迁移脚本

### 任务 1.2: 验证数据库设计
- [ ] 在本地 PostgreSQL 执行迁移
- [ ] 验证表结构正确
- [ ] 验证默认数据插入
- [ ] 验证外键约束

---

## Phase 2: Repository 层 (Day 2)

### 任务 2.1: 创建数据模型
- [ ] 创建 `internal/credits/models.go`
- [ ] 定义 `CreditPackage` 结构体
- [ ] 定义 `UserCredits` 结构体
- [ ] 定义 `CreditTransaction` 结构体

### 任务 2.2: 实现 Repository
- [ ] 创建 `internal/credits/repository.go`
- [ ] 实现 `GetActivePackages`
- [ ] 实现 `GetPackageByID`
- [ ] 实现 `GetUserCredits`
- [ ] 实现 `CreateUserCredits`
- [ ] 实现 `UpdateUserCredits`
- [ ] 实现 `CreateTransaction`
- [ ] 实现 `GetUserTransactions`

### 任务 2.3: Repository 测试
- [ ] 创建 `internal/credits/repository_test.go`
- [ ] 测试套餐查询
- [ ] 测试用户积分 CRUD
- [ ] 测试流水记录
- [ ] 验证覆盖率 >= 90%

---

## Phase 3: Service 层 (Day 3)

### 任务 3.1: 实现 Service
- [ ] 创建 `internal/credits/service.go`
- [ ] 实现 `GetActivePackages`
- [ ] 实现 `GetUserCredits`
- [ ] 实现 `AddCredits` (事务)
- [ ] 实现 `DeductCredits` (事务)
- [ ] 实现 `HasEnoughCredits`
- [ ] 实现 `GetUserTransactions`
- [ ] 实现 `AdjustUserCredits`

### 任务 3.2: Service 测试
- [ ] 创建 `internal/credits/service_test.go`
- [ ] 测试增加积分
- [ ] 测试扣减积分（充足/不足）
- [ ] 测试余额为0时扣减（架构审查新增边界测试）
- [ ] 测试数据库连接失败场景（架构审查新增异常测试）
- [ ] 测试并发扣减
- [ ] 测试管理员调整
- [ ] 测试审计日志记录（架构审查新增）
- [ ] 验证覆盖率 >= 95%

---

## Phase 4: Handler 层 (Day 4)

### 任务 4.1: 实现 Handler
- [ ] 创建 `internal/credits/handler.go`
- [ ] 实现输入参数验证（架构审查 P0）
- [ ] 集成频率限制中间件（架构审查 P0）
- [ ] 实现 `GET /api/v1/credit-packages`
- [ ] 实现 `GET /api/v1/credit-packages/:id`
- [ ] 实现 `GET /api/v1/user/credits`
- [ ] 实现 `GET /api/v1/user/credits/transactions`
- [ ] 实现 `POST /api/v1/admin/credit-packages`
- [ ] 实现 `PUT /api/v1/admin/credit-packages/:id`
- [ ] 实现 `DELETE /api/v1/admin/credit-packages/:id`
- [ ] 实现 `POST /api/v1/admin/users/:id/credits/adjust`

### 任务 4.2: 路由注册
- [ ] 在主路由添加积分模块路由
- [ ] 配置认证中间件
- [ ] 配置管理员权限中间件

### 任务 4.3: Handler 测试
- [ ] 创建 `internal/credits/handler_test.go`
- [ ] 测试套餐列表 API
- [ ] 测试用户积分 API
- [ ] 测试管理员 API
- [ ] 测试输入验证拦截（架构审查新增）
- [ ] 测试频率限制触发（架构审查新增）
- [ ] 测试权限控制
- [ ] 验证覆盖率 >= 85%

---

## Phase 5: 前端集成 (Day 5)

### 任务 5.1: API 客户端
- [ ] 添加积分相关 API 调用函数
- [ ] 定义 TypeScript 类型

### 任务 5.2: 用户积分展示
- [ ] 在用户信息区域添加积分显示
- [ ] 添加积分余额组件

### 任务 5.3: i18n 翻译
- [ ] 添加中文翻译
- [ ] 添加英文翻译
- [ ] 添加俄文翻译
- [ ] 添加乌克兰文翻译

### 任务 5.4: 联调测试
- [ ] 端到端测试
- [ ] 修复发现的问题

---

## 验收检查清单

### 功能验收
- [ ] 套餐列表正确返回
- [ ] 用户积分余额正确显示
- [ ] 积分增减操作正确
- [ ] 流水记录完整
- [ ] 管理员功能正常

### 安全验收（架构审查新增）
- [ ] 输入验证：所有 API 端点参数验证通过
- [ ] 频率限制：积分操作每分钟不超过10次
- [ ] 审计日志：管理员操作100%记录
- [ ] SQL 注入：使用参数化查询
- [ ] 权限控制：用户只能操作自己的积分

### 质量验收
- [ ] Repository 测试覆盖率 >= 90%
- [ ] Service 测试覆盖率 >= 95%
- [ ] Handler 测试覆盖率 >= 85%
- [ ] 无 P0/P1 Bug
- [ ] API 响应时间 < 100ms

### 兼容性验收
- [ ] 现有功能不受影响
- [ ] 现有测试全部通过
- [ ] 数据库迁移可回滚

---

## 依赖关系

```
Phase 0 (Security) ──► Phase 1 (DB)
                           │
                           ▼
                      Phase 2 (Repository) ──► Phase 3 (Service) ──► Phase 4 (Handler)
                                                                          │
                                                                          ▼
                                                                   Phase 5 (Frontend)
```

---

## 优先级说明

| 优先级 | 任务 | 说明 |
|--------|------|------|
| **P0** | Phase 0 安全加固 | 必须在其他开发前完成 |
| **P1** | Phase 1-4 核心开发 | 按顺序执行 |
| **P2** | Phase 5 前端集成 | 可并行开发 |
