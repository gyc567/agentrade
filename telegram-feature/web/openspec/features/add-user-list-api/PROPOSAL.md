# Feature提案：添加用户列表查询API接口

## 📋 功能概述

**功能名称**: 用户列表查询API
**提案日期**: 2025-11-23
**提案人**: Claude Code
**优先级**: P1 - 中高优先级
**预计工作量**: 1天

## 🎯 需求背景

### 当前问题
- 后端数据库中用户信息无法通过API查询
- 管理员无法通过前端界面查看已注册用户列表
- 缺乏用户管理和分析功能的数据支持
- 需要手动查询数据库才能获取用户信息

### 业务价值
1. **用户管理**: 管理员可以查看和管理所有注册用户
2. **数据分析**: 支持用户增长、活跃度等数据分析
3. **运营支持**: 方便客服和技术支持团队查询用户信息
4. **系统监控**: 了解系统用户规模和分布情况

## 🔧 技术方案

### API设计

#### 端点路径
```
GET /api/users
```

#### 认证要求
- **权限**: 仅管理员可访问（`is_admin = true`）
- **方式**: Bearer Token认证
- **中间件**: 使用现有的 `authMiddleware()` 保护

#### 请求参数
| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| page | int | 否 | 1 | 页码，从1开始 |
| limit | int | 否 | 50 | 每页返回数量，最大100 |
| search | string | 否 | - | 按邮箱搜索（可选） |
| sort | string | 否 | created_at | 排序字段（created_at, email） |
| order | string | 否 | desc | 排序方向（asc, desc） |

#### 请求示例
```bash
GET /api/users?page=1&limit=20&sort=created_at&order=desc
Authorization: Bearer <admin_token>
```

#### 响应格式
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_uuid",
        "email": "user@example.com",
        "is_active": true,
        "is_admin": false,
        "otp_verified": true,
        "created_at": "2025-11-23T10:00:00Z",
        "updated_at": "2025-11-23T10:00:00Z",
        "last_login": "2025-11-23T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  },
  "message": "获取用户列表成功"
}
```

#### 敏感信息过滤
为保护用户隐私，返回的用户信息**不包含**：
- 密码哈希
- OTP密钥
- 登录失败次数
- 账户锁定时间
- Beta码

## 🏗️ 实施计划

### 阶段1: 数据库方法实现（0.5天）

#### 1.1 在 `config/database.go` 中添加方法
```go
// GetUsers 获取用户列表（分页、搜索、排序）
func (d *Database) GetUsers(page, limit int, search, sort, order string) ([]*User, int, error)

// GetUserCount 获取用户总数
func (d *Database) GetUserCount(search string) (int, error)
```

#### 1.2 SQL查询设计
```sql
-- 基础查询
SELECT id, email, is_active, is_admin, otp_verified, created_at, updated_at
FROM users
WHERE 1=1

-- 搜索过滤
AND (email LIKE ? OR ? = "")

-- 排序
ORDER BY created_at DESC

-- 分页
LIMIT ? OFFSET ?
```

### 阶段2: API处理器实现（0.5天）

#### 2.1 在 `api/server.go` 中添加路由
```go
// 需要认证的路由
protected := api.Group("/", s.authMiddleware())
{
    // 用户列表（仅管理员）
    protected.GET("/users", s.handleGetUsers)
}
```

#### 2.2 实现 `handleGetUsers` 函数
- 验证管理员权限
- 参数解析和验证
- 调用数据库方法
- 格式化响应

### 阶段3: 测试验证（0.25天）

#### 3.1 单元测试
- 测试数据库查询方法
- 测试API响应格式

#### 3.2 集成测试
- 使用curl测试API
- 验证权限控制
- 测试分页功能

## 🔒 安全考虑

### 权限控制
1. **管理员限制**: 仅 `is_admin = true` 的用户可访问
2. **Token验证**: 必须提供有效的JWT Token
3. **中间件保护**: 使用现有的 `authMiddleware`

### 数据保护
1. **敏感信息过滤**: 不返回密码、OTP密钥等
2. **输入验证**: 严格验证搜索参数
3. **分页限制**: 最大限制100条记录，防止过载

### 访问日志
```go
log.Printf("管理员 %s 查询用户列表 (page=%d, limit=%d, search=%s)",
    user.Email, page, limit, search)
```

## 📊 响应示例

### 成功响应（200）
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "5249272d-fd31-42d8-9f62-59b1b6535993",
        "email": "gyc567@gmail.com",
        "is_active": true,
        "is_admin": false,
        "otp_verified": true,
        "created_at": "2025-11-23T09:47:52Z",
        "updated_at": "2025-11-23T09:47:52Z"
      },
      {
        "id": "admin",
        "email": "admin@test.com",
        "is_active": true,
        "is_admin": true,
        "otp_verified": true,
        "created_at": "2025-11-11T00:00:00Z",
        "updated_at": "2025-11-11T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2,
      "total_pages": 1,
      "has_next": false,
      "has_prev": false
    }
  },
  "message": "获取用户列表成功"
}
```

### 错误响应（401 - 未认证）
```json
{
  "success": false,
  "error": "未认证的访问"
}
```

### 错误响应（403 - 非管理员）
```json
{
  "success": false,
  "error": "权限不足，需要管理员权限"
}
```

### 错误响应（400 - 参数错误）
```json
{
  "success": false,
  "error": "参数错误：limit不能超过100"
}
```

## 🧪 测试用例

### 功能测试
1. **正常访问**: 使用管理员token获取用户列表
2. **分页测试**: 测试page和limit参数
3. **搜索测试**: 测试search参数过滤
4. **排序测试**: 测试asc和desc排序

### 权限测试
1. **未认证**: 无token返回401
2. **非管理员**: 普通用户返回403
3. **管理员**: 正常返回200

### 边界测试
1. **limit=0**: 使用默认值50
2. **limit>100**: 返回错误
3. **page>总数**: 返回空列表
4. **无效排序字段**: 返回错误

## 📝 实施检查清单

- [ ] 实现 `GetUsers` 数据库方法
- [ ] 实现 `GetUserCount` 数据库方法
- [ ] 添加API路由和中间件保护
- [ ] 实现 `handleGetUsers` 处理器
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 更新API文档
- [ ] 部署到生产环境
- [ ] 验证功能正常

## 🔄 相关变更

### 需要修改的文件
1. `/api/server.go` - 添加路由和处理器
2. `/config/database.go` - 添加查询方法
3. `/API_DOCUMENTATION.md` - 更新文档

### 向后兼容性
- ✅ 完全向后兼容
- ✅ 不影响现有API
- ✅ 不修改数据库结构

## 📈 后续扩展

### 可能的增强功能
1. **用户详情查询**: `GET /api/users/{id}`
2. **批量操作**: `POST /api/users/batch-action`
3. **导出功能**: `GET /api/users/export`
4. **用户统计**: `GET /api/users/stats`

---
**提案状态**: [待审批]
**预计开始时间**: 2025-11-24
**预计完成时间**: 2025-11-25
**负责人**: [待指派]
