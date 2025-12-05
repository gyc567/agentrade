## Why
存在两个bug需要修复：
1. 用户切换到中文时，点击"用户手册"链接仍然跳转到英文版本"https://www.agentrade.xyz/user-manual/en"
2. 中文版本的用户手册显示乱码

## What Changes
- 修复UserManualLink组件中的硬编码链接，使其根据当前语言动态切换
- 修复中文用户手册文件的编码问题，确保其以UTF-8格式保存
- 确保所有用户手册链接在切换语言时都能正确指向对应版本

## Impact
- Affected code:
  - UserManualLink.tsx
  - UserManualPage.tsx (可能需要修改)
  - public/docs/user-manual-zh.md
