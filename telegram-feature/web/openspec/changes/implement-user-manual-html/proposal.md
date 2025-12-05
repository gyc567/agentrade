## Why
当前用户手册以纯MD格式在浏览器中打开，用户体验不佳。需要将其转换为HTML格式并与系统整体风格保持一致。

## What Changes
- 将用户手册从MD格式转换为HTML格式，支持中英文版本
- 保持与系统整体风格一致
- 维护原来的用户手册链接，确保平滑迁移
- 支持从链接直接跳转到新的HTML内容

## Impact
- Affected specs: `specs/docs/spec.md`
- Affected code: 前端用户手册页面、路由配置
- 文件位置: `web/public/docs/` 目录下的 MD 文件
