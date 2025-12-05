# OpenSpec Bug Reports Index

## 📋 Bug列表

### 🔴 P0 - 阻断性问题

1. **[JWT认证中间件与Handler之间的用户信息传递不一致](./jwt-auth-inconsistency/)** 
   - **Bug ID**: BUG-2025-11-23-001
   - **严重级别**: P0
   - **状态**: ✅ 已找到根本原因
   - **影响**: 所有需要认证的API端点（约15个）
   - **摘要**: 认证中间件存储用户信息时使用的键名与Handler期望的键名不匹配，导致所有认证API返回"未认证的访问"错误

## 📁 目录结构

```
openspec/bugs/
├── index.md                                            # 本索引文件
└── jwt-auth-inconsistency/                             # JWT认证Bug目录
    ├── README.md                                       # 调查总结
    └── BUG_REPORT.md                                   # 详细Bug报告
```

## 🔍 快速导航

### 查看Bug详情
1. **调查总结**: [jwt-auth-inconsistency/README.md](./jwt-auth-inconsistency/README.md)
2. **详细报告**: [jwt-auth-inconsistency/BUG_REPORT.md](./jwt-auth-inconsistency/BUG_REPORT.md)

### 相关代码位置
- **认证中间件**: `/api/server.go:1291-1321`
- **用户列表Handler**: `/api/server.go:2090-2186`
- **其他相关Handler**: 多个使用认证的Handler

## 📊 Bug统计

| 严重级别 | 数量 | 状态 |
|----------|------|------|
| P0 | 1 | 1个已识别根本原因 |
| P1 | 0 | - |
| P2 | 0 | - |
| P3 | 0 | - |
| **总计** | **1** | **1个已调查完成** |

## 🚀 下一步行动

1. **实施修复方案**
   - 修改认证中间件 (`/api/server.go:1316-1319`)
   - 重新编译代码
   - 部署到远程服务器

2. **验证修复效果**
   - 测试所有受影响的API端点
   - 确认用户认证流程正常工作

3. **更新Bug状态**
   - 修改 `BUG_REPORT.md` 中的状态字段
   - 记录修复时间和修复人员

---
**最后更新**: 2025-11-23  
**维护者**: 开发团队
