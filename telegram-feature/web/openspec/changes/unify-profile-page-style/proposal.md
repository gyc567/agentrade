## Why

Profile页面(`/profile`)与Dashboard主页(`/dashboard`)存在视觉风格割裂。Profile使用Tailwind灰色系（`bg-gray-50 dark:bg-gray-900`、`bg-white dark:bg-gray-800`），而Dashboard采用Binance深色主题（`#000000`背景、`binance-card`组件）。这种不一致破坏了用户体验的连贯性。

## What Changes

- 将Profile页面背景从灰色系切换到Binance黑色主题（`#000000`）
- 将白色/灰色卡片替换为`binance-card`组件样式
- 统一使用CSS变量（`--panel-bg`、`--panel-border`、`--text-primary`）
- 保持现有功能和布局不变，仅修改视觉呈现

## Impact

- Affected specs: `ui-consistency`（新增）
- Affected code:
  - `src/pages/UserProfilePage.tsx` - 主要修改文件
  - `src/index.css` - 已有Binance主题样式，无需修改

## Technical Notes

关键样式映射:
```
当前Profile样式              →  目标Dashboard样式
─────────────────────────────────────────────────
bg-gray-50 dark:bg-gray-900  →  bg-[#000000]
bg-white dark:bg-gray-800    →  binance-card / bg-[var(--panel-bg)]
border-gray-200              →  border-[var(--panel-border)]
text-gray-900 dark:text-white→  text-[var(--text-primary)]
text-gray-600 dark:text-gray-400 → text-[var(--text-secondary)]
```

此变更遵循"消除特殊情况"的原则——让Profile页面成为通用主题的自然延续，而非独立孤岛。
