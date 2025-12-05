## Why
当前系统中存在多处使用"How it Works"的文本，需要将其替换为"User Manual"以保持术语一致性，同时支持中英文版本。

## What Changes
- 将首页和其他页面中的"How it Works"文本替换为"User Manual"
- 同时处理中英文版本
- 确保不影响其他功能
- 只修改前端代码

## Impact
- Affected specs: `specs/docs/spec.md`
- Affected code: 前端页面和组件中所有包含"How it Works"的文本
- 主要文件位置:
  - LandingPage.tsx
  - UserManualLink.tsx
  - 翻译文件（如果有）
