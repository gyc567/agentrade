# 修复实施报告：OKX 平仓失败修复

## 📝 变更摘要
修复了 `CloseLong`、`CloseShort` 和 `ClosePosition` 方法，使其能够正确读取最新的持仓数据结构。

### 主要变更点
1.  **字段映射修正**: 
    *   在 `CloseLong` 中，将读取持仓数量的逻辑从 `pos["position"]` (string) 修改为 `pos["positionAmt"]` (float64)。
    *   在 `CloseShort` 中，同样修改为使用 `pos["positionAmt"]`。
    *   在 `ClosePosition` 中，修改为使用 `pos["positionAmt"]`。

### 问题复盘
之前在修复 OKX 持仓上报问题时，更新了 `parsePositions` 方法，将持仓数量字段名标准化为 `positionAmt` 并转换为 `float64` 类型。然而，平仓相关的方法未同步更新，仍在尝试读取旧的 `position` 字段（且期望它是 string 类型），导致无法获取持仓数量，进而误判为“无持仓”并拒绝执行平仓。

## 🚀 验证结果
- **编译检查**: `go build ./trader/...` 执行成功，无编译错误。
- **逻辑验证**: 代码逻辑已与 `parsePositions` 的最新输出结构对齐。

## 结论
Bug 已修复，现在交易员应该能够正确识别并平掉 OKX 仓位。
