# NOFX AI Trading System - API测试手册

> 使用Reqable测试后台接口，新手也能快速上手

## 📋 目录

1. [认识Reqable](#认识reqable)
2. [安装与注册](#安装与注册)
3. [界面介绍](#界面介绍)
4. [第一次测试](#第一次测试)
5. [NOFX系统测试场景](#nofx系统测试场景)
6. [常见问题解决](#常见问题解决)

---

## 🎯 认识Reqable

### 什么是Reqable？
Reqable是一个专业的API调试工具，就像Postman的替代品，但更简单、更快。

**你可以用它来：**
- ✅ 测试REST API接口
- ✅ 发送GET/POST/PUT/DELETE请求
- ✅ 查看响应数据
- ✅ 检查HTTP状态码
- ✅ 调试后端接口

---

## 🚀 安装与注册

### 方式一：浏览器版（推荐新手）

1. 打开浏览器，访问：**https://reqable.com/**
2. 点击右上角 **"开始使用"**
3. 注册账号（可用邮箱或GitHub账号登录）
4. 免费版足够日常使用

### 方式二：桌面应用

| 系统 | 下载地址 |
|------|----------|
| Windows | https://reqable.com/download/windows |
| macOS | https://reqable.com/download/mac |
| Linux | https://reqable.com/download/linux |

---

## 🎨 界面介绍

打开Reqable后，你会看到：

```
┌─────────────────────────────────────────────────────┐
│  顶部工具栏：保存的请求 | 环境变量 | 设置             │
├─────────────────────────────────────────────────────┤
│                    │
│  左侧面板          │       右侧主面板                │
│  • 请求历史        │       • 请求方法选择器          │
│  • 收藏的请求      │       • URL输入框               │
│  • 请求集合        │       • 请求头 (Headers)        │
│                    │       • 请求体 (Body)           │
│                    │       • 响应结果 (Response)     │
│                    │       • 状态码 (Status)         │
└─────────────────────────────────────────────────────┘
```

**核心区域说明：**

1. **HTTP方法选择器** - GET / POST / PUT / DELETE
2. **URL输入框** - 输入接口地址
3. **Headers** - 请求头配置
4. **Body** - 请求体内容（POST/PUT需要）
5. **Response** - 服务器返回的数据

---

## 🔥 第一次测试

### 步骤1：选择HTTP方法
默认是GET，保持不变。

### 步骤2：输入URL
在URL框输入：
```
https://httpbin.org/get
```
（这是测试接口，任何人都可以用）

### 步骤3：发送请求
点击右侧 **"Send"** 按钮（蓝色）

### 步骤4：查看响应
稍等片刻，右侧会显示服务器返回的数据：
```json
{
  "args": {},
  "headers": {...},
  "origin": "1.2.3.4",
  "url": "https://httpbin.org/get"
}
```

**✅ 恭喜！你已经完成了第一次API调用**

---

## 🎯 NOFX系统测试场景

### 场景1：检查系统健康状态

**目标：** 确认系统是否正在运行

1. **设置请求**
   - 方法：`GET`
   - URL：`http://localhost:3000/health` 或你的后台端口

2. **发送请求**
   - 点击 **Send**

3. **期望响应**
   - 状态码：`200 OK`
   - 响应体示例：
   ```json
   {
     "service": "NOFX AI Trading System",
     "status": "ok",
     "timestamp": "2025-11-13T..."
   }
   ```

4. **如果失败**
   - 检查服务是否启动
   - 检查端口号是否正确

---

### 场景2：获取交易数据

**目标：** 从系统获取交易记录

1. **设置请求**
   - 方法：`GET`
   - URL：`http://localhost:3000/api/trades`

2. **Headers配置**
   在Headers标签下添加：
   ```
   Content-Type: application/json
   Accept: application/json
   ```

3. **发送请求**

4. **期望响应**
   ```json
   {
     "success": true,
     "data": [
       {
         "id": 1,
         "symbol": "BTC/USDT",
         "price": 45000,
         "quantity": 0.5,
         "timestamp": "2025-11-13T..."
       }
     ]
   }
   ```

---

### 场景3：创建新订单

**目标：** 向系统提交一个新的交易订单

1. **设置请求**
   - 方法：`POST`
   - URL：`http://localhost:3000/api/orders`

2. **Headers配置**
   添加：
   ```
   Content-Type: application/json
   ```

3. **Body配置**
   在Body标签下，选择"JSON"，输入：
   ```json
   {
     "symbol": "ETH/USDT",
     "side": "buy",
     "type": "market",
     "quantity": 2.0,
     "price": null
   }
   ```

4. **发送请求**

5. **期望响应**
   ```json
   {
     "success": true,
     "orderId": "ord_123456",
     "status": "pending",
     "message": "订单创建成功"
   }
   ```

---

### 场景4：获取用户信息

**目标：** 获取指定用户的信息

1. **设置请求**
   - 方法：`GET`
   - URL：`http://localhost:3000/api/users/123`
   （123是用户ID示例）

2. **Headers配置**
   ```
   Authorization: Bearer your_token_here
   Content-Type: application/json
   ```

3. **发送请求**

4. **期望响应**
   ```json
   {
     "success": true,
     "user": {
       "id": 123,
       "username": "trader001",
       "email": "user@example.com",
       "balance": 10000.50
     }
   }
   ```

---

### 场景5：批量数据查询

**目标：** 带参数查询交易记录

1. **设置请求**
   - 方法：`GET`
   - URL：`http://localhost:3000/api/trades?symbol=BTC/USDT&limit=10&status=completed`

2. **Query参数说明**
   - `symbol` - 交易对
   - `limit` - 返回数量限制
   - `status` - 交易状态

3. **发送请求**

4. **查看响应**
   ```json
   {
     "success": true,
     "count": 10,
     "data": [...]
   }
   ```

---

## 🛠️ 高级功能

### 保存常用请求
1. 发送请求后，点击 **"Save"**
2. 输入名称，如："获取交易数据"
3. 之后可在左侧"收藏的请求"中快速调用

### 环境变量配置
1. 点击顶部 **"Environment"**
2. 添加变量：
   ```
   base_url: http://localhost:3000
   token: your_auth_token
   ```
3. 在URL中引用：`{{base_url}}/api/trades`

### 历史记录
- 左侧面板的 **"历史"** 标签
- 可快速重新发送之前的请求

---

## ❌ 常见问题解决

### 问题1：连接被拒绝
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**原因：** 后端服务未启动

**解决：**
1. 检查服务器是否运行
2. 确认端口号正确
3. 防火墙是否阻止连接

---

### 问题2：401未授权
```
HTTP 401 Unauthorized
```

**原因：** 缺少认证或token无效

**解决：**
1. 在Headers中添加：
   ```
   Authorization: Bearer your_token
   ```
2. 或检查token是否过期

---

### 问题3：404找不到
```
HTTP 404 Not Found
```

**原因：** URL路径错误

**解决：**
1. 检查URL拼写
2. 确认API路由是否正确
3. 询问后端开发人员确认路径

---

### 问题4：500服务器错误
```
HTTP 500 Internal Server Error
```

**原因：** 服务器内部错误

**解决：**
1. 查看响应体的错误信息
2. 检查请求参数是否正确
3. 联系后端开发人员

---

### 问题5：超时
```
Request timeout
```

**原因：** 服务器响应时间过长

**解决：**
1. 增加超时时间设置
2. 简化请求参数
3. 检查数据库查询性能

---

## 📊 响应状态码速查

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

---

## 📝 测试检查清单

在测试NOFX系统时，确认以下项目：

- [ ] 系统健康检查返回200
- [ ] 能正常获取交易数据
- [ ] 能成功创建订单
- [ ] 用户认证流程正常
- [ ] 错误处理机制工作
- [ ] 超时和重试机制正常
- [ ] 参数验证有效

---

## 🎓 下一步学习

**熟练后可以探索：**
1. 使用cURL命令测试
2. 编写自动化测试脚本
3. 集成到CI/CD流程
4. 性能测试和负载测试

---

## 🆘 获取帮助

- **Reqable文档：** https://reqable.com/docs
- **HTTP状态码：** https://httpstatuses.com/
- **JSON格式化：** https://jsonlint.com/

---

**祝测试愉快！** 🚀

> 记住：好的API测试是构建可靠系统的第一步
