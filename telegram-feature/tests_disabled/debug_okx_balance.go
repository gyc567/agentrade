package main

import (
	"bufio"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

func main() {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║          OKX余额字段映射测试工具                           ║")
	fmt.Println("║   模拟后端获取OKX余额的过程，查找字段映射问题             ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")
	fmt.Println()

	// 加载环境变量
	loadEnvFile(".env.local")

	// 读取OKX凭证
	apiKey := os.Getenv("OKX_API_KEY")
	secretKey := os.Getenv("OKX_SECRET_KEY")
	passphrase := os.Getenv("OKX_PASSPHASE")

	if apiKey == "" || secretKey == "" || passphrase == "" {
		fmt.Println("❌ 错误: 请在.env.local中设置OKX API凭证")
		return
	}

	fmt.Printf("✅ API凭证已加载: %s****\n", maskString(apiKey))
	fmt.Println()

	// 调用OKX API获取余额
	fmt.Println("🔌 正在调用OKX API...")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	balance, err := getOKXBalance(apiKey, secretKey, passphrase)
	if err != nil {
		fmt.Printf("❌ 获取OKX余额失败: %v\n", err)
		return
	}

	fmt.Println()
	fmt.Println("✅ 成功获取OKX余额!")
	fmt.Println()

	// 分析OKX返回的原始数据结构
	fmt.Println("📊 OKX API原始响应分析:")
	fmt.Println("─" + strings.Repeat("─", 60))

	if data, ok := balance["data"].([]interface{}); ok && len(data) > 0 {
		if account, ok := data[0].(map[string]interface{}); ok {
			fmt.Println("  账户级别: accountLevel")
			if acctLv, ok := account["acctLv"].(string); ok {
				fmt.Printf("    值: %s\n", acctLv)
			}

			fmt.Println("\n  账户快照: accountBalances")
			if balances, ok := account["accountBalances"].([]interface{}); ok {
				fmt.Printf("    币种数量: %d\n", len(balances))

				for i, bal := range balances {
					if b, ok := bal.(map[string]interface{}); ok {
						fmt.Printf("\n    币种 #%d:\n", i+1)
						for k, v := range b {
							fmt.Printf("      %-20s: %v\n", k, v)
						}
					}
				}
			}

			fmt.Println("\n  持仓净值: positions")
			if pos, ok := account["positions"].([]interface{}); ok {
				fmt.Printf("    持仓数量: %d\n", len(pos))
				for i, p := range pos {
					if posData, ok := p.(map[string]interface{}); ok {
						fmt.Printf("\n      持仓 #%d:\n", i+1)
						for k, v := range posData {
							fmt.Printf("        %-20s: %v\n", k, v)
						}
					}
				}
			}
		}
	}

	fmt.Println()
	fmt.Println("─" + strings.Repeat("─", 60))
	fmt.Println()

	// 分析后端可能如何解析这些字段
	fmt.Println("🔍 后端字段映射分析:")
	fmt.Println("─" + strings.Repeat("─", 60))

	if data, ok := balance["data"].([]interface{}); ok && len(data) > 0 {
		if account, ok := data[0].(map[string]interface{}); ok {
			// 查找USDT相关余额
			fmt.Println("\n  💰 USDT余额字段分析:")
			if balances, ok := account["accountBalances"].([]interface{}); ok {
				for _, bal := range balances {
					if b, ok := bal.(map[string]interface{}); ok {
						if ccy, ok := b["ccy"].(string); ok && ccy == "USDT" {
							fmt.Printf("\n    找到USDT余额:\n")
							for k, v := range b {
								fmt.Printf("      %-25s: ", k)
								switch val := v.(type) {
								case string:
									fmt.Printf("%s", val)
									if f, err := strconv.ParseFloat(val, 64); err == nil {
										fmt.Printf(" (%.8f)", f)
									}
								case float64:
									fmt.Printf("%.8f", val)
								default:
									fmt.Printf("%v", val)
								}
								fmt.Println()
							}

							// 检查可能的字段映射
							fmt.Println("\n    🔍 可能被后端使用的字段:")
							fields := map[string]string{
								"availBal":   "可用余额 (available_balance)",
								"bal":        "余额 (wallet_balance)",
								"frozenBal":  "冻结余额",
								"totalEqUSDT": "总资产等值USDT (total_equity)",
							}

							for field, desc := range fields {
								if val, exists := b[field]; exists {
									fmt.Printf("      ✅ %-20s = %v (%s)\n", field, val, desc)

									// 如果是数字，显示格式化值
									if str, ok := val.(string); ok {
										if f, err := strconv.ParseFloat(str, 64); err == nil {
											fmt.Printf("         格式化值: %.8f USDT\n", f)
										}
									}
								} else {
									fmt.Printf("      ❌ %-20s: 字段不存在\n", field)
								}
							}
						}
					}
				}
			}

			// 检查totalEq字段
			fmt.Println("\n  📊 总资产字段分析:")
			if totalEq, ok := account["totalEq"].(string); ok {
				fmt.Printf("    ✅ 找到 totalEq: %s\n", totalEq)
				if f, err := strconv.ParseFloat(totalEq, 64); err == nil {
					fmt.Printf("      转换为float64: %.8f\n", f)
					if f == 0 {
						fmt.Printf("      ⚠️  WARNING: totalEq为0! 这可能导致前端显示0\n")
					}
				}
			} else {
				fmt.Printf("    ❌ 未找到 totalEq 字段\n")
			}

			if totalEqUSDT, ok := account["totalEqUSDT"].(string); ok {
				fmt.Printf("    ✅ 找到 totalEqUSDT: %s\n", totalEqUSDT)
				if f, err := strconv.ParseFloat(totalEqUSDT, 64); err == nil {
					fmt.Printf("      转换为float64: %.8f\n", f)
					if f == 0 {
						fmt.Printf("      ⚠️  WARNING: totalEqUSDT为0!\n")
					} else {
						fmt.Printf("      ✅ 建议使用此字段作为total_equity\n")
					}
				}
			}
		}
	}

	fmt.Println()
	fmt.Println("─" + strings.Repeat("─", 60))
	fmt.Println()

	// 生成建议
	fmt.Println("💡 修复建议:")
	fmt.Println("─" + strings.Repeat("─", 60))
	fmt.Println()
	fmt.Println("  如果OKX API返回的余额不为0，但后端显示为0，")
	fmt.Println("  可能是字段映射错误。建议检查后端代码中的:")
	fmt.Println()
	fmt.Println("  1. /trader/okx_trader.go 的 parseBalance() 方法")
	fmt.Println("  2. 确认是否正确解析 totalEqUSDT 或 totalEq 字段")
	fmt.Println("  3. 确认没有将字符串错误转换为0")
	fmt.Println()
	fmt.Println("  建议的解析逻辑:")
	fmt.Println("    - 优先使用 totalEqUSDT (USDT等值)")
	fmt.Println("    - 备选: availBal (可用余额)")
	fmt.Println("    - 备选: bal (账户余额)")
	fmt.Println()
}

// 获取OKX账户余额
func getOKXBalance(apiKey, secretKey, passphrase string) (map[string]interface{}, error) {
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	requestPath := "/api/v5/account/balance"
	body := ""

	signature := generateSignature(secretKey, timestamp, "GET", requestPath, body)

	url := "https://www.okx.com" + requestPath

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("OK-ACCESS-KEY", apiKey)
	req.Header.Set("OK-ACCESS-SIGN", signature)
	req.Header.Set("OK-ACCESS-TIMESTAMP", timestamp)
	req.Header.Set("OK-ACCESS-PASSPHRASE", passphrase)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("网络请求失败: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("API返回错误: %d - %s", resp.StatusCode, string(bodyBytes))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, fmt.Errorf("JSON解析失败: %w", err)
	}

	return result, nil
}

// 生成签名
func generateSignature(secretKey, timestamp, method, requestPath, body string) string {
	message := timestamp + strings.ToUpper(method) + requestPath + body

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(message))
	signature := base64.StdEncoding.EncodeToString(h.Sum(nil))

	return signature
}

// 加载.env.local文件
func loadEnvFile(filename string) {
	file, err := os.Open(filename)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		idx := strings.Index(line, "=")
		if idx == -1 {
			continue
		}

		key := strings.TrimSpace(line[:idx])
		value := strings.TrimSpace(line[idx+1:])

		if strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"") {
			value = value[1 : len(value)-1]
		}
		if strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'") {
			value = value[1 : len(value)-1]
		}

		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, value)
		}
	}
}

// 隐藏敏感信息
func maskString(s string) string {
	if len(s) <= 8 {
		return strings.Repeat("*", len(s))
	}
	return s[:8] + strings.Repeat("*", len(s)-8)
}
