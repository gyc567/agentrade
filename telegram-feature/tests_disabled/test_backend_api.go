package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

func main() {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║            后端API测试工具 v1.0                           ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")
	fmt.Println()

	API_BASE := "https://nofx-gyc567.replit.app/api"

	// 测试1: /api/competition
	fmt.Println("🧪 测试1: /api/competition")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	testCompetitionAPI(API_BASE)

	fmt.Println()

	// 测试2: /api/account
	fmt.Println("🧪 测试2: /api/account")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	testAccountAPI(API_BASE)

	fmt.Println()

	// 测试3: /api/my-traders (需要认证)
	fmt.Println("🧪 测试3: /api/my-traders (需要认证)")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	testTradersAPI(API_BASE)

	fmt.Println()
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║              🎉 所有API测试完成 🎉                       ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")
}

// 测试竞争数据API
func testCompetitionAPI(baseURL string) {
	url := baseURL + "/competition"

	// 发送请求（无认证）
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("  ❌ 请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("  ❌ 读取响应失败: %v\n", err)
		return
	}

	// 显示HTTP状态
	fmt.Printf("  📡 HTTP状态: %d %s\n", resp.StatusCode, http.StatusText(resp.StatusCode))
	fmt.Printf("  📝 响应大小: %d 字节\n", len(body))

	// 解析JSON
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Printf("  ❌ JSON解析失败: %v\n", err)
		fmt.Printf("  📄 原始响应: %s\n", string(body))
		return
	}

	// 检查响应结构
	fmt.Println()
	fmt.Println("  📊 响应数据结构分析:")
	fmt.Println("  " + strings.Repeat("─", 55))

	if code, ok := result["code"].(string); ok {
		fmt.Printf("  ✅ code: %s\n", code)
		if code != "0" {
			fmt.Printf("  ⚠️  警告: API返回非零错误码\n")
			if msg, ok := result["msg"].(string); ok {
				fmt.Printf("  📝 错误消息: %s\n", msg)
			}
		}
	} else {
		fmt.Printf("  ⚠️  未找到code字段\n")
	}

	if count, ok := result["count"].(float64); ok {
		fmt.Printf("  ✅ count: %.0f\n", count)
	}

	// 分析traders数组
	if traders, ok := result["traders"].([]interface{}); ok {
		fmt.Printf("  ✅ traders数组: %d 个交易员\n", len(traders))

		if len(traders) > 0 {
			fmt.Println()
			fmt.Println("  📋 交易员详细数据 (前3个):")
			fmt.Println("  " + strings.Repeat("─", 55))

			for i, trader := range traders {
				if i >= 3 {
					fmt.Printf("  ... (还有 %d 个)\n", len(traders)-3)
					break
				}

				t, ok := trader.(map[string]interface{})
				if !ok {
					fmt.Printf("  ❌ traders[%d] 不是对象类型\n", i)
					continue
				}

				fmt.Printf("  \n  交易员 #%d:\n", i+1)

				// 提取关键字段
				fields := []string{"trader_id", "trader_name", "ai_model", "exchange", "total_equity", "total_pnl", "total_pnl_pct"}
				for _, field := range fields {
					if val, ok := t[field]; ok {
						switch v := val.(type) {
						case string:
							fmt.Printf("    %-20s: %s\n", field, v)
						case float64:
							fmt.Printf("    %-20s: %.8f\n", field, v)
						case int:
							fmt.Printf("    %-20s: %d\n", field, v)
						case bool:
							fmt.Printf("    %-20s: %v\n", field, v)
						default:
							fmt.Printf("    %-20s: %v (类型: %T)\n", field, v, v)
						}
					} else {
						fmt.Printf("    %-20s: [缺失]\n", field)
					}
				}

				// 特别关注余额字段
				if equity, ok := t["total_equity"]; ok {
					if f, ok := equity.(float64); ok {
						if f == 0 {
							fmt.Printf("    ⚠️  total_equity为0! 这可能是问题所在\n")
						} else {
							fmt.Printf("    ✅ total_equity: %.2f (正常)\n", f)
						}
					}
				}
			}
		}
	} else {
		fmt.Printf("  ⚠️  未找到traders字段或类型不正确\n")
	}

	fmt.Println()
	fmt.Println("  ✅ /api/competition 测试完成")
}

// 测试账户信息API
func testAccountAPI(baseURL string) {
	url := baseURL + "/account"

	// 发送请求（无认证）
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("  ❌ 请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("  ❌ 读取响应失败: %v\n", err)
		return
	}

	// 显示HTTP状态
	fmt.Printf("  📡 HTTP状态: %d %s\n", resp.StatusCode, http.StatusText(resp.StatusCode))
	fmt.Printf("  📝 响应大小: %d 字节\n", len(body))

	// 解析JSON
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Printf("  ❌ JSON解析失败: %v\n", err)
		fmt.Printf("  📄 原始响应: %s\n", string(body))
		return
	}

	// 检查响应结构
	fmt.Println()
	fmt.Println("  📊 响应数据结构分析:")
	fmt.Println("  " + strings.Repeat("─", 55))

	// 检查是否需要认证
	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		fmt.Printf("  ⚠️  需要认证! 这是正常的，未登录用户无法访问账户信息\n")
		fmt.Printf("  💡 要获取账户信息，需要先登录并携带token\n")
		return
	}

	if code, ok := result["code"].(string); ok {
		fmt.Printf("  ✅ code: %s\n", code)
		if code != "0" {
			fmt.Printf("  ⚠️  警告: API返回非零错误码\n")
			if msg, ok := result["msg"].(string); ok {
				fmt.Printf("  📝 错误消息: %s\n", msg)
			}
		}
	}

	// 分析账户字段
	fields := []string{
		"total_equity", "wallet_balance", "available_balance",
		"unrealized_profit", "total_pnl", "total_pnl_pct",
		"total_unrealized_pnl", "initial_balance", "daily_pnl",
		"position_count", "margin_used", "margin_used_pct",
	}

	fmt.Println()
	fmt.Println("  📋 账户字段详情:")
	fmt.Println("  " + strings.Repeat("─", 55))

	for _, field := range fields {
		if val, ok := result[field]; ok {
			switch v := val.(type) {
			case string:
				fmt.Printf("  %-25s: %s\n", field, v)
			case float64:
				fmt.Printf("  %-25s: %.8f\n", field, v)
				// 特别关注余额字段
				if field == "total_equity" || field == "available_balance" {
					if v == 0 {
						fmt.Printf("    ⚠️  %s为0! 这可能是问题所在\n", field)
					} else {
						fmt.Printf("    ✅ %s: %.2f (正常)\n", field, v)
					}
				}
			case int:
				fmt.Printf("  %-25s: %d\n", field, v)
			default:
				fmt.Printf("  %-25s: %v (类型: %T)\n", field, v, v)
			}
		} else {
			fmt.Printf("  %-25s: [缺失]\n", field)
		}
	}

	fmt.Println()
	fmt.Println("  ✅ /api/account 测试完成")
}

// 测试交易员列表API
func testTradersAPI(baseURL string) {
	url := baseURL + "/my-traders"

	// 发送请求（无认证）
	resp, err := http.Get(url)
	if err != nil {
		fmt.Printf("  ❌ 请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("  ❌ 读取响应失败: %v\n", err)
		return
	}

	// 显示HTTP状态
	fmt.Printf("  📡 HTTP状态: %d %s\n", resp.StatusCode, http.StatusText(resp.StatusCode))
	fmt.Printf("  📝 响应大小: %d 字节\n", len(body))

	// 解析JSON
	var result interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Printf("  ❌ JSON解析失败: %v\n", err)
		return
	}

	fmt.Println()

	// 检查是否需要认证
	if resp.StatusCode == 401 || resp.StatusCode == 403 {
		fmt.Printf("  ✅ 需要认证 (这是正常的)\n")
		fmt.Printf("  💡 未登录用户无法访问个人交易员列表\n")
		fmt.Printf("  💡 需要在请求头中携带Bearer token\n")
	} else {
		fmt.Printf("  ✅ 可以访问 (可能使用管理员模式)\n")
		if traders, ok := result.([]interface{}); ok {
			fmt.Printf("  📊 交易员数量: %d\n", len(traders))
		}
	}

	fmt.Println()
	fmt.Println("  ✅ /api/my-traders 测试完成")
}

// 辅助函数：格式化数字
func formatFloat(f interface{}) string {
	if f == nil {
		return "N/A"
	}
	switch v := f.(type) {
	case float64:
		return strconv.FormatFloat(v, 'f', 8, 64)
	case int:
		return strconv.Itoa(v)
	default:
		return fmt.Sprintf("%v", v)
	}
}
