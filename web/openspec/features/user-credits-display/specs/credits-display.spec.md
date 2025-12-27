# 规范：用户积分显示模块

**版本**: 1.0
**最后更新**: 2025-12-27

---

## 1. 模块概览

### 1.1 职责
- 显示用户剩余积分
- 管理积分数据生命周期
- 提供数据刷新机制

### 1.2 依赖关系
```
CreditsDisplay
  ├─ useUserCredits (hook)
  │   ├─ API: GET /api/user/credits
  │   ├─ Context: UserContext (获取user.id)
  │   └─ Utils: fetchWithAuth
  ├─ CreditsIcon (纯展示)
  ├─ CreditsValue (纯展示)
  └─ CSS: credits.module.css
```

---

## 2. API规范

### 2.1 获取用户积分

```http
GET /api/user/credits
Authorization: Bearer <token>

Response (200 OK):
{
  "total": 1000,
  "available": 750,
  "used": 250,
  "lastUpdated": "2025-12-27T10:00:00Z"
}

Response (401 Unauthorized):
{
  "error": "Unauthorized"
}

Response (500 Server Error):
{
  "error": "Failed to fetch credits"
}
```

### 2.2 错误处理

| 状态码 | 处理方式 |
|--------|--------|
| 401 | 重定向登录 |
| 500 | 显示"-"，30秒后重试 |
| 网络错误 | 显示"-"，30秒后重试 |

---

## 3. Hook规范

### 3.1 useUserCredits

```typescript
function useUserCredits(): UseUserCreditsReturn {
  const { user } = useContext(UserContext);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 初始化和自动刷新
  useEffect(() => {
    if (!user?.id) return;

    const fetchCredits = async () => {
      // 实现获取逻辑
    };

    // 首次获取
    fetchCredits();

    // 30秒自动刷新
    const interval = setInterval(fetchCredits, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return { credits, loading, error, refetch };
}
```

### 3.2 返回值

```typescript
interface UseUserCreditsReturn {
  credits: UserCredits | null;      // null时表示未加载或error
  loading: boolean;                 // 初始加载或刷新中
  error: Error | null;              // 错误信息
  refetch: () => Promise<void>;     // 手动刷新
}

interface UserCredits {
  total: number;                    // 总积分
  available: number;               // 可用积分
  used: number;                    // 已用积分
  lastUpdated: string;             // ISO时间戳
}
```

---

## 4. 组件规范

### 4.1 CreditsDisplay

```typescript
interface CreditsDisplayProps {
  className?: string;  // 可选CSS类
}

export function CreditsDisplay({ className }: CreditsDisplayProps) {
  const { credits, loading, error } = useUserCredits();

  if (loading) return <div className="credits-loading">...</div>;
  if (error || !credits) return <div className="credits-error">-</div>;

  return (
    <div className={`credits-display ${className || ''}`}>
      <CreditsIcon />
      <CreditsValue value={credits.available} />
    </div>
  );
}
```

### 4.2 CreditsIcon

```typescript
export function CreditsIcon() {
  return <span className="credits-icon" title="用户积分">⭐</span>;
}
```

### 4.3 CreditsValue

```typescript
interface CreditsValueProps {
  value: number;
  format?: 'number' | 'short';  // 'short': 1000+ -> 1k
}

export function CreditsValue({ value, format = 'number' }: CreditsValueProps) {
  const formatted = format === 'short' ? formatNumber(value) : value;
  return <span className="credits-value">{formatted}</span>;
}
```

---

## 5. 样式规范

### 5.1 CSS模块化

```css
/* src/components/CreditsDisplay/credits.module.css */

.creditsDisplay {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(240, 185, 11, 0.1);
  color: #F0B90B;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.creditsDisplay:hover {
  background: rgba(240, 185, 11, 0.2);
}

.creditsIcon {
  font-size: 16px;
  line-height: 1;
}

.creditsValue {
  min-width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;  /* 等宽数字 */
}

.creditsLoading {
  width: 60px;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
  border-radius: 4px;
}

.creditsError {
  color: #999;
  font-size: 14px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 6. 集成指南

### 6.1 在Header中集成

```typescript
// src/components/Header.tsx

import { CreditsDisplay } from './CreditsDisplay';

export function Header() {
  return (
    <header className="header">
      <Logo />
      <Nav />
      <div className="header-right">
        <UserName />
        <CreditsDisplay />     {/* 新增 */}
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
```

### 6.2 样式调整

```css
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .creditsDisplay {
    padding: 4px 6px;
    font-size: 12px;
  }
}
```

---

## 7. 测试覆盖清单

### 7.1 Hook测试 (useUserCredits)

- [ ] 初始化时加载数据
- [ ] 成功响应处理
- [ ] 错误响应处理
- [ ] 401错误处理
- [ ] 网络错误处理
- [ ] 自动刷新机制
- [ ] 定时器清理
- [ ] 多次调用去重

### 7.2 组件测试 (CreditsDisplay)

- [ ] 加载状态渲染
- [ ] 错误状态渲染
- [ ] 数据状态渲染
- [ ] Props传递
- [ ] 样式类应用
- [ ] 子组件集成

### 7.3 子组件测试

- [ ] CreditsIcon 图标渲染
- [ ] CreditsIcon 标题属性
- [ ] CreditsValue 数值格式化
- [ ] CreditsValue 大数字处理

### 7.4 集成测试

- [ ] Header中正确位置
- [ ] 不影响其他组件
- [ ] 样式不冲突
- [ ] 响应式正确

---

## 8. 性能指标

| 指标 | 目标 | 方法 |
|------|------|------|
| 初始化时间 | < 100ms | React DevTools Profiler |
| API响应 | < 1s | Network tab |
| 刷新频率 | 30秒 | 可配置常量 |
| 内存占用 | < 1MB | Chrome DevTools Memory |

---

## 9. 安全考虑

- ✅ API 需要认证 (Bearer token)
- ✅ 不在客户端缓存敏感数据
- ✅ 错误消息不暴露系统细节
- ✅ XSS防护：React自动转义

---

## 10. 扩展点

未来可能的扩展：
1. 积分使用历史
2. 积分兑换功能
3. 积分等级显示
4. 积分通知提醒
5. 积分排行榜

但当前实现保持最小化，避免过度设计。

---

**完成状态**: 规范定义完成
**下一步**: 实现和测试
