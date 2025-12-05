package database

import (
	"os"
	"testing"

	"github.com/joho/godotenv"
)

func TestMigrateData(t *testing.T) {
	// 从.env.local文件加载环境变量
	err := godotenv.Load("/Users/guoyingcheng/dreame/code/nofx/.env.local")
	if err != nil {
		t.Fatalf("Failed to load .env.local file: %v", err)
	}

	// 从环境变量获取配置
	sqlitePath := os.Getenv("SQLITE_PATH")
	neonDSN := os.Getenv("DATABASE_URL")

	// 使用项目根目录的config.db文件完整路径
	sqlitePath = "/Users/guoyingcheng/dreame/code/nofx/config.db"

	// 确保neonDSN存在
	if neonDSN == "" {
		t.Fatal("DATABASE_URL not found in environment variables")
	}

	// 测试迁移
	err = MigrateData(sqlitePath, neonDSN)
	if err != nil {
		t.Fatal(err)
	}
}
