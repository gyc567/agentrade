## Why
用户要求简化注册和登录流程，删除OTP验证码验证步骤，提高用户体验。

## What Changes
- 删除用户注册和登录流程中的OTP验证码验证逻辑
- 移除handleVerifyOTP相关代码和API接口
- 更新登录和注册的API文档和前端调用

## Impact
- Affected specs: specs/auth/spec.md
- Affected code:
  - backend: auth.go, server.go (登录和注册相关接口)
  - frontend: api.ts, login.tsx, register.tsx
- No breaking changes to existing functionality outside of OTP removal