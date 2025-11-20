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
	fmt.Println("╔═══════════════════════════════════════════════════╗")
	fmt.Println("║          OKX API 完整测试工具 v2.0               ║")
	fmt.Println("╚═══════════════════════════════════════════════════╝")
	fmt.Println()

	// 加载.env.local文件
	fmt.Println("📂 加载配置文件...")
	loadEnvFile(".env.local")
	fmt.Println("✅ .env.local 已加载")
	fmt.Println()

	// 读取环境变量
	apiKey := os.Getenv("OKX_API_KEY")
	secretKey := os.Getenv("OKX_SECRET_KEY")
	passphrase := os.Getenv("OKX_PASSPHASE")

	// 验证配置
	fmt.Println("🔍 配置验证:")
	fmt.Println(strings.Repeat("─", 50))

	allConfigured := true

	if apiKey == "" || strings.Contains(apiKey, "your_") {
		fmt.Println("  ❌ API Key: 未配置或使用占位符")
		allConfigured = false
	} else {
		fmt.Printf("  ✅ API Key: %s\n", maskString(apiKey))
	}

	if secretKey == "" || strings.Contains(secretKey, "your_") {
		fmt.Println("  ❌ Secret Key: 未配置或使用占位符")
		allConfigured = false
	} else {
		fmt.Printf("  ✅ Secret Key: %s\n", maskString(secretKey))
	}

	if passphrase == "" || strings.Contains(passphrase, "your_") {
		fmt.Println("  ❌ Passphrase: 未配置或使用占位符")
		allConfigured = false
	} else {
		fmt.Printf("  ✅ Passphrase: %s\n", maskString(passphrase))
	}

	fmt.Println(strings.Repeat("─", 50))
	fmt.Println()

	if !allConfigured {
		fmt.Println("⚠️  配置不完整，无法进行API测试")
		fmt.Println()
		fmt.Println("💡 请在 .env.local 文件中添加真实的API凭证:")
		fmt.Println()
		fmt.Println("   # 从 https://www.okx.com/account/my-api 获取")
		fmt.Println("   OKX_API_KEY=真实的API密钥")
		fmt.Println("   OKX_SECRET_KEY=真实的Secret密钥")
		fmt.Println("   OKX_PASSPHASE=创建API时设置的口令")
		fmt.Println()
		fmt.Println("   ⚠️  权限要求: 读取 + 交易")
		fmt.Println()
		return
	}

	fmt.Println("✅ 配置验证通过，开始API测试")
	fmt.Println()

	// 测试1: 获取账户余额
	testGetBalance(apiKey, secretKey, passphrase)

	// 测试2: 获取持仓信息
	testGetPositions(apiKey, secretKey, passphrase)

	// 测试3: 获取账户配置
	testGetAccountConfig(apiKey, secretKey, passphrase)

	// 测试4: 获取交易产品基础信息
	testGetInstruments(apiKey, secretKey, passphrase)

	fmt.Println()
	fmt.Println("╔═══════════════════════════════════════════════════╗")
	fmt.Println("║              🎉 所有测试完成 🎉                 ║")
	fmt.Println("╚═══════════════════════════════════════════════════╝")
	fmt.Println()
}

// 测试获取账户余额
func testGetBalance(apiKey, secretKey, passphrase string) {
	fmt.Println("🧪 测试1: 获取账户余额")
	fmt.Println(strings.Repeat("─", 50))

	balance, err := getBalance(apiKey, secretKey, passphrase)
	if err != nil {
		fmt.Printf("  ❌ 失败: %v\n", err)

		// 错误分析
		if strings.Contains(err.Error(), "401") {
			fmt.Println()
			fmt.Println("  🔍 错误分析: API凭证无效")
			fmt.Println("     可能原因:")
			fmt.Println("     1. API Key/Secret/Passphrase 错误")
			fmt.Println("     2. API凭证已过期或被删除")
			fmt.Println("     3. IP地址未在API白名单中")
			fmt.Println()
			fmt.Println("  💡 解决建议:")
			fmt.Println("     1. 重新生成API凭证")
			fmt.Println("     2. 检查OKX账户设置")
			fmt.Println("     3. 确认服务器IP在白名单中")
		} else if strings.Contains(err.Error(), "403") {
			fmt.Println()
			fmt.Println("  🔍 错误分析: 权限不足")
			fmt.Println("     可能原因: API权限未包含'读取'权限")
			fmt.Println()
			fmt.Println("  💡 解决建议:")
			fmt.Println("     1. 登录OKX账户")
			fmt.Println("     2. 编辑API权限")
			fmt.Println("     3. 确保勾选了'读取'权限")
		}
		return
	}

	fmt.Println("  ✅ 成功获取余额！")
	fmt.Println()
	fmt.Println("  📊 账户余额详情:")
	fmt.Println("  " + strings.Repeat("─", 35))

	if total, ok := balance["total"].(float64); ok && total > 0 {
		fmt.Printf("  💰 总资产: %.8f USDT\n", total)
	} else {
		fmt.Printf("  💰 总资产: %.2f USDT\n", 0.0)
	}

	if free, ok := balance["free"].(float64); ok && free > 0 {
		fmt.Printf("  🟢 可用余额: %.8f USDT\n", free)
	} else {
		fmt.Printf("  🟢 可用余额: %.2f USDT\n", 0.0)
	}

	if used, ok := balance["used"].(float64); ok && used > 0 {
		fmt.Printf("  🔴 已用余额: %.8f USDT\n", used)
	} else {
		fmt.Printf("  🔴 已用余额: %.2f USDT\n", 0.0)
	}

	fmt.Println("  " + strings.Repeat("─", 35))
	fmt.Println()
}

// 测试获取持仓信息
func testGetPositions(apiKey, secretKey, passphrase string) {
	fmt.Println("🧪 测试2: 获取持仓信息")
	fmt.Println(strings.Repeat("─", 50))

	positions, err := getPositions(apiKey, secretKey, passphrase)
	if err != nil {
		fmt.Printf("  ❌ 失败: %v\n", err)
		return
	}

	fmt.Println("  ✅ 成功获取持仓信息！")

	if len(positions) == 0 {
		fmt.Println("  📝 当前无持仓")
	} else {
		fmt.Printf("  📊 共有 %d 个持仓\n", len(positions))
		for i, pos := range positions {
			if i >= 3 { // 只显示前3个
				break
			}
			if instId, ok := pos["instId"].(string); ok {
				if posBal, ok := pos["pos"].(string); ok {
					fmt.Printf("     • %s: %s\n", instId, posBal)
				}
			}
		}
	}
	fmt.Println()
}

// 测试获取账户配置
func testGetAccountConfig(apiKey, secretKey, passphrase string) {
	fmt.Println("🧪 测试3: 获取账户配置")
	fmt.Println(strings.Repeat("─", 50))

	account, err := getAccountInfo(apiKey, secretKey, passphrase)
	if err != nil {
		fmt.Printf("  ❌ 失败: %v\n", err)
		return
	}

	fmt.Println("  ✅ 成功获取账户配置！")

	if accountType, ok := account["acctLv"].(string); ok {
		fmt.Printf("  📋 账户等级: %s\n", accountType)
	}

	if configArray, ok := account["applInst"].([]interface{}); ok && len(configArray) > 0 {
		fmt.Printf("  🔧 应用配置数量: %d\n", len(configArray))
	}

	fmt.Println()
}

// 测试获取交易产品信息
func testGetInstruments(apiKey, secretKey, passphrase string) {
	fmt.Println("🧪 测试4: 获取交易产品信息 (公共API)")
	fmt.Println(strings.Repeat("─", 50))

	instruments, err := getInstruments()
	if err != nil {
		fmt.Printf("  ❌ 失败: %v\n", err)
		return
	}

	fmt.Println("  ✅ 成功获取交易产品信息！")

	futuresCount := 0
	optionCount := 0

	for _, inst := range instruments {
		if instType, ok := inst["instType"].(string); ok {
			if instType == "SWAP" {
				futuresCount++
			} else if instType == "OPTION" {
				optionCount++
			}
		}
	}

	fmt.Printf("  📊 永续合约数量: %d\n", futuresCount)
	fmt.Printf("  📊 期权产品数量: %d\n", optionCount)
	fmt.Println()
}

// 获取账户余额
func getBalance(apiKey, secretKey, passphrase string) (map[string]interface{}, error) {
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

	if code, ok := result["code"].(string); ok && code != "0" {
		msg, _ := result["msg"].(string)
		return nil, fmt.Errorf("API错误 %s: %s", code, msg)
	}

	if data, ok := result["data"].([]interface{}); ok && len(data) > 0 {
		if balanceData, ok := data[0].(map[string]interface{}); ok {
			if details, ok := balanceData["details"].([]interface{}); ok && len(details) > 0 {
				if usdtDetail, ok := details[0].(map[string]interface{}); ok {
					return map[string]interface{}{
						"total": parseFloat64(usdtDetail["totalEq"]),
						"free":  parseFloat64(usdtDetail["availBal"]),
						"used":  parseFloat64(usdtDetail["frozenBal"]),
					}, nil
				}
			}
		}
	}

	return map[string]interface{}{
		"total": 0.0,
		"free":  0.0,
		"used":  0.0,
	}, nil
}

// 获取持仓信息
func getPositions(apiKey, secretKey, passphrase string) ([]map[string]interface{}, error) {
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	requestPath := "/api/v5/account/positions"
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

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	if code, ok := result["code"].(string); ok && code != "0" {
		return nil, fmt.Errorf("API错误: %v", result["msg"])
	}

	positions, _ := result["data"].([]interface{})
	return convertToMapSlice(positions), nil
}

// 获取账户信息
func getAccountInfo(apiKey, secretKey, passphrase string) (map[string]interface{}, error) {
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	requestPath := "/api/v5/account/config"
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

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	if code, ok := result["code"].(string); ok && code != "0" {
		return nil, fmt.Errorf("API错误: %v", result["msg"])
	}

	if data, ok := result["data"].([]interface{}); ok && len(data) > 0 {
		if accountData, ok := data[0].(map[string]interface{}); ok {
			return accountData, nil
		}
	}

	return map[string]interface{}{}, nil
}

// 获取交易产品信息（公共API，无需签名）
func getInstruments() ([]map[string]interface{}, error) {
	url := "https://www.okx.com/api/v5/public/instruments?instType=SWAP"

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	if code, ok := result["code"].(string); ok && code != "0" {
		return nil, fmt.Errorf("API错误: %v", result["msg"])
	}

	instruments, _ := result["data"].([]interface{})
	return convertToMapSlice(instruments), nil
}

// 生成签名
func generateSignature(secretKey, timestamp, method, requestPath, body string) string {
	message := timestamp + strings.ToUpper(method) + requestPath + body

	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(message))
	signature := base64.StdEncoding.EncodeToString(h.Sum(nil))

	return signature
}

// 工具函数：字符串转float64
func parseFloat64(s interface{}) float64 {
	if s == nil {
		return 0.0
	}
	if str, ok := s.(string); ok {
		if f, err := strconv.ParseFloat(str, 64); err == nil {
			return f
		}
	}
	if f, ok := s.(float64); ok {
		return f
	}
	return 0.0
}

// 工具函数：隐藏敏感信息
func maskString(s string) string {
	if len(s) <= 8 {
		return strings.Repeat("*", len(s))
	}
	return s[:8] + strings.Repeat("*", len(s)-8)
}

// 工具函数：转换类型
func convertToMapSlice(slice []interface{}) []map[string]interface{} {
	result := make([]map[string]interface{}, 0, len(slice))
	for _, item := range slice {
		if m, ok := item.(map[string]interface{}); ok {
			result = append(result, m)
		}
	}
	return result
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
