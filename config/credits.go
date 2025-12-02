package config

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

// CreditPackage 积分套餐
type CreditPackage struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	NameEN        string    `json:"name_en"`
	Description   string    `json:"description"`
	PriceUSDT     float64   `json:"price_usdt"`
	Credits       int       `json:"credits"`
	BonusCredits  int       `json:"bonus_credits"`
	IsActive      bool      `json:"is_active"`
	IsRecommended bool      `json:"is_recommended"`
	SortOrder     int       `json:"sort_order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// UserCredits 用户积分账户
type UserCredits struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	AvailableCredits int       `json:"available_credits"`
	TotalCredits     int       `json:"total_credits"`
	UsedCredits      int       `json:"used_credits"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// CreditTransaction 积分流水
type CreditTransaction struct {
	ID            string    `json:"id"`
	UserID        string    `json:"user_id"`
	Type          string    `json:"type"` // credit/debit
	Amount        int       `json:"amount"`
	BalanceBefore int       `json:"balance_before"`
	BalanceAfter  int       `json:"balance_after"`
	Category      string    `json:"category"` // purchase/consume/gift/refund/admin
	Description   string    `json:"description"`
	ReferenceID   string    `json:"reference_id"`
	CreatedAt     time.Time `json:"created_at"`
}

// transactionResult 用于 withRetry 的返回结构
type transactionResult struct {
	Transactions []*CreditTransaction
	Total        int
}

// GetActivePackages 获取所有启用的套餐
func (d *Database) GetActivePackages() ([]*CreditPackage, error) {
	return withRetry(func() ([]*CreditPackage, error) {
		rows, err := d.query(`
			SELECT id, name, name_en, description, price_usdt, credits, bonus_credits,
				   is_active, is_recommended, sort_order, created_at, updated_at
			FROM credit_packages
			WHERE is_active = true
			ORDER BY sort_order ASC, created_at ASC
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		packages := make([]*CreditPackage, 0)
		for rows.Next() {
			var pkg CreditPackage
			err := rows.Scan(
				&pkg.ID, &pkg.Name, &pkg.NameEN, &pkg.Description, &pkg.PriceUSDT,
				&pkg.Credits, &pkg.BonusCredits, &pkg.IsActive, &pkg.IsRecommended,
				&pkg.SortOrder, &pkg.CreatedAt, &pkg.UpdatedAt,
			)
			if err != nil {
				return nil, err
			}
			packages = append(packages, &pkg)
		}

		return packages, nil
	})
}

// GetPackageByID 根据ID获取套餐
func (d *Database) GetPackageByID(id string) (*CreditPackage, error) {
	return withRetry(func() (*CreditPackage, error) {
		var pkg CreditPackage
		err := d.queryRow(`
			SELECT id, name, name_en, description, price_usdt, credits, bonus_credits,
				   is_active, is_recommended, sort_order, created_at, updated_at
			FROM credit_packages WHERE id = $1
		`, id).Scan(
			&pkg.ID, &pkg.Name, &pkg.NameEN, &pkg.Description, &pkg.PriceUSDT,
			&pkg.Credits, &pkg.BonusCredits, &pkg.IsActive, &pkg.IsRecommended,
			&pkg.SortOrder, &pkg.CreatedAt, &pkg.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		return &pkg, nil
	})
}

// GetUserCredits 获取用户积分（不存在则返回nil）
func (d *Database) GetUserCredits(userID string) (*UserCredits, error) {
	return withRetry(func() (*UserCredits, error) {
		var credits UserCredits
		err := d.queryRow(`
			SELECT id, user_id, available_credits, total_credits, used_credits, created_at, updated_at
			FROM user_credits WHERE user_id = $1
		`, userID).Scan(
			&credits.ID, &credits.UserID, &credits.AvailableCredits,
			&credits.TotalCredits, &credits.UsedCredits, &credits.CreatedAt, &credits.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		return &credits, nil
	})
}

// GetOrCreateUserCredits 获取或创建用户积分账户 (使用 UPSERT)
func (d *Database) GetOrCreateUserCredits(userID string) (*UserCredits, error) {
	return withRetry(func() (*UserCredits, error) {
		var credits UserCredits
		var id string

		err := d.queryRow(`
			INSERT INTO user_credits (id, user_id, available_credits, total_credits, used_credits, created_at, updated_at)
			VALUES ($1, $2, 0, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
			RETURNING id, user_id, available_credits, total_credits, used_credits, created_at, updated_at
		`, GenerateUUID(), userID).Scan(
			&id, &credits.UserID, &credits.AvailableCredits,
			&credits.TotalCredits, &credits.UsedCredits, &credits.CreatedAt, &credits.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("创建用户积分账户失败: %w", err)
		}

		credits.ID = id
		return &credits, nil
	})
}

// AddCredits 增加积分（事务，带流水记录）
func (d *Database) AddCredits(userID string, amount int, category, description, refID string) error {
	if amount <= 0 {
		return fmt.Errorf("增加积分数量必须大于0")
	}

	_, err := withRetry(func() (bool, error) {
		// 开始事务
		tx, err := d.db.Begin()
		if err != nil {
			return false, fmt.Errorf("开始事务失败: %w", err)
		}
		defer tx.Rollback()

		// 获取当前积分并锁定行
		var availableCredits, totalCredits int
		var userCreditsID string
		err = tx.QueryRow(`
			SELECT id, available_credits, total_credits
			FROM user_credits
			WHERE user_id = $1
			FOR UPDATE
		`, userID).Scan(&userCreditsID, &availableCredits, &totalCredits)
		if err != nil {
			return false, fmt.Errorf("锁定用户积分记录失败: %w", err)
		}

		// 计算新的积分
		newAvailableCredits := availableCredits + amount
		newTotalCredits := totalCredits + amount

		// 更新用户积分
		_, err = tx.Exec(`
			UPDATE user_credits
			SET available_credits = $1, total_credits = $2, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = $3
		`, newAvailableCredits, newTotalCredits, userID)
		if err != nil {
			return false, fmt.Errorf("更新用户积分失败: %w", err)
		}

		// 记录积分流水
		_, err = tx.Exec(`
			INSERT INTO credit_transactions
			(id, user_id, type, amount, balance_before, balance_after, category, description, reference_id, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
		`, GenerateUUID(), userID, "credit", amount, availableCredits, newAvailableCredits,
			category, description, refID)
		if err != nil {
			return false, fmt.Errorf("记录积分流水失败: %w", err)
		}

		// 提交事务
		if err := tx.Commit(); err != nil {
			return false, fmt.Errorf("提交事务失败: %w", err)
		}

		log.Printf("✅ 用户 %s 增加积分 %d (类别: %s)", userID, amount, category)
		return true, nil
	})
	return err
}

// DeductCredits 扣减积分（事务，带流水记录，检查余额）
func (d *Database) DeductCredits(userID string, amount int, category, description, refID string) error {
	if amount <= 0 {
		return fmt.Errorf("扣减积分数量必须大于0")
	}

	_, err := withRetry(func() (bool, error) {
		// 开始事务
		tx, err := d.db.Begin()
		if err != nil {
			return false, fmt.Errorf("开始事务失败: %w", err)
		}
		defer tx.Rollback()

		// 获取当前积分并锁定行
		var availableCredits, totalCredits int
		var userCreditsID string
		err = tx.QueryRow(`
			SELECT id, available_credits, total_credits
			FROM user_credits
			WHERE user_id = $1
			FOR UPDATE
		`, userID).Scan(&userCreditsID, &availableCredits, &totalCredits)
		if err != nil {
			return false, fmt.Errorf("锁定用户积分记录失败: %w", err)
		}

		// 检查积分是否充足
		if availableCredits < amount {
			return false, fmt.Errorf("积分不足: 当前可用积分 %d，需要 %d", availableCredits, amount)
		}

		// 计算新的积分
		newAvailableCredits := availableCredits - amount
		newUsedCredits := totalCredits - availableCredits + amount // 实际使用的积分增加

		// 更新用户积分
		_, err = tx.Exec(`
			UPDATE user_credits
			SET available_credits = $1, used_credits = $2, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = $3
		`, newAvailableCredits, newUsedCredits, userID)
		if err != nil {
			return false, fmt.Errorf("更新用户积分失败: %w", err)
		}

		// 记录积分流水
		_, err = tx.Exec(`
			INSERT INTO credit_transactions
			(id, user_id, type, amount, balance_before, balance_after, category, description, reference_id, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
		`, GenerateUUID(), userID, "debit", amount, availableCredits, newAvailableCredits,
			category, description, refID)
		if err != nil {
			return false, fmt.Errorf("记录积分流水失败: %w", err)
		}

		// 提交事务
		if err := tx.Commit(); err != nil {
			return false, fmt.Errorf("提交事务失败: %w", err)
		}

		log.Printf("✅ 用户 %s 扣减积分 %d (类别: %s)", userID, amount, category)
		return true, nil
	})
	return err
}

// HasEnoughCredits 检查积分是否充足
func (d *Database) HasEnoughCredits(userID string, amount int) bool {
	var availableCredits int
	err := d.queryRow(`
		SELECT available_credits FROM user_credits WHERE user_id = $1
	`, userID).Scan(&availableCredits)

	if err != nil {
		log.Printf("⚠️ 获取用户积分失败: %v", err)
		return false
	}

	return availableCredits >= amount
}

// GetUserTransactions 获取用户积分流水（分页）
func (d *Database) GetUserTransactions(userID string, page, limit int) ([]*CreditTransaction, int, error) {
	// 参数验证
	if limit > 100 {
		limit = 100
	}
	if page < 1 {
		page = 1
	}

	// 计算偏移量
	offset := (page - 1) * limit

	result, err := withRetry(func() (transactionResult, error) {
		// 获取总数
		var total int
		err := d.queryRow(`
			SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1
		`, userID).Scan(&total)
		if err != nil {
			return transactionResult{}, fmt.Errorf("获取积分流水总数失败: %w", err)
		}

		// 获取积分流水
		rows, err := d.query(`
			SELECT id, user_id, type, amount, balance_before, balance_after,
				   category, description, reference_id, created_at
			FROM credit_transactions
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3
		`, userID, limit, offset)
		if err != nil {
			return transactionResult{}, fmt.Errorf("查询积分流水失败: %w", err)
		}
		defer rows.Close()

		transactions := make([]*CreditTransaction, 0)
		for rows.Next() {
			var txn CreditTransaction
			err := rows.Scan(
				&txn.ID, &txn.UserID, &txn.Type, &txn.Amount,
				&txn.BalanceBefore, &txn.BalanceAfter,
				&txn.Category, &txn.Description, &txn.ReferenceID, &txn.CreatedAt,
			)
			if err != nil {
				return transactionResult{}, fmt.Errorf("扫描积分流水数据失败: %w", err)
			}
			transactions = append(transactions, &txn)
		}

		return transactionResult{
			Transactions: transactions,
			Total:        total,
		}, nil
	})
	if err != nil {
		return nil, 0, err
	}
	return result.Transactions, result.Total, nil
}

// AdjustUserCredits 管理员调整积分（需记录审计日志）
func (d *Database) AdjustUserCredits(adminID, userID string, amount int, reason, ipAddress string) error {
	if amount == 0 {
		return fmt.Errorf("调整积分数量不能为0")
	}

	// 确定操作类型
	operation := "增加"
	if amount < 0 {
		operation = "扣减"
	}

	description := fmt.Sprintf("管理员 %s %s 积分: %s (原因: %s)",
		adminID, operation, userID, reason)

	// 记录审计日志
	auditDetails := fmt.Sprintf("操作: %s, 目标用户: %s, 积分数量: %d, 原因: %s",
		operation, userID, amount, reason)
	if err := d.CreateAuditLog(&adminID, "ADMIN_ADJUST_CREDITS", ipAddress, "", true, auditDetails); err != nil {
		log.Printf("⚠️ 记录审计日志失败: %v", err)
	}

	_, err := withRetry(func() (bool, error) {
		// 开始事务
		tx, err := d.db.Begin()
		if err != nil {
			return false, fmt.Errorf("开始事务失败: %w", err)
		}
		defer tx.Rollback()

		// 获取或创建用户积分账户
		var userCreditsID int
		var availableCredits, totalCredits, usedCredits int
		var createdAt, updatedAt time.Time

		err = tx.QueryRow(`
			SELECT id, available_credits, total_credits, used_credits, created_at, updated_at
			FROM user_credits
			WHERE user_id = $1
			FOR UPDATE
		`, userID).Scan(&userCreditsID, &availableCredits, &totalCredits, &usedCredits, &createdAt, &updatedAt)

		var isNewAccount bool
		if err != nil {
			if err == sql.ErrNoRows {
				// 用户没有积分账户，创建新的
				isNewAccount = true
				availableCredits = 0
				totalCredits = 0
				usedCredits = 0
				createdAt = time.Now()
				updatedAt = time.Now()
			} else {
				return false, fmt.Errorf("查询用户积分记录失败: %w", err)
			}
		}

		var newAvailableCredits, newTotalCredits, newUsedCredits int
		var txnType, category string

		if amount > 0 {
			// 增加积分
			newAvailableCredits = availableCredits + amount
			newTotalCredits = totalCredits + amount
			newUsedCredits = usedCredits
			txnType = "credit"
			category = "admin"
		} else {
			// 扣减积分
			if availableCredits < -amount {
				return false, fmt.Errorf("积分不足: 当前可用积分 %d，需要扣减 %d", availableCredits, -amount)
			}
			newAvailableCredits = availableCredits + amount
			newTotalCredits = totalCredits
			newUsedCredits = usedCredits - amount // 实际使用的积分增加
			txnType = "debit"
			category = "admin"
		}

		if isNewAccount {
			// 创建新的积分账户
			_, err = tx.Exec(`
				INSERT INTO user_credits
				(id, user_id, available_credits, total_credits, used_credits, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
			`, GenerateUUID(), userID, newAvailableCredits, newTotalCredits, newUsedCredits, createdAt, updatedAt)
		} else {
			// 更新现有积分账户
			_, err = tx.Exec(`
				UPDATE user_credits
				SET available_credits = $1, total_credits = $2, used_credits = $3, updated_at = CURRENT_TIMESTAMP
				WHERE user_id = $4
			`, newAvailableCredits, newTotalCredits, newUsedCredits, userID)
		}

		if err != nil {
			return false, fmt.Errorf("更新用户积分失败: %w", err)
		}

		// 记录积分流水
		_, err = tx.Exec(`
			INSERT INTO credit_transactions
			(id, user_id, type, amount, balance_before, balance_after, category, description, reference_id, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
		`, GenerateUUID(), userID, txnType, amount, availableCredits, newAvailableCredits,
			category, description, adminID)
		if err != nil {
			return false, fmt.Errorf("记录积分流水失败: %w", err)
		}

		// 提交事务
		if err := tx.Commit(); err != nil {
			return false, fmt.Errorf("提交事务失败: %w", err)
		}

		log.Printf("✅ 管理员 %s %s 用户 %s 积分 %d (原因: %s)",
			adminID, operation, userID, amount, reason)
		return true, nil
	})
	return err
}

// CreateCreditPackage 创建积分套餐
func (d *Database) CreateCreditPackage(pkg *CreditPackage) error {
	_, err := d.exec(`
		INSERT INTO credit_packages
		(id, name, name_en, description, price_usdt, credits, bonus_credits,
		 is_active, is_recommended, sort_order, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, pkg.ID, pkg.Name, pkg.NameEN, pkg.Description, pkg.PriceUSDT,
		pkg.Credits, pkg.BonusCredits, pkg.IsActive, pkg.IsRecommended,
		pkg.SortOrder, pkg.CreatedAt, pkg.UpdatedAt)
	return err
}

// UpdateCreditPackage 更新积分套餐
func (d *Database) UpdateCreditPackage(pkg *CreditPackage) error {
	_, err := d.exec(`
		UPDATE credit_packages SET
			name = $1, name_en = $2, description = $3, price_usdt = $4,
			credits = $5, bonus_credits = $6, is_active = $7, is_recommended = $8,
			sort_order = $9, updated_at = CURRENT_TIMESTAMP
		WHERE id = $10
	`, pkg.Name, pkg.NameEN, pkg.Description, pkg.PriceUSDT,
		pkg.Credits, pkg.BonusCredits, pkg.IsActive, pkg.IsRecommended,
		pkg.SortOrder, pkg.ID)
	return err
}

// DeleteCreditPackage 删除积分套餐（软删除）
func (d *Database) DeleteCreditPackage(id string) error {
	_, err := d.exec(`
		UPDATE credit_packages SET is_active = false, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, id)
	return err
}

// GetAllCreditPackages 获取所有套餐（包括禁用的）
func (d *Database) GetAllCreditPackages() ([]*CreditPackage, error) {
	return withRetry(func() ([]*CreditPackage, error) {
		rows, err := d.query(`
			SELECT id, name, name_en, description, price_usdt, credits, bonus_credits,
				   is_active, is_recommended, sort_order, created_at, updated_at
			FROM credit_packages
			ORDER BY sort_order ASC, created_at ASC
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		packages := make([]*CreditPackage, 0)
		for rows.Next() {
			var pkg CreditPackage
			err := rows.Scan(
				&pkg.ID, &pkg.Name, &pkg.NameEN, &pkg.Description, &pkg.PriceUSDT,
				&pkg.Credits, &pkg.BonusCredits, &pkg.IsActive, &pkg.IsRecommended,
				&pkg.SortOrder, &pkg.CreatedAt, &pkg.UpdatedAt,
			)
			if err != nil {
				return nil, err
			}
			packages = append(packages, &pkg)
		}

		return packages, nil
	})
}

// GetUserCreditSummary 获取用户积分摘要
func (d *Database) GetUserCreditSummary(userID string) (map[string]interface{}, error) {
	return withRetry(func() (map[string]interface{}, error) {
		// 获取用户积分
		credits, err := d.GetUserCredits(userID)
		if err != nil {
			return nil, fmt.Errorf("获取用户积分失败: %w", err)
		}

		// 获取本月消费
		var monthlyConsumption int
		err = d.queryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM credit_transactions
			WHERE user_id = $1 AND type = 'debit'
			AND created_at >= date_trunc('month', CURRENT_DATE)
		`, userID).Scan(&monthlyConsumption)
		if err != nil {
			return nil, fmt.Errorf("获取本月消费失败: %w", err)
		}

		// 获取本月充值
		var monthlyRecharge int
		err = d.queryRow(`
			SELECT COALESCE(SUM(amount), 0)
			FROM credit_transactions
			WHERE user_id = $1 AND type = 'credit' AND category = 'purchase'
			AND created_at >= date_trunc('month', CURRENT_DATE)
		`, userID).Scan(&monthlyRecharge)
		if err != nil {
			return nil, fmt.Errorf("获取本月充值失败: %w", err)
		}

		// 获取总交易笔数
		var totalTransactions int
		err = d.queryRow(`
			SELECT COUNT(*) FROM credit_transactions WHERE user_id = $1
		`, userID).Scan(&totalTransactions)
		if err != nil {
			return nil, fmt.Errorf("获取总交易笔数失败: %w", err)
		}

		summary := map[string]interface{}{
			"available_credits":      credits.AvailableCredits,
			"total_credits":          credits.TotalCredits,
			"used_credits":           credits.UsedCredits,
			"monthly_consumption":    monthlyConsumption,
			"monthly_recharge":       monthlyRecharge,
			"total_transactions":     totalTransactions,
			"last_updated":           credits.UpdatedAt,
		}

		return summary, nil
	})
}
