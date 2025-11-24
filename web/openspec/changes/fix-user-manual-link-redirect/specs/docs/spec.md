## MODIFIED Requirements

### Requirement: User Manual Link URL
用户手册链接的URL SHALL 从 "https://www.agentrade.xyz/#how-it-works" 修复为 "https://www.agentrade.xyz/user-manual/en"（英文）或 "https://www.agentrade.xyz/user-manual/zh"（中文）。

#### Scenario: 英文用户点击用户手册链接
- **WHEN** 英文用户点击首页导航栏的"User Manual"链接
- **THEN** 页面跳转到 "https://www.agentrade.xyz/user-manual/en"
- **THEN** 所有其他功能保持不变

#### Scenario: 中文用户点击用户手册链接
- **WHEN** 中文用户点击首页导航栏的"用户手册"链接
- **THEN** 页面跳转到 "https://www.agentrade.xyz/user-manual/zh"
- **THEN** 所有其他功能保持不变

## TEST REQUIREMENTS

### Test Requirement: Link URL Correctness
必须测试用户手册链接在不同语言版本下的跳转地址是否正确。

#### Test Case: English Version Link
- 步骤: 访问英文首页，点击"User Manual"链接
- 预期结果: 跳转到 "https://www.agentrade.xyz/user-manual/en"

#### Test Case: Chinese Version Link
- 步骤: 访问中文首页，点击"用户手册"链接
- 预期结果: 跳转到 "https://www.agentrade.xyz/user-manual/zh"
