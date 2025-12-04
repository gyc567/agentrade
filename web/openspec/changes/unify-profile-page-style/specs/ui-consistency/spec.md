## ADDED Requirements

### Requirement: Profile Page Visual Consistency

系统 SHALL 确保 Profile 页面与 Dashboard 页面使用统一的视觉设计语言。

#### Scenario: 页面背景一致性
- **WHEN** 用户访问 `/profile` 页面
- **THEN** 页面背景色 SHALL 为 `#000000`（Binance 黑色主题）
- **AND** 与 `/dashboard` 页面的背景色保持一致

#### Scenario: 卡片组件风格一致
- **WHEN** Profile 页面渲染信息卡片
- **THEN** 卡片 SHALL 使用 `binance-card` 或 `binance-card-no-hover` 样式类
- **AND** 背景色为 `var(--panel-bg)`（`#0A0A0A`）
- **AND** 边框色为 `var(--panel-border)`（`#1A1A1A`）

#### Scenario: 文本颜色一致性
- **WHEN** Profile 页面显示文本内容
- **THEN** 主要文本 SHALL 使用 `var(--text-primary)`（`#EAECEF`）
- **AND** 次要文本 SHALL 使用 `var(--text-secondary)`（`#848E9C`）
- **AND** 禁用/占位文本 SHALL 使用 `var(--text-tertiary)`（`#5E6673`）

#### Scenario: 状态颜色一致性
- **WHEN** Profile 页面显示盈亏数据
- **THEN** 正向收益 SHALL 使用 `var(--binance-green)`（`#0ECB81`）
- **AND** 负向亏损 SHALL 使用 `var(--binance-red)`（`#F6465D`）
