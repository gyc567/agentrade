## ADDED Requirements

### Requirement: User Manual HTML Format
系统 SHALL 提供HTML格式的用户手册，支持中英文版本，并且与系统整体风格保持一致。

#### Scenario: 英文用户手册访问
- **WHEN** 用户访问 `web/public/docs/user-manual-en.md` 链接
- **THEN** 系统自动将 MD 内容转换为 HTML 格式并显示
- **THEN** 显示风格与系统整体保持一致
- **THEN** 保留所有 MD 格式的链接、列表和图片

#### Scenario: 中文用户手册访问
- **WHEN** 用户访问 `web/public/docs/user-manual-zh.md` 链接
- **THEN** 系统自动将 MD 内容转换为 HTML 格式并显示
- **THEN** 显示风格与系统整体保持一致
- **THEN** 保留所有 MD 格式的链接、列表和图片

### Requirement: Link Compatibility
系统 SHALL 保持原来的用户手册链接不变，确保已存在的链接能够平滑迁移到新的 HTML 内容。

#### Scenario: 原有链接访问
- **WHEN** 用户访问原来的用户手册链接
- **THEN** 自动跳转到新的 HTML 格式用户手册
- **THEN** 地址栏仍显示原链接或自动重定向到新地址

## MODIFIED Requirements

### Requirement: User Manual Link
用户手册链接 SHALL 指向新的 HTML 页面，而不是直接指向 MD 文件。

#### Scenario: 导航栏用户手册链接
- **WHEN** 用户点击页面上的用户手册链接
- **THEN** 打开的是 HTML 格式的用户手册
- **THEN** 保持与系统整体风格一致
