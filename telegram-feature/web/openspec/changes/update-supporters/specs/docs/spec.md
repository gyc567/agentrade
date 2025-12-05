## MODIFIED Requirements

### Requirement: Strategic Investor Update
首页右下角的战略投资方信息 SHALL 从 "Amber.ac (战略投资)" 更新为 "monnairegroup.com (战略投资)"。

### Requirement: Add OKX Exchange Support
首页右下角 SHALL 增加 OKX 交易所作为新的支持方。

#### Scenario: 查看首页支持方信息
- **WHEN** 用户访问首页
- **THEN** 右下角显示 "monnairegroup.com (战略投资)" 而不是 "Amber.ac (战略投资)"
- **THEN** 右下角显示 OKX 交易所作为新的支持方
- **THEN** 所有其他功能保持不变

## TEST REQUIREMENTS

### Test Requirement: Strategic Investor Display
必须测试首页右下角显示的战略投资方信息是否正确。

#### Test Case: Strategic Investor Name
- 步骤: 访问首页
- 预期结果: 显示 "monnairegroup.com (战略投资)"

### Test Requirement: OKX Exchange Display
必须测试OKX交易所是否正确显示在支持方列表中。

#### Test Case: OKX Exchange Presence
- 步骤: 访问首页
- 预期结果: OKX交易所图标和名称显示在支持方列表中
