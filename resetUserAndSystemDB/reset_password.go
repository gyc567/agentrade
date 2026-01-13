//go:build resetpwd
// +build resetpwd

package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// 定义命令行参数
	email := flag.String("email", "", "用户邮箱 (必需)")
	password := flag.String("password", "", "新密码 (必需，至少 8 位)")
	verify := flag.Bool("verify", false, "仅验证密码，不更新数据库")
	hash := flag.String("hash", "", "已生成的 bcrypt 哈希 (可选，提供则跳过生成)")
	dbURL := flag.String("db", "", "数据库 URL (不提供则从环境变量读取)")

	flag.Parse()

	// 验证参数
	if !*verify && (*email == "" || *password == "") {
		fmt.Println("用户密码重置工具")
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		fmt.Println("")
		fmt.Println("使用方式:")
		fmt.Println("  go run reset_password.go -email <email> -password <password>")
		fmt.Println("")
		fmt.Println("示例:")
		fmt.Println("  生成新哈希并更新数据库:")
		fmt.Println("    go run reset_password.go -email gyc567@gmail.com -password eric8577HH")
		fmt.Println("")
		fmt.Println("  使用已有哈希更新数据库:")
		fmt.Println("    go run reset_password.go -email gyc567@gmail.com -hash '$2a$10$...'")
		fmt.Println("")
		fmt.Println("  仅验证密码与哈希:")
		fmt.Println("    go run reset_password.go -password eric8577HH -hash '$2a$10$...' -verify")
		fmt.Println("")
		fmt.Println("参数说明:")
		fmt.Println("  -email    用户邮箱 (必需，除非使用 -verify)")
		fmt.Println("  -password 新密码 (必需)")
		fmt.Println("  -hash     bcrypt 哈希 (可选，省略则自动生成)")
		fmt.Println("  -db       数据库 URL (可选，默认从环境变量读取)")
		fmt.Println("  -verify   仅验证模式，不更新数据库")
		fmt.Println("")
		os.Exit(1)
	}

	// 验证密码长度
	if len(*password) < 8 {
		log.Fatalf("❌ 密码太短! 最少需要 8 位，当前: %d 位", len(*password))
	}

	// 生成或使用提供的哈希
	var passwordHash string
	if *hash != "" {
		passwordHash = *hash
		fmt.Println("📌 使用提供的哈希:")
		fmt.Printf("   %s\n", passwordHash)
	} else {
		fmt.Println("🔐 生成新的 bcrypt 哈希...")
		generatedHash, err := bcrypt.GenerateFromPassword([]byte(*password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("❌ 哈希生成失败: %v", err)
		}
		passwordHash = string(generatedHash)
		fmt.Printf("✅ 哈希已生成: %s\n", passwordHash)
	}

	// 验证密码与哈希
	fmt.Println("")
	fmt.Println("🧪 验证密码与哈希...")
	err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(*password))
	if err != nil {
		log.Fatalf("❌ 密码验证失败! 错误: %v", err)
	}
	fmt.Println("✅ 验证成功! 密码与哈希匹配")

	// 如果仅验证模式，到此为止
	if *verify {
		fmt.Println("")
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		fmt.Println("✅ 验证完成 (仅验证模式)")
		return
	}

	// 连接数据库
	fmt.Println("")
	fmt.Println("🗄️  连接数据库...")

	databaseURL := *dbURL
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
		if databaseURL == "" {
			log.Fatalf("❌ 数据库 URL 未提供! 请使用 -db 参数或设置 DATABASE_URL 环境变量")
		}
	}

	// 添加 binary_parameters=yes
	if strings.Contains(databaseURL, "?") {
		databaseURL += "&binary_parameters=yes"
	} else {
		databaseURL += "?binary_parameters=yes"
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("❌ 数据库连接失败: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("❌ 数据库连接测试失败: %v", err)
	}

	fmt.Println("✅ 数据库连接成功")

	// 查询用户是否存在
	fmt.Println("")
	fmt.Println("🔍 查询用户信息...")

	var userEmail, oldHashStart string
	var oldHashLen int
	err = db.QueryRow(`
		SELECT email, length(password_hash) as hash_len, left(password_hash, 10) as hash_start
		FROM users
		WHERE email = $1
	`, *email).Scan(&userEmail, &oldHashLen, &oldHashStart)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Fatalf("❌ 用户不存在: %s", *email)
		}
		log.Fatalf("❌ 查询失败: %v", err)
	}

	fmt.Printf("✅ 用户找到: %s\n", userEmail)
	fmt.Printf("   旧哈希长度: %d\n", oldHashLen)
	fmt.Printf("   旧哈希起始: %s\n", oldHashStart)

	// 显示更新确认
	fmt.Println("")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("⚠️  确认信息:")
	fmt.Printf("   邮箱: %s\n", *email)
	fmt.Printf("   新密码: %s\n", *password)
	fmt.Printf("   新哈希: %s\n", passwordHash)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// 执行更新
	fmt.Println("")
	fmt.Println("🔄 更新数据库...")

	result, err := db.Exec(`
		UPDATE users
		SET password_hash = $1
		WHERE email = $2
	`, passwordHash, *email)
	if err != nil {
		log.Fatalf("❌ 更新失败: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Fatalf("❌ 获取受影响行数失败: %v", err)
	}

	if rowsAffected == 0 {
		log.Fatalf("❌ 更新失败: 未找到匹配的行")
	}

	fmt.Printf("✅ 已更新 %d 行\n", rowsAffected)

	// 验证更新
	fmt.Println("")
	fmt.Println("✅ 验证更新...")

	var newHashStart string
	var newHashLen int
	err = db.QueryRow(`
		SELECT length(password_hash) as hash_len, left(password_hash, 10) as hash_start
		FROM users
		WHERE email = $1
	`, *email).Scan(&newHashLen, &newHashStart)
	if err != nil {
		log.Fatalf("❌ 验证查询失败: %v", err)
	}

	fmt.Printf("   新哈希长度: %d\n", newHashLen)
	fmt.Printf("   新哈希起始: %s\n", newHashStart)

	if newHashLen != 60 {
		log.Fatalf("❌ 哈希长度不正确! 期望: 60, 实际: %d", newHashLen)
	}

	fmt.Println("")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("✅ 密码重置成功!")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("")
	fmt.Println("📝 更新信息:")
	fmt.Printf("   邮箱: %s\n", *email)
	fmt.Printf("   密码: %s\n", *password)
	fmt.Println("")
	fmt.Println("🧪 测试登陆:")
	fmt.Println("   curl -X POST https://nofx-gyc567.replit.app/api/login \\")
	fmt.Println("     -H \"Content-Type: application/json\" \\")
	fmt.Printf("     -d '{\"email\":\"%s\",\"password\":\"%s\"}'\n", *email, *password)
	fmt.Println("")
}
