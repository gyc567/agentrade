## Why
前端域名 `https://www.agentrade.xyz` 访问后端登录接口时出现 CORS 错误：`No 'Access-Control-Allow-Origin' header is present on the requested resource`，导致用户无法正常登录。

## What Changes
在后端 API 服务器的 CORS 白名单中新增生产前端域名：
- 编辑文件：`/Users/guoyingcheng/dreame/code/nofx/api/server.go`
- 在 `allowedOrigins` 数组中新增 `https://www.agentrade.xyz`

## Impact
- Affected code:
  - api/server.go
- 修复后前端 `https://www.agentrade.xyz` 可以正常调用后端所有 API 接口，包括登录、注册等功能。
