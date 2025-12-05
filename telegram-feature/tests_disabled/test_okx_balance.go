package main

import (
	"fmt"
	"log"
	"os"
	"nofx/trader"
)

func main() {
	fmt.Println("🧪 OKX余额获取测试工具")
	fmt.Println("================================")
	fmt.Println()

	// 从环境变量读取OKX配置
	apiKey := os.Getenv("OKX_API_KEY")
	secretKey := os.Getenv("OKX_SECRET_KEY")
	passphrase := os.Getenv("OKX_PASSPHASE")

	// 验证环境变量
	fmt.Println("📋 配置检查:")
	if apiKey == "" {
		fmt.Println("  ❌ OKX_API_KEY 未设置")
		return
	} else {
		fmt.Printf("  ✅ OKX_API_KEY: %s****\n", apiKey[:8])
	}

	if secretKey == "" {
		fmt.Println("  ❌ OKX_SECRET_KEY 未设置")
		return
	} else {
		fmt.Printf("  ✅ OKX_SECRET_KEY: %s****\n", secretKey[:8])
	}

	if passphrase == "" {
		fmt.Println("  ❌ OKX_PASSPHASE 未设置")
		return
	} else {
		fmt.Printf("  ✅ OKX_PASSPHASE: %s****\n", passphrase[:4])
	}

	fmt.Println()
	fmt.Println("🔌 正在连接OKX API...")

	// 创建OKX交易器（使用模拟交易环境）
	okxTrader, err := trader.NewOKXTrader(apiKey, secretKey, passphrase, true)
	if err != nil {
		log.Printf("❌ OKX交易器创建失败: %v", err)
		return
	}
	fmt.Println("✅ OKX交易器创建成功")

	// 获取余额
	fmt.Println()
	fmt.Println("📊 正在获取账户余额...")
	balance, err := okxTrader.GetBalance()
	if err != nil {
		log.Printf("❌ 获取余额失败: %v", err)
		fmt.Println()
		fmt.Println("💡 可能的原因:")
		fmt.Println("  1. API Key权限不足（需要交易权限）")
		fmt.Println("  2. 网络连接问题")
		fmt.Println("  3. API Key/Secret/Passphrase不正确")
		fmt.Println("  4. 账户余额为0")
		return
	}

	// 解析并显示余额
	fmt.Println()
	fmt.Println("✅ 余额获取成功！")
	fmt.Println()
	fmt.Println("📈 账户余额详情:")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("  总资产 (total): %.8f USDT\n", balance["total"])
	fmt.Printf("  已用 (used):    %.8f USDT\n", balance["used"])
	fmt.Printf("  可用 (free):    %.8f USDT\n", balance["free"])
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━")

	// 计算盈亏（如果有初始资金配置）
	if initialBalance := os.Getenv("INITIAL_BALANCE"); initialBalance != "" {
		if initial, err := ParseFloat(initialBalance); err == nil && initial > 0 {
			current := balance["total"].(float64)
			pnl := ((current - initial) / initial) * 100
			fmt.Println()
			fmt.Println("💹 盈亏统计:")
			fmt.Printf("  初始资金: %.2f USDT\n", initial)
			fmt.Printf("  当前价值: %.2f USDT\n", current)
			fmt.Printf("  盈亏比例: %.2f%%\n", pnl)
		}
	}

	fmt.Println()
	fmt.Println("🎉 测试完成！")
}

// ParseFloat 简单的字符串转浮点数函数
func ParseFloat(s string) (float64, error) {
	var result float64
	_, err := fmt.Sscanf(s, "%f", &result)
	return result, err
}
