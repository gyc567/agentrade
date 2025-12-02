package config

import (
	"fmt"
	"log"
)

// CreditSystemExample 积分系统使用示例
// 此文件展示了如何使用积分系统的各种功能

func CreditSystemUsageExample() {
	// 注意：这是一个示例函数，实际使用时需要传入真实的数据库实例
	// db := config.NewDatabase(databaseURL)
	// defer db.Close()

	log.Println("=== 积分系统使用示例 ===")

	// 示例1: 获取所有启用的积分套餐
	/*
		packages, err := db.GetActivePackages()
		if err != nil {
			log.Printf("获取积分套餐失败: %v", err)
			return
		}

		fmt.Println("\n📦 可用积分套餐:")
		for _, pkg := range packages {
			totalCredits := pkg.Credits + pkg.BonusCredits
			fmt.Printf("  - %s (%s): %.2f USDT\n", pkg.Name, pkg.NameEN, pkg.PriceUSDT)
			fmt.Printf("    积分: %d + %d赠送 = %d总积分\n", pkg.Credits, pkg.BonusCredits, totalCredits)
			fmt.Printf("    描述: %s\n", pkg.Description)
			if pkg.IsRecommended {
				fmt.Println("    ⭐ 推荐套餐")
			}
			fmt.Println()
		}
	*/

	// 示例2: 用户积分操作流程
	/*
		// 2.1 获取或创建用户积分账户
		credits, err := db.GetOrCreateUserCredits(userID)
		if err != nil {
			log.Printf("创建用户积分账户失败: %v", err)
			return
		}

		fmt.Printf("👤 用户积分账户: %+v\n", credits)

		// 2.2 增加积分（购买套餐后）
		purchaseAmount := 500
		err = db.AddCredits(userID, purchaseAmount, "purchase",
			"购买标准套餐", "order_abc123")
		if err != nil {
			log.Printf("增加积分失败: %v", err)
			return
		}

		fmt.Printf("✅ 成功增加 %d 积分\n", purchaseAmount)

		// 2.3 检查积分是否充足
		if db.HasEnoughCredits(userID, 100) {
			fmt.Println("✅ 积分充足，可以消费")

			// 2.4 扣减积分（使用服务）
			err = db.DeductCredits(userID, 100, "consume",
				"AI交易分析服务", "service_xyz789")
			if err != nil {
				log.Printf("扣减积分失败: %v", err)
				return
			}

			fmt.Println("✅ 成功扣减 100 积分")
		} else {
			fmt.Println("❌ 积分不足")
		}

		// 2.5 获取用户积分流水
		transactions, total, err := db.GetUserTransactions(userID, 1, 10)
		if err != nil {
			log.Printf("获取积分流水失败: %v", err)
			return
		}

		fmt.Printf("\n📊 积分流水 (共 %d 条):\n", total)
		for i, txn := range transactions {
			if i >= 5 { // 只显示前5条
				break
			}
			fmt.Printf("  [%s] %s %d积分 (余额: %d)\n",
				txn.Type, txn.Description, txn.Amount, txn.BalanceAfter)
			fmt.Printf("      类别: %s, 时间: %s\n", txn.Category, txn.CreatedAt.Format("2006-01-02 15:04:05"))
		}

		// 2.6 获取用户积分摘要
		summary, err := db.GetUserCreditSummary(userID)
		if err != nil {
			log.Printf("获取积分摘要失败: %v", err)
			return
		}

		fmt.Printf("\n📈 用户积分摘要:\n")
		fmt.Printf("  可用积分: %d\n", summary["available_credits"])
		fmt.Printf("  总积分: %d\n", summary["total_credits"])
		fmt.Printf("  已用积分: %d\n", summary["used_credits"])
		fmt.Printf("  本月消费: %d\n", summary["monthly_consumption"])
		fmt.Printf("  本月充值: %d\n", summary["monthly_recharge"])
		fmt.Printf("  总交易笔数: %d\n", summary["total_transactions"])
	*/

	// 示例3: 管理员操作
	/*
		adminID := "admin_001"

		// 3.1 管理员调整用户积分
		err = db.AdjustUserCredits(adminID, userID, 1000, "新用户奖励", "192.168.1.1")
		if err != nil {
			log.Printf("管理员调整积分失败: %v", err)
			return
		}

		fmt.Println("✅ 管理员成功调整用户积分")

		// 3.2 管理员调整积分（扣减）
		err = db.AdjustUserCredits(adminID, userID, -500, "违规处罚", "192.168.1.1")
		if err != nil {
			log.Printf("管理员扣减积分失败: %v", err)
			return
		}

		fmt.Println("✅ 管理员成功扣减用户积分")
	*/

	// 示例4: 创建自定义积分套餐
	/*
		now := time.Now()
		customPackage := &CreditPackage{
			ID:            "custom_888",
			Name:          "自定义套餐",
			NameEN:        "Custom Package",
			Description:   "888积分个性套餐",
			PriceUSDT:     66.66,
			Credits:       888,
			BonusCredits:  88,
			IsActive:      true,
			IsRecommended: false,
			SortOrder:     5,
			CreatedAt:     now,
			UpdatedAt:     now,
		}

		err = db.CreateCreditPackage(customPackage)
		if err != nil {
			log.Printf("创建自定义套餐失败: %v", err)
			return
		}

		fmt.Println("✅ 成功创建自定义积分套餐")
	*/

	fmt.Println("\n=== 积分系统使用示例完成 ===")
}

// 积分套餐管理示例
func CreditPackageManagementExample() {
	// db := config.NewDatabase(databaseURL)
	// defer db.Close()

	log.Println("\n=== 积分套餐管理示例 ===")

	// 获取所有套餐（包括禁用的）
	/*
		packages, err := db.GetAllCreditPackages()
		if err != nil {
			log.Printf("获取所有套餐失败: %v", err)
			return
		}

		fmt.Println("\n📦 所有积分套餐:")
		for _, pkg := range packages {
			status := "✅ 启用"
			if !pkg.IsActive {
				status = "❌ 禁用"
			}

			recommend := ""
			if pkg.IsRecommended {
				recommend = " ⭐"
			}

			fmt.Printf("  [%s] %s - %.2f USDT (%d积分)%s\n",
				status, pkg.Name, pkg.PriceUSDT, pkg.Credits, recommend)
		}
	*/

	// 根据ID获取套餐
	/*
		pkg, err := db.GetPackageByID("standard_500")
		if err != nil {
			log.Printf("获取套餐失败: %v", err)
			return
		}

		fmt.Printf("\n📦 套餐详情:\n")
		fmt.Printf("  ID: %s\n", pkg.ID)
		fmt.Printf("  名称: %s\n", pkg.Name)
		fmt.Printf("  英文名: %s\n", pkg.NameEN)
		fmt.Printf("  价格: %.2f USDT\n", pkg.PriceUSDT)
		fmt.Printf("  积分: %d + %d赠送\n", pkg.Credits, pkg.BonusCredits)
		fmt.Printf("  描述: %s\n", pkg.Description)
		fmt.Printf("  状态: %v\n", pkg.IsActive)
		fmt.Printf("  推荐: %v\n", pkg.IsRecommended)
		fmt.Printf("  排序: %d\n", pkg.SortOrder)
	*/

	// 更新套餐
	/*
		pkg.IsRecommended = true
		pkg.BonusCredits = 100
		pkg.UpdatedAt = time.Now()

		err = db.UpdateCreditPackage(pkg)
		if err != nil {
			log.Printf("更新套餐失败: %v", err)
			return
		}

		fmt.Println("✅ 成功更新套餐")
	*/

	// 删除套餐（软删除）
	/*
		err = db.DeleteCreditPackage("custom_888")
		if err != nil {
			log.Printf("删除套餐失败: %v", err)
			return
		}

		fmt.Println("✅ 成功删除套餐")
	*/

	fmt.Println("\n=== 积分套餐管理示例完成 ===")
}

// 错误处理示例
func CreditSystemErrorHandlingExample() {
	// db := config.NewDatabase(databaseURL)
	// defer db.Close()

	log.Println("\n=== 错误处理示例 ===")

	// 示例1: 积分不足错误
	/*
		userID := "user_error_test"
		err := db.DeductCredits(userID, 1000, "consume", "测试消费", "test_001")
		if err != nil {
			if err.Error() == "积分不足" {
				fmt.Printf("❌ 积分不足: %v\n", err)
			} else {
				log.Printf("❌ 扣减积分失败: %v", err)
			}
		}
	*/

	// 示例2: 无效数量错误
	/*
		err := db.AddCredits(userID, 0, "purchase", "测试购买", "test_002")
		if err != nil {
			fmt.Printf("❌ 增加积分失败: %v\n", err)
		}
	*/

	// 示例3: 管理员扣减积分时积分不足
	/*
		adminID := "admin_001"
		err := db.AdjustUserCredits(adminID, userID, -2000, "测试扣减", "192.168.1.100")
		if err != nil {
			if err.Error() == "积分不足" {
				fmt.Printf("❌ 管理员扣减失败: %v\n", err)
			} else {
				log.Printf("❌ 管理员操作失败: %v", err)
			}
		}
	*/

	fmt.Println("\n=== 错误处理示例完成 ===")
}

// 积分流水分析示例
func CreditTransactionAnalysisExample() {
	// db := config.NewDatabase(databaseURL)
	// defer db.Close()

	log.Println("\n=== 积分流水分析示例 ===")

	// 示例: 获取用户积分流水并进行简单分析
	/*
		userID := "user_analysis_test"
		transactions, total, err := db.GetUserTransactions(userID, 1, 100)
		if err != nil {
			log.Printf("获取积分流水失败: %v", err)
			return
		}

		var totalCredit, totalDebit int
		var categoryStats map[string]int = make(map[string]int)

		fmt.Printf("\n📊 用户 %s 积分流水分析 (共 %d 条):\n", userID, total)

		for _, txn := range transactions {
			if txn.Type == "credit" {
				totalCredit += txn.Amount
			} else {
				totalDebit += txn.Amount
			}

			categoryStats[txn.Category]++
		}

		fmt.Printf("  总充值: %d 积分\n", totalCredit)
		fmt.Printf("  总消费: %d 积分\n", totalDebit)
		fmt.Printf("  净增: %d 积分\n", totalCredit-totalDebit)

		fmt.Println("\n  消费类别统计:")
		for category, count := range categoryStats {
			fmt.Printf("    %s: %d 笔\n", category, count)
		}

		// 最近5笔流水
		fmt.Println("\n  最近5笔流水:")
		for i, txn := range transactions {
			if i >= 5 {
				break
			}
			action := "⬆️ 充值"
			if txn.Type == "debit" {
				action = "⬇️ 消费"
			}
			fmt.Printf("    %s %s %d积分 (余额: %d) - %s\n",
				action, txn.Description, txn.Amount, txn.BalanceAfter, txn.CreatedAt.Format("2006-01-02 15:04:05"))
		}
	*/

	fmt.Println("\n=== 积分流水分析示例完成 ===")
}

// 完整的用户购买套餐流程示例
func CompletePurchaseFlowExample() {
	// db := config.NewDatabase(databaseURL)
	// defer db.Close()

	log.Println("\n=== 完整购买套餐流程示例 ===")

	/*
		// Step 1: 检查套餐是否存在
		userID := "user_purchase_test"
		packageID := "standard_500"
		pkg, err := db.GetPackageByID(packageID)
		if err != nil {
			log.Printf("获取套餐失败: %v", err)
			return
		}

		fmt.Printf("📦 选择的套餐: %s\n", pkg.Name)
		fmt.Printf("   价格: %.2f USDT\n", pkg.PriceUSDT)
		fmt.Printf("   积分: %d + %d赠送 = %d总积分\n",
			pkg.Credits, pkg.BonusCredits, pkg.Credits+pkg.BonusCredits)

		// Step 2: 这里应该是支付流程，支付成功后继续...
		fmt.Println("\n💳 [支付流程] 模拟支付 %.2f USDT...", pkg.PriceUSDT)
		// 支付成功，获取支付订单ID
		paymentOrderID := "payment_" + GenerateUUID()
		fmt.Println("✅ 支付成功，订单ID:", paymentOrderID)

		// Step 3: 计算实际获得的积分
		totalCredits := pkg.Credits + pkg.BonusCredits
		fmt.Printf("\n💰 支付成功! 获得 %d 积分\n", totalCredits)

		// Step 4: 为用户增加积分
		err = db.AddCredits(userID, totalCredits, "purchase",
			fmt.Sprintf("购买套餐: %s", pkg.Name), paymentOrderID)
		if err != nil {
			log.Printf("增加积分失败: %v", err)
			return
		}

		fmt.Printf("✅ 成功为用户 %s 增加 %d 积分\n", userID, totalCredits)

		// Step 5: 验证积分到账
		credits, err := db.GetUserCredits(userID)
		if err != nil {
			log.Printf("获取用户积分失败: %v", err)
			return
		}

		fmt.Printf("\n💳 当前积分余额: %d 积分\n", credits.AvailableCredits)

		// Step 6: 记录订单完成状态（在实际应用中）
		fmt.Println("\n📝 [订单系统] 标记订单为已完成状态")
	*/

	fmt.Println("\n=== 完整购买套餐流程示例完成 ===")
}

func main() {
	// 运行所有示例
	CreditSystemUsageExample()
	CreditPackageManagementExample()
	CreditSystemErrorHandlingExample()
	CreditTransactionAnalysisExample()
	CompletePurchaseFlowExample()

	fmt.Println("\n🎉 所有积分系统示例运行完成!")
}
