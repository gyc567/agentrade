# 交易积分消耗机制 v2

> **版本**: v2.0 (基于架构审计和Crypto专家审计修订)
> **状态**: 待实现

## Why

交易员执行交易时需要消耗用户积分，实现"按次付费"的商业模式。当前交易员可以无限制执行交易，缺乏资源消耗控制机制。

### 审计反馈修订

v1版本存在以下致命问题，已在v2中修复：
- ❌ 积分扣减非原子性（交易成功但扣减可能失败）
- ❌ 检查与扣减分离导致竞态条件
- ❌ 未区分手动交易与系统触发（止损/止盈）
- ❌ 缺少幂等性保证

## What Changes

### 核心改进

1. **原子化积分操作** - 使用数据库事务保证检查+扣减原子性
2. **交易类型分离** - 区分手动交易（扣积分）和系统触发（不扣积分）
3. **幂等性保证** - 使用 tradeID 防止重复扣减
4. **锁定-释放机制** - 先锁定积分，交易成功后确认扣减，失败则释放

### 新增组件

| 组件 | 说明 |
|------|------|
| `TradeType` 枚举 | 区分 Manual/StopLoss/TakeProfit/ForceClose |
| `CreditConsumer` 接口 v2 | 原子化操作：Reserve → Confirm/Release |
| `TradeCreditConsumer` 实现 | 封装事务逻辑和幂等性检查 |

## Design Principles

### KISS 原则（修订）

```
v1（错误）: CanTrade() + ConsumeTrade() 分离调用
v2（正确）: ReserveCredit() → 交易 → ConfirmConsume()/ReleaseCredit()
```

两阶段提交模式看似更复杂，但**消除了竞态条件这个"特殊情况"**，符合Linus的好品味哲学。

### 高内聚低耦合（保持）

- **接口隔离**：交易员依赖 `CreditConsumer` 接口
- **依赖反转**：不依赖具体的 `credits.Service`
- **可选注入**：nil 时正常运行（向后兼容）

### 原子性保证（新增）

```
┌─────────────────────────────────────────────────────────────┐
│                    积分消耗时序图                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Trader          CreditConsumer         Database             │
│    │                  │                    │                 │
│    │  ReserveCredit   │                    │                 │
│    │─────────────────>│  BEGIN + FOR UPDATE│                 │
│    │                  │───────────────────>│                 │
│    │                  │  锁定1积分          │                 │
│    │                  │<───────────────────│                 │
│    │  reservationID   │                    │                 │
│    │<─────────────────│                    │                 │
│    │                  │                    │                 │
│    │  执行交易...      │                    │                 │
│    │                  │                    │                 │
│    │  ConfirmConsume  │                    │                 │
│    │─────────────────>│  COMMIT            │                 │
│    │  (成功)          │───────────────────>│                 │
│    │                  │                    │                 │
│    │  或 ReleaseCredit│                    │                 │
│    │─────────────────>│  ROLLBACK          │                 │
│    │  (失败)          │───────────────────>│                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      TraderManager                          │
│  (负责创建交易员时注入 CreditConsumer)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ 注入
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   EnhancedAutoTrader                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ userID          string                               │   │
│  │ creditConsumer  CreditConsumer  // 可选依赖          │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  executeDecision(decision, tradeType) {                    │
│      // 仅手动交易检查积分                                  │
│      if tradeType == TradeTypeManual && creditConsumer != nil { │
│          reservation, err := creditConsumer.ReserveCredit(userID, tradeID) │
│          if err != nil { return ErrInsufficientCredits }   │
│          defer func() {                                     │
│              if success { reservation.Confirm() }           │
│              else { reservation.Release() }                 │
│          }()                                                │
│      }                                                      │
│      // 执行交易逻辑                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                           │ 调用
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   CreditConsumer 接口 v2                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ReserveCredit(userID, tradeID string) (*Reservation, error) │
│  │   → 原子锁定积分，返回预留凭证                        │
│  │                                                       │   │
│  │ Reservation.Confirm() error                           │   │
│  │   → 确认扣减，提交事务                                │   │
│  │                                                       │   │
│  │ Reservation.Release() error                           │   │
│  │   → 释放锁定，回滚事务                                │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ 实现
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                TradeCreditConsumer 实现                      │
│  - 封装 credits.Service                                     │
│  - 实现幂等性检查（tradeID 去重）                            │
│  - 管理数据库事务生命周期                                    │
└─────────────────────────────────────────────────────────────┘
```

## 交易类型定义

| TradeType | 说明 | 扣积分 | 触发源 |
|-----------|------|--------|--------|
| `TradeTypeManual` | 用户主动开仓/平仓 | ✅ 是 | AI决策、用户操作 |
| `TradeTypeStopLoss` | 止损自动平仓 | ❌ 否 | Kelly止损触发 |
| `TradeTypeTakeProfit` | 止盈自动平仓 | ❌ 否 | Kelly止盈触发 |
| `TradeTypeForceClose` | 强制平仓/清算 | ❌ 否 | 交易所强平 |

**设计理由**：
- 用户为"决策"付费，而非"执行"付费
- 止损/止盈是系统保护机制，不应额外收费
- 避免用户因害怕扣积分而关闭风控

## 计费规则

### 基本规则
- 每次**手动交易决策**扣减 1 积分
- 开仓和平仓**分别计费**（一次完整交易消耗2积分）

### 特殊情况处理

| 场景 | 处理方式 |
|------|----------|
| 订单完全成交 | 扣减1积分 |
| 订单部分成交 | 扣减1积分（按决策计费，非成交量） |
| 订单被拒绝 | 不扣积分（释放锁定） |
| 网络超时 | 不扣积分（释放锁定） |
| 积分锁定后交易失败 | 释放锁定，不扣积分 |

## Impact

### 受影响的文件

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `trader/types.go` | ADDED | 定义 `TradeType` 枚举 |
| `trader/interface.go` | MODIFIED | 新增 `CreditConsumer` v2 接口 |
| `trader/credit_consumer.go` | ADDED | 实现 `TradeCreditConsumer` |
| `trader/credit_consumer_test.go` | ADDED | 单元测试（含并发测试） |
| `trader/auto_trader_enhanced.go` | MODIFIED | 集成积分消耗逻辑 |
| `trader/auto_trader_enhanced_test.go` | MODIFIED | 补充测试用例 |
| `manager/trader_manager.go` | MODIFIED | 注入 `CreditConsumer` |
| `manager/trader_manager_test.go` | MODIFIED | 补充测试用例 |
| `config/credits.go` | MODIFIED | 添加 `ReserveCredit` 事务方法 |

### 不受影响的模块

- `service/credits/` - 复用现有服务
- `api/credits/` - 无需修改 API 层
- 其他交易所实现 - 仅增强版交易员受影响
- Kelly 止损/止盈逻辑 - 仅需传递正确的 TradeType

## Risks & Mitigations

| 风险 | 缓解措施 |
|------|----------|
| 事务长时间持有锁 | 设置事务超时（5秒），超时自动释放 |
| 进程崩溃导致锁泄漏 | 数据库连接断开自动回滚 |
| 重复调用 Confirm | 幂等性检查：tradeID 去重 |
| 高并发下锁竞争 | 使用行级锁（FOR UPDATE），仅锁定单用户 |
| 向后兼容性 | `CreditConsumer` 可选注入，nil 时正常运行 |

## Success Metrics

- [ ] 100% 测试覆盖率（含并发竞态测试）
- [ ] 手动交易后积分准确扣减
- [ ] 止损/止盈触发不扣积分
- [ ] 积分不足时拒绝手动交易
- [ ] 交易失败时正确释放锁定
- [ ] 积分流水正确记录
- [ ] 现有功能不受影响
- [ ] 无竞态条件（race detector 通过）
