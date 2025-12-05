# OKX 下单数量精度问题修复报告

**日期**: 2025-11-27  
**问题**: `Order quantity must be a multiple of the lot size`  
**状态**: 已修复

---

## 问题描述

OKX 下单 BNBUSDT 时报错：
```
OKX API错误 [1]: All operations failed 
(详细: sCode=51121, sMsg=Order quantity must be a multiple of the lot size.)
```

## 根本原因分析

经过系统排查，确认了以下5个问题：

| # | 问题 | 严重程度 | 状态 |
|---|------|----------|------|
| 1 | **BNB合约面值(ctVal)配置错误** - 代码写0.1，实际是0.01 | 严重 | 已修复 |
| 2 | **lotSz未被返回和使用** - 函数获取了但没返回 | 严重 | 已修复 |
| 3 | **取整精度硬编码为0.01** - 应使用实际lotSz | 中等 | 已修复 |
| 4 | **BNB需要整张合约** - lotSz=1，不是0.01 | 严重 | 已修复 |
| 5 | **其他合约默认值过时** - 需要更新 | 轻微 | 已修复 |

## OKX 合约规格验证 (API数据)

| 合约 | ctVal | minSz | lotSz | 说明 |
|------|-------|-------|-------|------|
| BTC-USDT-SWAP | 0.01 | 0.01 | 0.01 | 1张=0.01 BTC |
| ETH-USDT-SWAP | 0.1 | 0.01 | 0.01 | 1张=0.1 ETH |
| SOL-USDT-SWAP | 1 | 0.01 | 0.01 | 1张=1 SOL |
| DOGE-USDT-SWAP | 1000 | 0.01 | 0.01 | 1张=1000 DOGE |
| XRP-USDT-SWAP | 100 | 0.01 | 0.01 | 1张=100 XRP |
| **BNB-USDT-SWAP** | **0.01** | **1** | **1** | **1张=0.01 BNB，必须整张** |
| ADA-USDT-SWAP | 100 | 0.1 | 0.1 | 1张=100 ADA |

## 代码修改

### 1. 新增 ContractSpec 结构体
```go
type ContractSpec struct {
    CtVal float64 // 合约面值（1张合约对应多少币）
    MinSz float64 // 最小下单张数
    LotSz float64 // 下单精度（必须是lotSz的整数倍）
}
```

### 2. 修改 getContractSpec 函数
- 返回完整的合约规格（ctVal, minSz, lotSz）
- 不再忽略lotSz参数

### 3. 修改 convertToContractSize 函数
```go
// 根据lotSz进行取整（向下取整到lotSz的整数倍）
if spec.LotSz > 0 {
    contractSize = math.Floor(rawContractSize/spec.LotSz) * spec.LotSz
}

// 检查取整后是否为0或小于最小下单量
if contractSize < spec.MinSz {
    if rawContractSize < spec.MinSz * 0.5 {
        // 如果原始数量远小于最小下单量（小于50%），返回错误
        return "", fmt.Errorf("下单数量过小: 需要至少...")
    }
    // 如果接近最小下单量，使用最小值并警告
    contractSize = spec.MinSz
}
```

### 4. 更新默认合约规格
```go
defaults := map[string]*ContractSpec{
    "BTC-USDT-SWAP":  {CtVal: 0.01, MinSz: 0.01, LotSz: 0.01},
    "ETH-USDT-SWAP":  {CtVal: 0.1, MinSz: 0.01, LotSz: 0.01},
    "SOL-USDT-SWAP":  {CtVal: 1.0, MinSz: 0.01, LotSz: 0.01},
    "BNB-USDT-SWAP":  {CtVal: 0.01, MinSz: 1.0, LotSz: 1.0},  // 修正！
    "ADA-USDT-SWAP":  {CtVal: 100.0, MinSz: 0.1, LotSz: 0.1}, // 修正！
    // ...
}
```

## 修改的文件

1. `trader/okx_trader.go`
   - 添加 `ContractSpec` 结构体
   - 修改 `getContractSpec()` 函数返回完整规格
   - 修改 `getDefaultContractSpec()` 更新默认值
   - 修改 `convertToContractSize()` 使用正确的lotSz取整
   - 添加 `math` 包导入

## 验证方法

下单时日志会显示：
```
📋 合约规格 BNB-USDT-SWAP: ctVal=0.010000, minSz=1.0000, lotSz=1.0000
📊 数量转换: 币数量=0.114000, ctVal=0.010000, lotSz=1.0000, minSz=1.0000 -> 合约张数=11.0000
```

对于BNB，合约张数会被取整为整数（如11而不是11.4）。

## 部署说明

修复已应用到开发环境。要将修复部署到生产环境：

1. 点击 Replit 的 **Publish** 按钮
2. 选择 **Reserved VM** 部署类型
3. 点击 **Publish** 开始部署

---

**修复人**: AI Agent  
**审核状态**: 待用户验证
