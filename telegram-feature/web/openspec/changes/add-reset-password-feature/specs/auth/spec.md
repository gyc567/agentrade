## ADDED Requirements

### Requirement: Password Reset Request
系统 SHALL 提供一个 API 端点来处理密码重置请求，当用户提供注册邮箱时，系统 SHALL 发送包含重置链接和 OTP 验证码的邮件。

#### Scenario: 有效邮箱请求重置
- **WHEN** 用户向 `/request-password-reset` 发送 POST 请求，包含有效注册邮箱
- **THEN** 系统返回 HTTP 200 OK 响应
- **THEN** 系统向用户邮箱发送包含重置链接和 OTP 验证码的邮件
- **THEN** 系统生成一个有效期为 1 小时的重置 token
- **THEN** 系统将 token、OTP 和用户 ID 关联存储

#### Scenario: 无效邮箱请求重置
- **WHEN** 用户向 `/request-password-reset` 发送 POST 请求，包含未注册邮箱
- **THEN** 系统返回 HTTP 404 Not Found 响应
- **THEN** 系统返回错误信息 "邮箱未注册"

### Requirement: Password Reset Confirmation
系统 SHALL 提供一个 API 端点来验证密码重置请求，当用户提供有效重置 token、OTP 验证码和新密码时，系统 SHALL 更新用户密码。

#### Scenario: 有效信息重置密码
- **WHEN** 用户向 `/reset-password` 发送 POST 请求，包含有效 token、OTP 和符合要求的新密码
- **THEN** 系统验证 token 的有效性和过期时间
- **THEN** 系统验证 OTP 验证码
- **THEN** 系统使用哈希算法存储新密码
- **THEN** 系统返回 HTTP 200 OK 响应，消息为 "密码重置成功"
- **THEN** 系统使旧 token 和 OTP 失效

#### Scenario: 无效 token 重置密码
- **WHEN** 用户向 `/reset-password` 发送 POST 请求，包含无效或过期 token
- **THEN** 系统返回 HTTP 401 Unauthorized 响应
- **THEN** 系统返回错误信息 "无效或过期的重置链接"

#### Scenario: 无效 OTP 重置密码
- **WHEN** 用户向 `/reset-password` 发送 POST 请求，包含有效 token 但无效 OTP
- **THEN** 系统返回 HTTP 401 Unauthorized 响应
- **THEN** 系统返回错误信息 "验证码无效"

#### Scenario: 密码不符合要求
- **WHEN** 用户向 `/reset-password` 发送 POST 请求，包含有效 token、OTP 和长度不足 8 位的密码
- **THEN** 系统返回 HTTP 400 Bad Request 响应
- **THEN** 系统返回错误信息 "密码长度至少为 8 位"

## MODIFIED Requirements

### Requirement: User Authentication
系统 SHALL 允许用户使用新密码登录。

#### Scenario: 重置后登录
- **WHEN** 用户在密码重置后使用新密码登录
- **THEN** 系统验证密码并返回 JWT token
