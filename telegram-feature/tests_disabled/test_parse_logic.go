package main

import (
	"encoding/json"
	"fmt"
	"strconv"
)

func main() {
	fmt.Println("╔════════════════════════════════════════════════════════════╗")
	fmt.Println("║          OKX余额解析逻辑测试                               ║")
	fmt.Println("║   模拟后端parseBalance()方法的逻辑                        ║")
	fmt.Println("╚════════════════════════════════════════════════════════════╝")
	fmt.Println()

	// 模拟OKX API返回的响应
	okxResponse := map[string]interface{}{
		"code": "0",
		"msg":  "",
		"data": []interface{}{
			map[string]interface{}{
				"acctLv":      "3",
				"totalEq":     "99.905",        // 总资产
				"isoEq":       "0",             // 已用资产
				"adjEq":       "99.905",        // 可用资产
				// 注意：accountBalances 可能为空
			},
		},
	}

	fmt.Println("📥 OKX API模拟响应:")
	fmt.Println("─────────────────────────────────────────────────────────")
	jsonData, _ := json.MarshalIndent(okxResponse, "", "  ")
	fmt.Println(string(jsonData))
	fmt.Println()

	// 模拟后端parseBalance逻辑
	fmt.Println("🔍 模拟后端parseBalance()方法:")
	fmt.Println("─────────────────────────────────────────────────────────")
	fmt.Println()

	result := parseBalance(okxResponse)

	fmt.Println()
	fmt.Println("📤 解析结果:")
	fmt.Println("─────────────────────────────────────────────────────────")
	fmt.Printf("  total (总资产): %.8f\n", result["total"])
	fmt.Printf("  used  (已用):   %.8f\n", result["used"])
	fmt.Printf("  free  (可用):   %.8f\n", result["free"])
	fmt.Println()

	// 验证结果
	fmt.Println("✅ 验证:")
	fmt.Println("─────────────────────────────────────────────────────────")

	if result["total"].(float64) == 0 {
		fmt.Println("  ❌ 问题发现: total字段为0!")
		fmt.Println()
		fmt.Println("  🔍 可能原因:")
		fmt.Println("    1. totalEq字段类型不是string")
		fmt.Println("    2. strconv.ParseFloat解析失败")
		fmt.Println("    3. 字段名错误（可能是totalEqUSDT）")
	} else {
		fmt.Println("  ✅ 解析成功!")
		fmt.Printf("  total = %.2f USDT\n", result["total"])
	}
}

// 复制后端的parseBalance逻辑
func parseBalance(resp map[string]interface{}) map[string]interface{} {
	result := map[string]interface{}{
		"total": float64(0),
		"used":  float64(0),
		"free":  float64(0),
	}

	fmt.Println("步骤1: 检查resp['data']字段")
	if data, ok := resp["data"].([]interface{}); ok && len(data) > 0 {
		fmt.Printf("  ✅ data是数组，长度=%d\n", len(data))
		if balance, ok := data[0].(map[string]interface{}); ok {
			fmt.Printf("  ✅ data[0]是map\n")

			// 步骤2: 尝试解析totalEq
			fmt.Println("\n步骤2: 尝试解析totalEq字段")
			if totalEq, ok := balance["totalEq"].(string); ok {
				fmt.Printf("  ✅ 找到totalEq字段，类型=%T，值='%s'\n", totalEq, totalEq)
				if total, err := strconv.ParseFloat(totalEq, 64); err == nil {
					fmt.Printf("  ✅ 解析成功: %.8f\n", total)
					result["total"] = total
				} else {
					fmt.Printf("  ❌ 解析失败: %v\n", err)
				}
			} else {
				fmt.Println("  ❌ 未找到totalEq字段或类型不是string")
				fmt.Printf("  实际类型: %T\n", balance["totalEq"])
				fmt.Printf("  实际值: %v\n", balance["totalEq"])
			}

			// 步骤3: 尝试解析isoEq
			fmt.Println("\n步骤3: 尝试解析isoEq字段")
			if isoEq, ok := balance["isoEq"].(string); ok {
				fmt.Printf("  ✅ 找到isoEq字段，类型=%T，值='%s'\n", isoEq, isoEq)
				if used, err := strconv.ParseFloat(isoEq, 64); err == nil {
					fmt.Printf("  ✅ 解析成功: %.8f\n", used)
					result["used"] = used
				} else {
					fmt.Printf("  ❌ 解析失败: %v\n", err)
				}
			} else {
				fmt.Println("  ❌ 未找到isoEq字段")
			}

			// 步骤4: 尝试解析adjEq
			fmt.Println("\n步骤4: 尝试解析adjEq字段")
			if adjEq, ok := balance["adjEq"].(string); ok {
				fmt.Printf("  ✅ 找到adjEq字段，类型=%T，值='%s'\n", adjEq, adjEq)
				if free, err := strconv.ParseFloat(adjEq, 64); err == nil {
					fmt.Printf("  ✅ 解析成功: %.8f\n", free)
					result["free"] = free
				} else {
					fmt.Printf("  ❌ 解析失败: %v\n", err)
				}
			} else {
				fmt.Println("  ❌ 未找到adjEq字段")
			}

			// 步骤5: 检查所有可用的字段
			fmt.Println("\n步骤5: 列出balance对象中的所有字段")
			for k, v := range balance {
				fmt.Printf("  %-20s: %v (类型: %T)\n", k, v, v)
			}
		}
	} else {
		fmt.Println("  ❌ data不是数组或为空")
	}

	return result
}
