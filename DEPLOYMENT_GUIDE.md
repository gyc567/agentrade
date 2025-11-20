# 🚀 快速部署指南

## 一键部署命令

### 1. 提交修改
```bash
cd /Users/guoyingcheng/dreame/code/nofx

git add .
git commit -m 'fix: 修复OKX余额显示0问题 - 字段映射错误'
git push
```

### 2. 等待部署
- Vercel: 约2-3分钟自动部署
- Replit: 约1-2分钟自动部署
- 其他平台: 根据CI/CD配置

### 3. 验证部署
```bash
# 运行API测试
go run test_backend_api.go

# 预期输出:
# total_equity: 99.90500000  ← 应该不是0！
# available_balance: 99.90500000  ← 应该不是0！
```

### 4. 访问前端
打开浏览器访问: https://nofx-gyc567.replit.app

**预期结果**:
- ✅ 总资产显示: ~99.90 USDT (不再是0)
- ✅ 盈亏显示: ~-0.09% (不再是-100%)

---

## 📊 验证步骤

### 快速检查清单

1. [ ] 推送代码到Git
2. [ ] 等待CI/CD完成
3. [ ] 运行 `go run test_backend_api.go`
4. [ ] 检查total_equity是否不为0
5. [ ] 访问前端页面查看余额

### 日志检查

部署后查看后端日志，应看到:
```
✓ 从OKX获取总资产: 99.90500000
✓ 从OKX获取可用余额: 99.90500000
✓ 账户余额映射成功: 总资产=99.90, 可用=99.90
```

如果看到以上日志，说明修复成功！✅

---

## ❌ 如果验证失败

### 情况1: 仍然显示0

**可能原因**:
- 代码未正确部署
- 缓存问题
- 环境变量问题

**解决方案**:
1. 确认代码已推送到正确的分支
2. 清除浏览器缓存
3. 重启后端服务

### 情况2: 编译错误

如果收到编译错误:
```bash
cd /Users/guoyingcheng/dreame/code/nofx
go mod tidy
go build -o nofx-server api/server.go
```

---

## 📞 需要帮助？

如果问题仍未解决，请检查:

1. **Git状态**: `git status`
2. **部署日志**: 查看CI/CD平台的部署日志
3. **后端日志**: 查看后端服务日志中的错误信息

---

**快速参考**:
- ✅ 代码已修复
- ✅ 编译通过
- 🚀 待部署
- 🔍 部署后请立即验证
