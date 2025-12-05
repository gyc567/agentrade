## 1. Implementation

- [x] 1.1 修改UserProfilePage主容器背景色（`min-h-screen bg-gray-50 dark:bg-gray-900` → `min-h-screen bg-[#000000]`）
- [x] 1.2 替换所有卡片样式为binance-card（`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700` → `binance-card-no-hover`）
- [x] 1.3 统一文本颜色使用CSS变量（`text-gray-900 dark:text-white` → `text-[var(--text-primary)]`）
- [x] 1.4 统一次要文本颜色（`text-gray-600 dark:text-gray-400` → `text-[var(--text-secondary)]`）
- [x] 1.5 修改骨架屏组件样式保持一致
- [x] 1.6 调整错误状态和加载状态的背景色
- [x] 1.7 验证页面渲染效果与Dashboard一致（构建通过）
