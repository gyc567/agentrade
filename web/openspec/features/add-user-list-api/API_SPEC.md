# 用户列表查询API - 详细规范

## 基本信息

- **HTTP方法**: `GET`
- **URL路径**: `/api/users`
- **认证**: Bearer Token（必需）
- **权限**: 管理员（`is_admin = true`）
- **内容类型**: `application/json`

## 请求头

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## 查询参数

| 参数名 | 类型 | 位置 | 必需 | 默认值 | 最大值 | 说明 |
|--------|------|------|------|--------|--------|------|
| page | integer | query | 否 | 1 | - | 页码，从1开始 |
| limit | integer | query | 否 | 50 | 100 | 每页返回数量 |
| search | string | query | 否 | - | - | 邮箱搜索关键词（可选）|
| sort | string | query | 否 | created_at | - | 排序字段（created_at, email）|
| order | string | query | 否 | desc | - | 排序方向（asc, desc）|

### 参数详细说明

#### page
- **类型**: integer
- **默认**: 1
- **示例**: `?page=1`

#### limit
- **类型**: integer
- **默认**: 50
- **最大值**: 100
- **示例**: `?limit=20`

#### search
- **类型**: string
- **模式**: 邮箱模糊匹配
- **示例**: `?search=gmail` （查找包含"gmail"的邮箱）

#### sort
- **类型**: string
- **可选值**: `created_at`, `email`
- **默认**: `created_at`
- **示例**: `?sort=email`

#### order
- **类型**: string
- **可选值**: `asc`, `desc`
- **默认**: `desc`
- **示例**: `?order=asc`

## 完整请求示例

```bash
# 基础查询（第一页，每页50条，按创建时间降序）
curl -X GET "https://nofx-gyc567.replit.app/api/users" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"

# 分页查询
curl -X GET "https://nofx-gyc567.replit.app/api/users?page=2&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"

# 搜索和排序
curl -X GET "https://nofx-gyc567.replit.app/api/users?search=gmail&sort=email&order=asc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

## 响应结构

### 成功响应（200 OK）

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "string (uuid)",
        "email": "string (email)",
        "is_active": "boolean",
        "is_admin": "boolean",
        "otp_verified": "boolean",
        "created_at": "string (ISO 8601 timestamp)",
        "updated_at": "string (ISO 8601 timestamp)"
      }
    ],
    "pagination": {
      "page": "integer",
      "limit": "integer",
      "total": "integer",
      "total_pages": "integer",
      "has_next": "boolean",
      "has_prev": "boolean"
    }
  },
  "message": "string"
}
```

### 响应字段说明

#### users 数组
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | string | 用户唯一标识符（UUID） |
| email | string | 用户邮箱地址 |
| is_active | boolean | 账户是否激活 |
| is_admin | boolean | 是否为管理员 |
| otp_verified | boolean | 是否已验证OTP |
| created_at | string | 账户创建时间（ISO 8601格式） |
| updated_at | string | 最后更新时间（ISO 8601格式）|

#### pagination 对象
| 字段名 | 类型 | 说明 |
|--------|------|------|
| page | integer | 当前页码 |
| limit | integer | 每页数量 |
| total | integer | 总记录数 |
| total_pages | integer | 总页数 |
| has_next | boolean | 是否有下一页 |
| has_prev | boolean | 是否有上一页 |

### 错误响应（401 Unauthorized）

```json
{
  "success": false,
  "error": "未认证的访问"
}
```

**说明**: 未提供或无效的认证token

### 错误响应（403 Forbidden）

```json
{
  "success": false,
  "error": "权限不足，需要管理员权限"
}
```

**说明**: 当前用户不是管理员

### 错误响应（400 Bad Request）

```json
{
  "success": false,
  "error": "参数错误：limit不能超过100"
}
```

**说明**: 请求参数不符合要求

## HTTP状态码

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | OK | 请求成功，返回用户列表 |
| 400 | Bad Request | 参数错误或无效 |
| 401 | Unauthorized | 未认证或token无效 |
| 403 | Forbidden | 无管理员权限 |
| 500 | Internal Server Error | 服务器内部错误 |

## 示例响应

### 空列表
```json
{
  "success": true,
  "data": {
    "users": [],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 0,
      "total_pages": 0,
      "has_next": false,
      "has_prev": false
    }
  },
  "message": "获取用户列表成功"
}
```

### 完整列表
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
        "created_at": "2025-11-11T08:00:00Z",
        "updated_at": "2025-11-11T08:00:00Z"
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

## 性能考虑

### 分页策略
- **默认限制**: 50条记录
- **最大限制**: 100条记录
- **原因**: 防止查询过载，保证API响应速度

### 索引建议
```sql
-- 为提升查询性能，建议在以下字段创建索引：
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_admin ON users(is_admin);
```

## 监控指标

### API指标
- 请求次数
- 平均响应时间
- 错误率（按状态码分类）
- 分页使用分布

### 业务指标
- 用户总数
- 活跃用户数
- 新增用户数（按日期统计）
- 管理员数量

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2025-11-23 | v1.0 | 初始版本，创建用户列表查询API |
