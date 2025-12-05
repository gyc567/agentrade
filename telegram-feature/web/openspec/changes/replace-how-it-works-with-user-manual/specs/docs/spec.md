## ADDED Requirements

### Requirement: Replace "How it Works" with "User Manual" in English
系统 SHALL 将所有页面中的英文文本"How it Works"替换为"User Manual"。

#### Scenario: 首页中的文本替换
- **WHEN** 用户访问英文版本的首页
- **THEN** 页面中的"How it Works"文本显示为"User Manual"
- **THEN** 所有其他功能保持不变

### Requirement: Replace corresponding Chinese text with "用户手册"
系统 SHALL 将所有页面中的中文对应文本（如"如何使用"）替换为"用户手册"。

#### Scenario: 首页中的中文文本替换
- **WHEN** 用户访问中文版本的首页
- **THEN** 页面中的对应中文文本显示为"用户手册"
- **THEN** 所有其他功能保持不变

## MODIFIED Requirements

### Requirement: User Manual Link Text
用户手册链接的文本 SHALL 从"How it Works"（英文）和"如何使用"（中文）更新为"User Manual"（英文）和"用户手册"（中文）。

#### Scenario: 用户手册链接的显示
- **WHEN** 用户访问任何版本的页面
- **THEN** 用户手册链接显示正确的文本
- **THEN** 链接指向仍然是正确的用户手册页面
