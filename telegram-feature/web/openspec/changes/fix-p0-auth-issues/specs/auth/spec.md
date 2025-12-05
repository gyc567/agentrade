# P0认证系统修复技术规范

## 1. 概述

本文档详细说明P0级别认证系统三个关键问题的技术修复方案。

## 2. 问题修复规范

### 2.1 重复密码验证代码修复

**位置**: `api/server.go` - `handleRegister`函数 (1274-1427行)

**问题代码**:
```go
// 第一次验证 (1292-1300行)
if len(req.Password) < 8 {
    c.JSON(http.StatusBadRequest, gin.H{
        "success": false,
        "error":   "密码强度不够",
        "details": "密码必须至少包含8个字符",
    })
    return
}

// ... 中间代码 ...

// 第二次验证 (1357-1365行) - 重复代码
if len(req.Password) < 8 {
    c.JSON(http.StatusBadRequest, gin.H{
        "success": false,
        "error":   "密码强度不够",
        "details": "密码必须至少包含8个字符",
    })
    return
}
```

**修复方案**:
1. 保留第一次验证 (1292-1300行)
2. 删除第二次验证 (1357-1365行)
3. 确保所有验证逻辑在创建用户前一次性完成

**验收标准**:
- ✅ `handleRegister`函数中仅有一处密码长度验证
- ✅ 验证逻辑在验证邮箱后立即执行
- ✅ 验证失败直接返回，不执行后续逻辑

### 2.2 CORS白名单配置

**位置**: `api/server.go` - `corsMiddleware`函数 (51-66行)

**当前代码**:
```go
func corsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
        c.Writer.Header().Set("Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers",
            "Content-Type, Authorization, Cache-Control, X-Requested-With, X-Requested-By, If-Modified-Since, Pragma")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusOK)
            return
        }

        c.Next()
    }
}
```

**修复方案**:
```go
func corsMiddleware() gin.HandlerFunc {
    // 从环境变量读取允许的域名列表
    allowedOrigins := []string{
        "http://localhost:3000",
        "http://localhost:5173",
        "https://your-frontend-domain.com",
    }

    return func(c *gin.Context) {
        origin := c.Request.Header.Get("Origin")

        // 检查origin是否在白名单中
        allowed := false
        for _, allowedOrigin := range allowedOrigins {
            if origin == allowedOrigin {
                allowed = true
                break
            }
        }

        if allowed {
            c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
        }

        c.Writer.Header().Set("Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS")
        c.Writer.Header().Set("Access-Control-Allow-Headers",
            "Content-Type, Authorization, Cache-Control, X-Requested-With, X-Requested-By, If-Modified-Since, Pragma")
        c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")

        if c.Request.Method == "OPTIONS" {
            c.AbortWithStatus(http.StatusOK)
            return
        }

        c.Next()
    }
}
```

**配置要求**:
- 环境变量: `ALLOWED_ORIGINS` (逗号分隔的域名列表)
- 默认值: 开发环境域名
- 支持通配符 (可选实现)

**验收标准**:
- ✅ 仅允许指定域名访问API
- ✅ 其他域名请求被拒绝 (无Access-Control-Allow-Origin头)
- ✅ 预检请求(OPTIONS)正常处理
- ✅ 凭证请求(Credentials)正常工作

### 2.3 AuthContext Token验证逻辑

**位置**: `web/src/contexts/AuthContext.tsx` (27-49行)

**当前代码**:
```typescript
useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
        try {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        } catch (error) {
            console.error('Failed to parse saved user data:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
    }
    setIsLoading(false);
}, []);
```

**修复方案**:
```typescript
useEffect(() => {
    const initAuth = async () => {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken && savedUser) {
            try {
                // 验证JWT token有效性
                const isValidToken = await validateToken(savedToken);

                if (!isValidToken) {
                    throw new Error('Invalid token');
                }

                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Failed to restore auth state:', error);
                // 清理无效数据
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                setToken(null);
                setUser(null);
            }
        }
        setIsLoading(false);
    };

    initAuth();
}, []);

// 辅助函数：验证token
const validateToken = async (token: string): Promise<boolean> => {
    try {
        // 简单的JWT解析检查
        const parts = token.split('.');
        if (parts.length !== 3) {
            return false;
        }

        // 解析payload
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp * 1000; // 转换为毫秒

        // 检查过期时间
        if (Date.now() >= exp) {
            return false;
        }

        // 进一步验证：发送请求到后端检查token
        try {
            const response = await fetch(`${API_BASE}/validate-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ token }),
            });

            return response.ok;
        } catch (e) {
            // 如果网络错误，基于本地检查返回
            return true;
        }
    } catch (error) {
        return false;
    }
};
```

**替代方案** (更简单):
```typescript
useEffect(() => {
    const initAuth = async () => {
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken && savedUser) {
            try {
                // 解析JWT payload检查过期时间
                const parts = savedToken.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1]));
                    const exp = payload.exp * 1000;

                    // 检查过期时间
                    if (Date.now() < exp) {
                        setToken(savedToken);
                        setUser(JSON.parse(savedUser));
                    } else {
                        throw new Error('Token expired');
                    }
                } else {
                    throw new Error('Invalid token format');
                }
            } catch (error) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                setToken(null);
                setUser(null);
            }
        }
        setIsLoading(false);
    };

    initAuth();
}, []);
```

**验收标准**:
- ✅ 无效token不会导致伪登录
- ✅ 过期token自动清理
- ✅ 恢复登录状态前验证token有效性
- ✅ 网络错误时采用降级策略

## 3. 测试规范

### 3.1 单元测试

**后端测试**:
```go
func TestHandleRegister(t *testing.T) {
    // 测试密码验证仅执行一次
    // 测试CORS配置正确
    // 测试重复注册保护
}
```

**前端测试**:
```typescript
describe('AuthContext', () => {
    test('should validate token on initialization', () => {
        // 测试token验证逻辑
    });

    test('should clear invalid token', () => {
        // 测试无效token清理
    });
});
```

### 3.2 集成测试

**测试用例**:
1. 注册新用户流程
2. 使用无效token访问API (应被拒绝)
3. 使用有效token访问API (应成功)
4. CORS预检请求
5. 跨域请求测试

### 3.3 安全测试

**检查项**:
- [ ] CORS策略正确实施
- [ ] 无token或无效token无法访问受保护资源
- [ ] 已过期token无法使用
- [ ] 无XSS/CSRF新漏洞

## 4. 部署规范

### 4.1 环境变量配置

**必需**:
```bash
# 后端 - API服务器
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://your-domain.com

# 可选
JWT_SECRET=your-jwt-secret-key
CORS_MAX_AGE=86400  # 24小时
```

### 4.2 配置验证

部署后验证:
```bash
# 检查CORS配置
curl -H "Origin: http://malicious-site.com" -X OPTIONS http://api-domain.com/api/login
# 应该没有Access-Control-Allow-Origin头

curl -H "Origin: http://localhost:3000" -X OPTIONS http://api-domain.com/api/login
# 应该有Access-Control-Allow-Origin头
```

## 5. 监控与告警

### 5.1 关键指标

- 认证失败率
- Token验证失败次数
- CORS拒绝请求数
- 注册成功率

### 5.2 告警规则

- 认证失败率超过5%
- Token验证失败数激增 (>100次/小时)
- 异常域名CORS请求 (配置外域名)

## 6. 回滚方案

### 6.1 回滚触发条件

- 认证成功率下降超过10%
- 用户投诉无法登录
- 发现严重安全漏洞

### 6.2 回滚步骤

1. 切换到上一版本
2. 恢复CORS为 `*`
3. 恢复AuthContext原始逻辑
4. 分析日志定位问题
5. 修复后重新部署

## 7. 相关资源

- [JWT验证最佳实践](https://tools.ietf.org/html/rfc7519)
- [CORS安全指南](https://owasp.org/www-project-secure-headers/)
- [认证系统设计模式](../add-user-authentication/specs/auth/spec.md)

---

**文档版本**: v1.0
**维护者**: 开发团队
**审核人**: 安全团队
**最后更新**: 2025-11-22
