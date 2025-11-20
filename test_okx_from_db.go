package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"nofx/trader"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	fmt.Println("🧪 OKX余额获取测试工具（从数据库读取配置）")
	fmt.Println("================================================")
	fmt.Println()

	// 1. 尝试从环境变量读取
	apiKey := os.Getenv("OKX_API_KEY")
	secretKey := os.Getenv("OKX_SECRET_KEY")
	passphrase := os.Getenv("OKX_PASSPHASE")

	// 2. 如果环境变量存在，优先使用
	useEnvVars := apiKey != "" && secretKey != "" && passphrase != ""

	if useEnvVars {
		fmt.Println("📋 从环境变量读取配置:")
		fmt.Printf("  ✅ OKX_API_KEY: %s****\n", apiKey[:8])
		fmt.Printf("  ✅ OKX_SECRET_KEY: %s****\n", secretKey[:8])
		fmt.Printf("  ✅ OKX_PASSPHASE: %s****\n", passphrase[:4])
	} else {
		fmt.Println("📋 从数据库读取配置...")
		// 从数据库读取OKX配置
		dbPath := "config.db"
		db, err := sql.Open("sqlite3", dbPath)
		if err != nil {
			log.Printf("❌ 连接数据库失败: %v", err)
			return
		}
		defer db.Close()

		// 查询admin用户的OKX配置
		row := db.QueryRow("SELECT api_key, secret_key, okx_passphrase FROM exchanges WHERE id = 'okx' AND user_id = 'admin'")
		var dbApiKey, dbSecretKey, dbPassphrase sql.NullString
		err = row.Scan(&dbApiKey, &dbSecretKey, &dbPassphrase)
		if err != nil {
			log.Printf("❌ 查询OKX配置失败: %v", err)
			return
		}

		// 检查数据库中的值
		if dbApiKey.Valid && dbApiKey.String != "" {
			apiKey = dbApiKey.String
			fmt.Printf("  ✅ 数据库API Key: %s****\n", apiKey[:8])
		} else {
			fmt.Println("  ❌ 数据库API Key为空")
		}

		if dbSecretKey.Valid && dbSecretKey.String != "" {
			secretKey = dbSecretKey.String
			fmt.Printf("  ✅ 数据库Secret Key: %s****\n", secretKey[:8])
		} else {
			fmt.Println("  ❌ 数据库Secret Key为空")
		}

		if dbPassphrase.Valid && dbPassphrase.String != "" {
			passphrase = dbPassphrase.String
			fmt.Printf("  ✅ 数据库Passphrase: %s****\n", passphrase[:4])
		} else {
			fmt.Println("  ❌ 数据库Passphrase为空")
		}
	}

	fmt.Println()

	// 验证所有参数
	if apiKey == "" {
		fmt.Println("❌ API Key为空，无法继续测试")
		fmt.Println()
		fmt.Println("💡 解决方案:")
		fmt.Println("  方法1: 设置环境变量")
		fmt.Println("    export OKX_API_KEY=your_api_key")
		fmt.Println("    export OKX_SECRET_KEY=your_secret_key")
		fmt.Println("    export OKX_PASSPHASE=your_passphrase")
		fmt.Println()
		fmt.Println("  方法2: 更新数据库配置")
		fmt.Println("    UPDATE exchanges SET api_key='your_key', secret_key='your_secret', okx_passphrase='your_pass'")
		fmt.Println("    WHERE id='okx' AND user_id='admin';")
		return
	}

	if secretKey == "" {
		fmt.Println("❌ Secret Key为空，无法继续测试")
		return
	}

	if passphrase == "" {
		fmt.Println("❌ Passphrase为空，无法继续测试")
		return
	}

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
		fmt.Println("  4. 账户余额为0或API调用限制")

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
