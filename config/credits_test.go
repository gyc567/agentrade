package config

import (
	"os"
	"testing"
	"time"
)

// 测试用例需要设置环境变量:
// export DATABASE_URL="postgres://user:pass@localhost/nofx"

// TestCreditPackageOperations 测试积分套餐操作
func TestCreditPackageOperations(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	// 创建测试套餐
	now := time.Now()
	testPackage := &CreditPackage{
		ID:            "test_pkg_" + GenerateUUID()[:8],
		Name:          "测试套餐",
		NameEN:        "Test Package",
		Description:   "这是一个测试套餐",
		PriceUSDT:     9.99,
		Credits:       100,
		BonusCredits:  10,
		IsActive:      true,
		IsRecommended: false,
		SortOrder:     100,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	// 测试创建套餐
	t.Run("CreateCreditPackage", func(t *testing.T) {
		err := db.CreateCreditPackage(testPackage)
		if err != nil {
			t.Fatalf("创建套餐失败: %v", err)
		}
		t.Logf("✅ 创建套餐成功: %s", testPackage.ID)
	})

	// 测试获取套餐
	t.Run("GetPackageByID", func(t *testing.T) {
		pkg, err := db.GetPackageByID(testPackage.ID)
		if err != nil {
			t.Fatalf("获取套餐失败: %v", err)
		}
		if pkg.Name != testPackage.Name {
			t.Errorf("套餐名称不匹配: expected %s, got %s", testPackage.Name, pkg.Name)
		}
		t.Logf("✅ 获取套餐成功: %s", pkg.Name)
	})

	// 测试更新套餐
	t.Run("UpdateCreditPackage", func(t *testing.T) {
		testPackage.BonusCredits = 20
		testPackage.IsRecommended = true
		testPackage.UpdatedAt = time.Now()

		err := db.UpdateCreditPackage(testPackage)
		if err != nil {
			t.Fatalf("更新套餐失败: %v", err)
		}

		// 验证更新结果
		pkg, err := db.GetPackageByID(testPackage.ID)
		if err != nil {
			t.Fatalf("获取更新后的套餐失败: %v", err)
		}
		if pkg.BonusCredits != 20 {
			t.Errorf("BonusCredits更新失败: expected 20, got %d", pkg.BonusCredits)
		}
		if !pkg.IsRecommended {
			t.Error("IsRecommended更新失败")
		}
		t.Log("✅ 更新套餐成功")
	})

	// 测试软删除
	t.Run("DeleteCreditPackage", func(t *testing.T) {
		err := db.DeleteCreditPackage(testPackage.ID)
		if err != nil {
			t.Fatalf("删除套餐失败: %v", err)
		}

		// 验证删除结果
		packages, err := db.GetActivePackages()
		if err != nil {
			t.Fatalf("获取启用套餐失败: %v", err)
		}

		for _, pkg := range packages {
			if pkg.ID == testPackage.ID {
				t.Error("套餐应该已被禁用，但仍出现在启用列表中")
			}
		}
		t.Log("✅ 删除套餐成功")
	})

	// 清理测试数据
	db.exec("DELETE FROM credit_packages WHERE id = $1", testPackage.ID)
}

// TestUserCreditsOperations 测试用户积分操作
func TestUserCreditsOperations(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	userID := "test_user_" + GenerateUUID()[:8]

	// 测试获取或创建用户积分账户
	t.Run("GetOrCreateUserCredits", func(t *testing.T) {
		credits, err := db.GetOrCreateUserCredits(userID)
		if err != nil {
			t.Fatalf("创建用户积分账户失败: %v", err)
		}
		if credits.UserID != userID {
			t.Errorf("UserID不匹配: expected %s, got %s", userID, credits.UserID)
		}
		if credits.AvailableCredits != 0 {
			t.Errorf("初始可用积分应为0: got %d", credits.AvailableCredits)
		}
		t.Logf("✅ 创建用户积分账户成功: %s", userID)
	})

	// 测试增加积分
	t.Run("AddCredits", func(t *testing.T) {
		amount := 500
		err := db.AddCredits(userID, amount, "purchase",
			"测试购买", "order_test_001")
		if err != nil {
			t.Fatalf("增加积分失败: %v", err)
		}

		// 验证结果
		credits, err := db.GetUserCredits(userID)
		if err != nil {
			t.Fatalf("获取用户积分失败: %v", err)
		}
		if credits.AvailableCredits != amount {
			t.Errorf("可用积分不匹配: expected %d, got %d", amount, credits.AvailableCredits)
		}
		if credits.TotalCredits != amount {
			t.Errorf("总积分不匹配: expected %d, got %d", amount, credits.TotalCredits)
		}
		t.Logf("✅ 增加积分成功: %d", amount)
	})

	// 测试扣减积分
	t.Run("DeductCredits", func(t *testing.T) {
		amount := 200
		err := db.DeductCredits(userID, amount, "consume",
			"测试消费", "service_test_001")
		if err != nil {
			t.Fatalf("扣减积分失败: %v", err)
		}

		// 验证结果
		credits, err := db.GetUserCredits(userID)
		if err != nil {
			t.Fatalf("获取用户积分失败: %v", err)
		}
		if credits.AvailableCredits != 300 {
			t.Errorf("可用积分不匹配: expected 300, got %d", credits.AvailableCredits)
		}
		if credits.UsedCredits != 200 {
			t.Errorf("已用积分不匹配: expected 200, got %d", credits.UsedCredits)
		}
		t.Logf("✅ 扣减积分成功: %d", amount)
	})

	// 测试积分不足
	t.Run("InsufficientCredits", func(t *testing.T) {
		err := db.DeductCredits(userID, 1000, "consume",
			"测试消费", "service_test_002")
		if err == nil {
			t.Error("应该返回积分不足错误")
		}
		if err != nil && err.Error() != "积分不足" {
			t.Errorf("错误信息不匹配: expected '积分不足', got '%s'", err.Error())
		}
		t.Log("✅ 正确检测积分不足")
	})

	// 测试HasEnoughCredits
	t.Run("HasEnoughCredits", func(t *testing.T) {
		if !db.HasEnoughCredits(userID, 100) {
			t.Error("应该返回积分充足")
		}
		if db.HasEnoughCredits(userID, 500) {
			t.Error("应该返回积分不足")
		}
		t.Log("✅ HasEnoughCredits检查正确")
	})

	// 清理测试数据
	db.exec("DELETE FROM user_credits WHERE user_id = $1", userID)
	db.exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
}

// TestCreditTransactions 测试积分流水
func TestCreditTransactions(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	userID := "test_txn_" + GenerateUUID()[:8]

	// 准备测试数据
	db.GetOrCreateUserCredits(userID)
	db.AddCredits(userID, 1000, "purchase", "测试购买", "order_test")
	db.DeductCredits(userID, 300, "consume", "测试消费", "service_test")

	// 测试获取积分流水
	t.Run("GetUserTransactions", func(t *testing.T) {
		transactions, total, err := db.GetUserTransactions(userID, 1, 10)
		if err != nil {
			t.Fatalf("获取积分流水失败: %v", err)
		}
		if total < 2 {
			t.Errorf("积分流水数量应该至少2条: got %d", total)
		}
		if len(transactions) == 0 {
			t.Error("积分流水不应为空")
		}

		// 验证第一笔流水（最新的）
		txn := transactions[0]
		if txn.UserID != userID {
			t.Errorf("UserID不匹配: expected %s, got %s", userID, txn.UserID)
		}
		if txn.Type != "debit" {
			t.Errorf("第一笔流水应该是debit: got %s", txn.Type)
		}
		if txn.Amount != 300 {
			t.Errorf("流水金额不匹配: expected 300, got %d", txn.Amount)
		}

		t.Logf("✅ 获取积分流水成功: 共 %d 条", total)
	})

	// 测试获取积分摘要
	t.Run("GetUserCreditSummary", func(t *testing.T) {
		summary, err := db.GetUserCreditSummary(userID)
		if err != nil {
			t.Fatalf("获取积分摘要失败: %v", err)
		}

		availableCredits, ok := summary["available_credits"].(int)
		if !ok {
			t.Error("available_credits类型转换失败")
		}
		if availableCredits != 700 {
			t.Errorf("可用积分不匹配: expected 700, got %d", availableCredits)
		}

		monthlyConsumption, ok := summary["monthly_consumption"].(int)
		if !ok {
			t.Error("monthly_consumption类型转换失败")
		}
		if monthlyConsumption < 0 {
			t.Error("本月消费不应为负数")
		}

		t.Log("✅ 获取积分摘要成功")
	})

	// 清理测试数据
	db.exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestAdminAdjustCredits 测试管理员调整积分
func TestAdminAdjustCredits(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	adminID := "admin_test"
	userID := "test_user_" + GenerateUUID()[:8]

	// 准备测试数据
	db.GetOrCreateUserCredits(userID)
	db.AddCredits(userID, 500, "purchase", "测试购买", "order_test")

	// 测试管理员增加积分
	t.Run("AdminAddCredits", func(t *testing.T) {
		err := db.AdjustUserCredits(adminID, userID, 1000, "新用户奖励", "192.168.1.1")
		if err != nil {
			t.Fatalf("管理员增加积分失败: %v", err)
		}

		// 验证结果
		credits, err := db.GetUserCredits(userID)
		if err != nil {
			t.Fatalf("获取用户积分失败: %v", err)
		}
		if credits.AvailableCredits != 1500 {
			t.Errorf("可用积分不匹配: expected 1500, got %d", credits.AvailableCredits)
		}

		t.Log("✅ 管理员增加积分成功")
	})

	// 测试管理员扣减积分
	t.Run("AdminDeductCredits", func(t *testing.T) {
		err := db.AdjustUserCredits(adminID, userID, -300, "违规处罚", "192.168.1.1")
		if err != nil {
			t.Fatalf("管理员扣减积分失败: %v", err)
		}

		// 验证结果
		credits, err := db.GetUserCredits(userID)
		if err != nil {
			t.Fatalf("获取用户积分失败: %v", err)
		}
		if credits.AvailableCredits != 1200 {
			t.Errorf("可用积分不匹配: expected 1200, got %d", credits.AvailableCredits)
		}

		t.Log("✅ 管理员扣减积分成功")
	})

	// 测试管理员扣减积分不足
	t.Run("AdminDeductInsufficient", func(t *testing.T) {
		err := db.AdjustUserCredits(adminID, userID, -2000, "严重违规", "192.168.1.1")
		if err == nil {
			t.Error("应该返回积分不足错误")
		}
		if err != nil && err.Error() != "积分不足" {
			t.Errorf("错误信息不匹配: expected '积分不足', got '%s'", err.Error())
		}

		t.Log("✅ 正确检测管理员扣减积分不足")
	})

	// 清理测试数据
	db.exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}

// TestGetActivePackages 测试获取启用套餐
func TestGetActivePackages(t *testing.T) {
	if os.Getenv("DATABASE_URL") == "" {
		t.Skip("跳过测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := NewDatabase("")
	if err != nil {
		t.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	t.Run("GetActivePackages", func(t *testing.T) {
		packages, err := db.GetActivePackages()
		if err != nil {
			t.Fatalf("获取启用套餐失败: %v", err)
		}
		if len(packages) == 0 {
			t.Error("应该至少有一个启用的套餐")
		}

		// 验证所有套餐都是启用状态
		for _, pkg := range packages {
			if !pkg.IsActive {
				t.Errorf("套餐 %s 应该都是启用状态", pkg.ID)
			}
		}

		t.Logf("✅ 获取启用套餐成功: 共 %d 个", len(packages))
	})

	t.Run("GetAllCreditPackages", func(t *testing.T) {
		packages, err := db.GetAllCreditPackages()
		if err != nil {
			t.Fatalf("获取所有套餐失败: %v", err)
		}
		if len(packages) == 0 {
			t.Error("应该至少有一个套餐")
		}

		t.Logf("✅ 获取所有套餐成功: 共 %d 个", len(packages))
	})
}

// 基准测试
func BenchmarkAddCredits(b *testing.B) {
	if os.Getenv("DATABASE_URL") == "" {
		b.Skip("跳过基准测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := NewDatabase("")
	if err != nil {
		b.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	userID := "bench_user"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		userID := userID + "_" + GenerateUUID()[:8]
		db.GetOrCreateUserCredits(userID)
		db.AddCredits(userID, 100, "purchase", "基准测试", "bench_"+GenerateUUID()[:8])

		// 清理
		db.exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
		db.exec("DELETE FROM user_credits WHERE user_id = $1", userID)
	}
}

func BenchmarkGetUserTransactions(b *testing.B) {
	if os.Getenv("DATABASE_URL") == "" {
		b.Skip("跳过基准测试：未设置 DATABASE_URL 环境变量")
	}

	db, err := NewDatabase("")
	if err != nil {
		b.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	userID := "bench_txn_" + GenerateUUID()[:8]

	// 准备测试数据
	db.GetOrCreateUserCredits(userID)
	for i := 0; i < 100; i++ {
		if i%2 == 0 {
			db.AddCredits(userID, 100, "purchase", "基准测试", "bench_"+GenerateUUID()[:8])
		} else {
			db.DeductCredits(userID, 50, "consume", "基准测试", "bench_"+GenerateUUID()[:8])
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, err := db.GetUserTransactions(userID, 1, 10)
		if err != nil {
			b.Fatalf("获取积分流水失败: %v", err)
		}
	}

	// 清理
	db.exec("DELETE FROM credit_transactions WHERE user_id = $1", userID)
	db.exec("DELETE FROM user_credits WHERE user_id = $1", userID)
}
