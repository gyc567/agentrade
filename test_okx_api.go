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
	fmt.Println("🧪 OKX API 接口测试工具")
	fmt.Println("==================================")
	fmt.Println()

	// 加载.env.local文件
	loadEnvFile(".env.local")

	// 读取环境变量
	apiKey := os.Getenv("OKX_API_KEY")
	secretKey := os.Getenv("OKX_SECRET_KEY")
	passphrase := os.Getenv("OKX_PASSPHASE")

	// 验证配置
	fmt.Println("📋 配置检查:")
	if apiKey == "" {
		fmt.Println("  ❌ OKX_API_KEY 未设置")
		fmt.Println()
		fmt.Println("💡 请在 .env.local 文件中添加:")
		fmt.Println("   OKX_API_KEY=your_api_key")
		return
	} else {
		fmt.Printf("  ✅ API Key: %s****\n", maskString(apiKey))
	}

	if secretKey == "" {
		fmt.Println("  ❌ OKX_SECRET_KEY 未设置")
		return
	} else {
		fmt.Printf("  ✅ Secret Key: %s****\n", maskString(secretKey))
	}

	if passphrase == "" {
		fmt.Println("  ❌ OKX_PASSPHASE 未设置")
		return
	} else {
		fmt.Printf("  ✅ Passphrase: %s****\n", maskString(passphrase))
	}

	fmt.Println()
	fmt.Println("🔌 测试1: 获取账户余额")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// 测试获取余额
	balance, err := getBalance(apiKey, secretKey, passphrase)
	if err != nil {
		fmt.Printf("  ❌ 获取余额失败: %v\n", err)
		return
	}

	fmt.Println("  ✅ 获取余额成功！")
	fmt.Println()
	fmt.Println("📊 余额详情:")
	fmt.Println("  " + strings.Repeat("─", 30))

	if total, ok := balance["total"].(float64); ok {
		fmt.Printf("  总资产: %.8f USDT\n", total)
	}
	if free, ok := balance["free"].(float64); ok {
		fmt.Printf("  可用余额: %.8f USDT\n", free)
	}
	if used, ok := balance["used"].(float64); ok {
		fmt.Printf("  已用余额: %.8f USDT\n", used)
	}

	fmt.Println("  " + strings.Repeat("─", 30))

	fmt.Println()
	fmt.Println("🔌 测试2: 获取持仓信息")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━")

	positions, err := getPositions(apiKey, secretKey, passphrase)
	if err != nil {
		fmt.Printf("  ❌ 获取持仓失败: %v\n", err)
	} else {
		fmt.Println("  ✅ 获取持仓成功！")
		if len(positions) == 0 {
			fmt.Println("    📝 当前无持仓")
		} else {
			fmt.Printf("    📊 共有 %d 个持仓\n", len(positions))
		}
	}

	fmt.Println()
	fmt.Println("🔌 测试3: 获取交易账户配置")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━")

	account, err := getAccountInfo(apiKey, secretKey, passphrase)
	if err != nil {
		fmt.Printf("  ❌ 获取账户信息失败: %v\n", err)
	} else {
		fmt.Println("  ✅ 获取账户信息成功！")
		if accountType, ok := account["accountType"].(string); ok {
			fmt.Printf("    账户类型: %s\n", accountType)
		}
	}

	fmt.Println()
	fmt.Println("🎉 所有测试完成！")
	fmt.Println()
	fmt.Println("📈 API连接状态: ✅ 正常")
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

	// 设置请求头
	req.Header.Set("OK-ACCESS-KEY", apiKey)
	req.Header.Set("OK-ACCESS-SIGN", signature)
	req.Header.Set("OK-ACCESS-TIMESTAMP", timestamp)
	req.Header.Set("OK-ACCESS-PASSPHRASE", passphrase)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP请求失败: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API返回错误: %d - %s", resp.StatusCode, string(bodyBytes))
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &result); err != nil {
		return nil, err
	}

	// 解析OKX响应格式
	if code, ok := result["code"].(string); ok && code != "0" {
		return nil, fmt.Errorf("API错误码: %s, 消息: %v", code, result["msg"])
	}

	// 提取余额数据
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
		return // 文件不存在就跳过
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		// 跳过注释和空行
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// 查找=号
		idx := strings.Index(line, "=")
		if idx == -1 {
			continue
		}

		key := strings.TrimSpace(line[:idx])
		value := strings.TrimSpace(line[idx+1:])

		// 去掉引号
		if strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"") {
			value = value[1 : len(value)-1]
		}
		if strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'") {
			value = value[1 : len(value)-1]
		}

		// 设置环境变量（如果尚未设置）
		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, value)
		}
	}
}
