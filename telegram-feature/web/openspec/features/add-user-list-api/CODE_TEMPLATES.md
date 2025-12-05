# 用户列表查询API - 代码模板

## 📝 数据库层代码模板

### 模板1: GetUsers 方法实现

```go
// GetUsers 获取用户列表（分页、搜索、排序）
func (d *Database) GetUsers(page, limit int, search, sort, order string) ([]*User, int, error) {
    // 参数验证
    if limit > 100 {
        limit = 100
    }
    if page < 1 {
        page = 1
    }

    // 计算偏移量
    offset := (page - 1) * limit

    // 验证排序字段
    validSortFields := map[string]bool{
        "created_at": true,
        "email":      true,
    }
    if !validSortFields[sort] {
        sort = "created_at"
    }

    // 验证排序方向
    if order != "asc" && order != "desc" {
        order = "desc"
    }

    // 构建SQL查询
    var args []interface{}
    sql := `
        SELECT id, email, is_active, is_admin, otp_verified,
               created_at, updated_at
        FROM users
    `

    // 添加搜索条件
    if search != "" {
        sql += " WHERE email LIKE ?"
        args = append(args, "%"+search+"%")
    }

    // 添加排序
    sql += fmt.Sprintf(" ORDER BY %s %s", sort, order)

    // 添加分页
    sql += " LIMIT ? OFFSET ?"
    args = append(args, limit, offset)

    // 执行查询
    rows, err := d.db.Query(sql, args...)
    if err != nil {
        return nil, 0, fmt.Errorf("查询用户列表失败: %w", err)
    }
    defer rows.Close()

    // 处理结果
    var users []*User
    for rows.Next() {
        user := &User{}
        err := rows.Scan(
            &user.ID,
            &user.Email,
            &user.IsActive,
            &user.IsAdmin,
            &user.OTPVerified,
            &user.CreatedAt,
            &user.UpdatedAt,
        )
        if err != nil {
            return nil, 0, fmt.Errorf("扫描用户数据失败: %w", err)
        }
        users = append(users, user)
    }

    // 获取总数
    total, err := d.GetUserCount(search)
    if err != nil {
        return nil, 0, fmt.Errorf("获取用户总数失败: %w", err)
    }

    return users, total, nil
}
```

### 模板2: GetUserCount 方法实现

```go
// GetUserCount 获取用户总数
func (d *Database) GetUserCount(search string) (int, error) {
    var count int
    sql := "SELECT COUNT(*) FROM users"

    // 添加搜索条件
    if search != "" {
        sql += " WHERE email LIKE ?"
        row := d.db.QueryRow(sql, "%"+search+"%")
        err := row.Scan(&count)
        if err != nil {
            return 0, fmt.Errorf("获取用户总数失败: %w", err)
        }
    } else {
        row := d.db.QueryRow(sql)
        err := row.Scan(&count)
        if err != nil {
            return 0, fmt.Errorf("获取用户总数失败: %w", err)
        }
    }

    return count, nil
}
```

## 📝 API层代码模板

### 模板3: handleGetUsers 处理器实现

```go
// handleGetUsers 处理获取用户列表请求
func (s *Server) handleGetUsers(c *gin.Context) {
    // 解析参数
    page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
    if err != nil || page < 1 {
        page = 1
    }

    limit, err := strconv.Atoi(c.DefaultQuery("limit", "50"))
    if err != nil || limit < 1 {
        limit = 50
    }
    if limit > 100 {
        limit = 100
    }

    search := c.Query("search")
    sort := c.DefaultQuery("sort", "created_at")
    order := c.DefaultQuery("order", "desc")

    // 验证排序字段
    validSortFields := []string{"created_at", "email"}
    sortValid := false
    for _, field := range validSortFields {
        if sort == field {
            sortValid = true
            break
        }
    }
    if !sortValid {
        sort = "created_at"
    }

    // 验证排序方向
    if order != "asc" && order != "desc" {
        order = "desc"
    }

    // 权限检查
    user, exists := c.Get("user")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{
            "success": false,
            "error":   "未认证的访问",
        })
        return
    }

    currentUser := user.(*config.User)
    if !currentUser.IsAdmin {
        c.JSON(http.StatusForbidden, gin.H{
            "success": false,
            "error":   "权限不足，需要管理员权限",
        })
        return
    }

    // 调用数据库方法
    users, total, err := s.database.GetUsers(page, limit, search, sort, order)
    if err != nil {
        log.Printf("获取用户列表失败: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error":   "获取用户列表失败",
        })
        return
    }

    // 计算分页信息
    totalPages := (total + limit - 1) / limit // 向上取整
    hasNext := page < totalPages
    hasPrev := page > 1

    // 构建响应
    response := gin.H{
        "users": users,
        "pagination": gin.H{
            "page":       page,
            "limit":      limit,
            "total":      total,
            "total_pages": totalPages,
            "has_next":   hasNext,
            "has_prev":   hasPrev,
        },
    }

    // 记录访问日志
    log.Printf("管理员 %s 查询用户列表 (page=%d, limit=%d, search=%s, sort=%s, order=%s)",
        currentUser.Email, page, limit, search, sort, order)

    // 返回响应
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    response,
        "message": "获取用户列表成功",
    })
}
```

### 模板4: 路由注册代码

```go
// 在 setupRoutes 函数中添加
func (s *Server) setupRoutes() {
    // ... 现有代码 ...

    // 需要认证的路由
    protected := api.Group("/", s.authMiddleware())
    {
        // ... 现有路由 ...

        // 用户管理
        protected.GET("/users", s.handleGetUsers) // 新增
        // 后续可以添加：
        // protected.GET("/users/:id", s.handleGetUserByID)
        // protected.PUT("/users/:id", s.handleUpdateUser)
        // protected.DELETE("/users/:id", s.handleDeleteUser)
    }
}
```

## 📝 辅助函数模板

### 模板5: 参数解析函数

```go
// parseInt 解析整数参数
func parseInt(value string, defaultValue int) int {
    if value == "" {
        return defaultValue
    }
    if intVal, err := strconv.Atoi(value); err == nil {
        return intVal
    }
    return defaultValue
}

// parseString 解析字符串参数
func parseString(value, defaultValue string) string {
    if value == "" {
        return defaultValue
    }
    return value
}

// validatePagination 验证分页参数
func validatePagination(page, limit int) (int, int) {
    if page < 1 {
        page = 1
    }
    if limit < 1 {
        limit = 50
    }
    if limit > 100 {
        limit = 100
    }
    return page, limit
}
```

## 📝 单元测试模板

### 模板6: 数据库方法测试

```go
func TestDatabase_GetUsers(t *testing.T) {
    // 创建测试数据库
    db, err := setupTestDatabase()
    if err != nil {
        t.Fatalf("创建测试数据库失败: %v", err)
    }
    defer cleanupTestDatabase(db)

    // 创建测试用户
    createTestUsers(db, 5)

    // 测试用例1: 获取用户列表（默认参数）
    users, total, err := db.GetUsers(1, 50, "", "created_at", "desc")
    assert.NoError(t, err)
    assert.Equal(t, 5, total)
    assert.Equal(t, 5, len(users))

    // 测试用例2: 分页查询
    users, total, err = db.GetUsers(1, 2, "", "created_at", "desc")
    assert.NoError(t, err)
    assert.Equal(t, 5, total)
    assert.Equal(t, 2, len(users))

    // 测试用例3: 搜索查询
    users, total, err = db.GetUsers(1, 50, "test", "created_at", "desc")
    assert.NoError(t, err)
    // 期望返回包含"test"的用户

    // 测试用例4: 排序测试
    users, total, err = db.GetUsers(1, 50, "", "email", "asc")
    assert.NoError(t, err)
    assert.Equal(t, 5, len(users))

    // 测试用例5: 边界测试（limit超过最大值）
    users, total, err = db.GetUsers(1, 200, "", "created_at", "desc")
    assert.NoError(t, err)
    // 应该自动限制为100

    // 测试用例6: 无效排序字段
    users, total, err = db.GetUsers(1, 50, "", "invalid_field", "desc")
    assert.NoError(t, err)
    // 应该使用默认排序字段
}

func TestDatabase_GetUserCount(t *testing.T) {
    db, err := setupTestDatabase()
    if err != nil {
        t.Fatalf("创建测试数据库失败: %v", err)
    }
    defer cleanupTestDatabase(db)

    // 创建测试用户
    createTestUsers(db, 10)

    // 测试用例1: 总数查询
    count, err := db.GetUserCount("")
    assert.NoError(t, err)
    assert.Equal(t, 10, count)

    // 测试用例2: 搜索查询
    count, err := db.GetUserCount("test")
    assert.NoError(t, err)
    // 期望返回包含"test"的用户数量
}
```

### 模板7: API处理器测试

```go
func TestServer_handleGetUsers(t *testing.T) {
    // 创建测试服务器
    server := setupTestServer()

    // 创建管理员用户和token
    adminUser, adminToken := createAdminUser(server.database)

    // 测试用例1: 正常访问（管理员）
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/api/users?page=1&limit=10", nil)
    req.Header.Set("Authorization", "Bearer "+adminToken)
    server.router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusOK, w.Code)
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    assert.Equal(t, true, response["success"])

    // 测试用例2: 未认证访问
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/api/users", nil)
    server.router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusUnauthorized, w.Code)

    // 测试用例3: 普通用户访问
    regularUser, regularToken := createRegularUser(server.database)
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/api/users", nil)
    req.Header.Set("Authorization", "Bearer "+regularToken)
    server.router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusForbidden, w.Code)

    // 测试用例4: 分页参数测试
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/api/users?page=2&limit=5", nil)
    req.Header.Set("Authorization", "Bearer "+adminToken)
    server.router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusOK, w.Code)

    // 测试用例5: 搜索参数测试
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/api/users?search=gmail", nil)
    req.Header.Set("Authorization", "Bearer "+adminToken)
    server.router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusOK, w.Code)

    // 测试用例6: 排序参数测试
    w = httptest.NewRecorder()
    req, _ = http.NewRequest("GET", "/api/users?sort=email&order=asc", nil)
    req.Header.Set("Authorization", "Bearer "+adminToken)
    server.router.ServeHTTP(w, req)

    assert.Equal(t, http.StatusOK, w.Code)
}
```

## 📝 集成测试脚本

### 模板8: Bash测试脚本

```bash
#!/bin/bash

# 测试用户列表API的Bash脚本

API_URL="https://nofx-gyc567.replit.app/api"
ADMIN_TOKEN="your_admin_token_here"

echo "========================================="
echo "用户列表API测试"
echo "========================================="

# 测试1: 健康检查（可选）
echo -e "\n1. 测试API健康状态..."
curl -s "${API_URL}/health" | jq '.'

# 测试2: 未认证访问
echo -e "\n2. 测试未认证访问（期望401）..."
curl -s -w "\nHTTP Status: %{http_code}\n" "${API_URL}/users"

# 测试3: 管理员访问（正常）
echo -e "\n3. 测试管理员访问（期望200）..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/users" | jq '.'

# 测试4: 分页查询
echo -e "\n4. 测试分页查询..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/users?page=1&limit=10" | jq '.data.pagination'

# 测试5: 搜索查询
echo -e "\n5. 测试搜索查询..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/users?search=gmail" | jq '.data.users | length'

# 测试6: 排序查询
echo -e "\n6. 测试排序查询..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/users?sort=email&order=asc" | jq '.data.users[0].email'

# 测试7: 无效排序字段
echo -e "\n7. 测试无效排序字段（期望400）..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/users?sort=invalid_field" | jq '.'

# 测试8: 限制查询
echo -e "\n8. 测试limit限制..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/users?limit=200" | jq '.data.pagination'

echo -e "\n========================================="
echo "测试完成"
echo "========================================="
```

## 📝 前端调用示例

### 模板9: JavaScript前端调用

```typescript
// 获取用户列表
async function fetchUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  sort?: 'created_at' | 'email';
  order?: 'asc' | 'desc';
} = {}) {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);

  const response = await fetch(`/api/users?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// 使用示例
try {
  const result = await fetchUsers({
    page: 1,
    limit: 20,
    search: 'gmail',
    sort: 'email',
    order: 'asc',
  });

  console.log('用户列表:', result.data.users);
  console.log('分页信息:', result.data.pagination);
} catch (error) {
  console.error('获取用户列表失败:', error);
}
```

### 模板10: React Hook示例

```typescript
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  otp_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface UserListResponse {
  users: User[];
  pagination: Pagination;
}

export function useUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'created_at' | 'email';
    order?: 'asc' | 'desc';
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.order) queryParams.append('order', params.order);

      const response = await fetch(`/api/users?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    pagination,
    loading,
    error,
    fetchUsers,
  };
}
```

## 📝 错误处理最佳实践

### 模板11: 统一错误响应

```go
// 错误响应结构
type APIError struct {
    Success bool   `json:"success"`
    Error   string `json:"error"`
}

// 辅助函数：发送错误响应
func sendError(c *gin.Context, statusCode int, message string) {
    c.JSON(statusCode, APIError{
        Success: false,
        Error:   message,
    })
}

// 使用示例
func (s *Server) handleGetUsers(c *gin.Context) {
    // ... 权限检查 ...
    if !currentUser.IsAdmin {
        sendError(c, http.StatusForbidden, "权限不足，需要管理员权限")
        return
    }

    // ... 参数验证 ...
    if limit > 100 {
        sendError(c, http.StatusBadRequest, "limit不能超过100")
        return
    }

    // ... 数据库操作 ...
    if err != nil {
        log.Printf("数据库错误: %v", err)
        sendError(c, http.StatusInternalServerError, "服务器内部错误")
        return
    }

    // ... 成功响应 ...
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data":    response,
        "message": "获取用户列表成功",
    })
}
```

## 📝 性能优化建议

### 模板12: 缓存中间件（可选）

```go
// 缓存中间件（可选，如果需要缓存用户列表）
func cacheMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 对于管理员的用户列表查询，可以添加简单的内存缓存
        // 缓存时间：30秒
        // 这是一个示例，实际使用需要更完善的缓存机制

        if strings.Contains(c.Request.URL.Path, "/users") {
            // 检查缓存
            // ...
        }

        c.Next()
    }
}
```

---

## 📌 使用说明

1. **复制代码模板**: 根据需要复制相应的代码模板
2. **替换占位符**: 将模板中的占位符（如 `___`）替换为实际代码
3. **调整参数**: 根据实际需求调整参数和逻辑
4. **运行测试**: 使用提供的测试模板验证功能
5. **代码审查**: 确保代码符合项目规范

## ⚠️ 注意事项

1. **安全**: 确保所有用户输入都经过验证和转义
2. **性能**: 注意分页限制，避免一次查询过多数据
3. **错误处理**: 所有错误都应该被适当处理和记录
4. **日志**: 重要操作应该记录日志
5. **测试**: 所有功能都应该有相应的测试

---

**模板版本**: v1.0
**最后更新**: 2025-11-23
**维护人**: Claude Code
