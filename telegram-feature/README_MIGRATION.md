# SQLite到Neon PostgreSQL迁移指南

## 1. 安装依赖
```bash
go get github.com/lib/pq
```

## 2. 配置数据库
在配置文件中添加双数据库配置：

```yaml
database:
  use_neon: true
  neon_dsn: "host=your-neon-host port=5432 user=your-user dbname=your-db password=your-password sslmode=require"
  sqlite_path: "./config.db"
```

## 3. 执行数据迁移
```go
import (
    "nofx/database"
)

// 执行迁移
err := database.MigrateData(sqlitePath, neonDSN)
if err != nil {
    log.Fatal(err)
}
```

## 4. 使用双数据库
```go
// 创建数据库实例
db, err := database.NewDatabase(config)
if err != nil {
    log.Fatal(err)
}
defer db.Close()

// 调用方法，自动使用可用的数据库
user, err := db.GetUserByEmail("test@example.com")
```

## 注意事项

### 1. SQL语法兼容性
- SQLite使用`?`作为占位符，PostgreSQL使用`$1`、`$2`等
- 代码中已经处理了占位符的自动替换

### 2. 数据类型转换
- SQLite的INTEGER类型对应PostgreSQL的SERIAL或INT
- SQLite的TEXT类型对应PostgreSQL的VARCHAR
- SQLite的REAL类型对应PostgreSQL的FLOAT8或NUMERIC

### 3. 时区处理
- PostgreSQL默认使用UTC时区
- SQLite没有内置时区支持，建议将时间转换为UTC后存储

## 回退机制
如果Neon连接失败，系统会自动切换到SQLite数据库，确保系统的高可用性。
