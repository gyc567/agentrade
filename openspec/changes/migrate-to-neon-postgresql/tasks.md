# 迁移到Neon PostgreSQL - 任务清单

## 阶段1: 准备工作
- [x] 1.1 创建OpenSpec提案
- [ ] 1.2 备份当前代码
- [ ] 1.3 创建SQL转换清单
- [ ] 1.4 准备测试环境

## 阶段2: 依赖和导入
- [ ] 2.1 修改 go.mod，移除 sqlite3 依赖
- [ ] 2.2 修改 config/database.go 导入语句
- [ ] 2.3 运行 go mod tidy

## 阶段3: 数据库连接逻辑
- [ ] 3.1 移除 USE_NEON 环境变量检查
- [ ] 3.2 简化 NewDatabase 函数
- [ ] 3.3 移除 SQLite 连接代码
- [ ] 3.4 只保留 PostgreSQL 连接

## 阶段4: SQL语法转换
- [ ] 4.1 转换表创建语句
  - [ ] AUTOINCREMENT → SERIAL
  - [ ] INTEGER PRIMARY KEY → SERIAL PRIMARY KEY
  - [ ] DATETIME → TIMESTAMP
  - [ ] BOOLEAN DEFAULT 0/1 → BOOLEAN DEFAULT FALSE/TRUE
- [ ] 4.2 转换 INSERT 语句
  - [ ] INSERT OR REPLACE → INSERT ... ON CONFLICT ... DO UPDATE
  - [ ] INSERT OR IGNORE → INSERT ... ON CONFLICT DO NOTHING
- [ ] 4.3 转换参数占位符
  - [ ] ? → $1, $2, $3...
  - [ ] 所有 Exec 调用
  - [ ] 所有 Query 调用
  - [ ] 所有 QueryRow 调用
- [ ] 4.4 转换时间函数
  - [ ] datetime('now') → CURRENT_TIMESTAMP
  - [ ] date('now') → CURRENT_DATE

## 阶段5: 触发器重写
- [ ] 5.1 识别所有 SQLite 触发器
- [ ] 5.2 创建 PostgreSQL 函数
- [ ] 5.3 创建 PostgreSQL 触发器
- [ ] 5.4 测试触发器功能

## 阶段6: 辅助函数修改
- [ ] 6.1 移除 getPlaceholder 等兼容函数
- [ ] 6.2 移除 driver 字段
- [ ] 6.3 简化 SQL 生成逻辑

## 阶段7: 环境配置
- [ ] 7.1 更新 .env.example
- [ ] 7.2 更新 .env
- [ ] 7.3 移除 SQLITE_PATH 配置
- [ ] 7.4 确保 DATABASE_URL 配置正确

## 阶段8: 测试
- [ ] 8.1 编译测试
- [ ] 8.2 单元测试
- [ ] 8.3 API测试
  - [ ] 用户注册
  - [ ] 用户登录
  - [ ] 模型配置
  - [ ] 交易所配置
  - [ ] 交易员管理
  - [ ] 信号源配置
- [ ] 8.4 集成测试
- [ ] 8.5 性能测试

## 阶段9: 文档更新
- [ ] 9.1 更新 README.md
- [ ] 9.2 更新部署文档
- [ ] 9.3 更新开发文档
- [ ] 9.4 创建迁移报告

## 阶段10: 部署
- [ ] 10.1 更新生产环境变量
- [ ] 10.2 部署到生产环境
- [ ] 10.3 验证所有功能
- [ ] 10.4 监控错误日志

## 阶段11: 清理
- [ ] 11.1 删除 SQLite 数据库文件
- [ ] 11.2 删除 SQLite 相关文档
- [ ] 11.3 更新 .gitignore
- [ ] 11.4 清理未使用的代码
