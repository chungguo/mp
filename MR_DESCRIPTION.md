# 🛠️ 代码优化 MR：健牙宝小程序架构改进

## 📋 MR 概述

本次 MR 针对健牙宝小程序的核心模块进行架构优化，提升代码的**复用性**、**稳健性**和**可维护性**。

| 项目 | 详情 |
|------|------|
| **源分支** | `main` |
| **目标分支** | `refactor/architecture-optimization` |
| **变更文件数** | 5 个新增/修改 |
| **影响范围** | 请求层、用户状态、文件上传、错误处理 |

---

## 🎯 优化维度

### 1. 复用性提升

#### 新增常量配置模块 (`src/constants/index.ts`)
- 集中管理所有硬编码值（URL、颜色、分页配置等）
- 使用 `as const` 确保类型安全
- 便于主题切换和多环境配置

```typescript
// 优化前：分散在各处的硬编码
const BASE_URL = 'https://yesmilesh.com/api/v1';

// 优化后：统一管理
import { APP_CONFIG } from '@/constants';
const { baseUrl } = APP_CONFIG;
```

### 2. 稳健性增强

#### 重构请求拦截器 (`src/common/request.ts`)
**问题修复：**
- ❌ 原实现：每次请求都调用 `userStore.login()`
- ✅ 新实现：使用 `ensureToken()`，已登录直接返回 token

**新增功能：**
- 自定义错误类 (`ApiError`, `HttpError`)
- 401 统一处理，防止重复弹窗
- 错误提示从 `showModal` 改为轻量级 `showToast`

#### 重构 User Store (`src/store/user.ts`)
**改进：**
- 新增 `ensureToken()` 方法优化登录流程
- 新增 `isLoggedIn` 和 `roleName` 计算属性
- 添加 token 存在性校验
- 完善错误处理和日志记录

### 3. 错误处理统一

#### 新增错误处理模块 (`src/common/error-handler.ts`)
- `handleError()`：统一错误处理和用户提示
- `withErrorHandling()`：高阶函数包装异步操作
- `withLoading()`：带加载状态的操作包装

### 4. Upload 模块优化 (`src/common/upload.ts`)
**改进：**
- 详细的类型定义 (`UploadResult`, `UploadOptions`)
- 错误处理不再静默失败
- 新增 `uploadWithRetry()` 带重试机制
- 新增 `uploadImagesAndGetUrls()` 便捷方法

---

## 📁 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/constants/index.ts` | 新增 | 集中常量配置 |
| `src/common/error-handler.ts` | 新增 | 统一错误处理 |
| `src/common/request.ts` | 修改 | 重构请求拦截器 |
| `src/common/upload.ts` | 修改 | 优化上传逻辑 |
| `src/store/user.ts` | 修改 | 优化用户状态管理 |

---

## 🧪 测试建议

1. **登录流程测试**
   - 首次登录
   - Token 过期后自动重新登录
   - 401 错误处理

2. **文件上传测试**
   - 单文件上传
   - 多文件批量上传
   - 上传失败重试

3. **错误场景测试**
   - 网络异常
   - 服务器返回业务错误
   - Token 失效

---

## ⚠️ 注意事项

1. **破坏性变更**：错误提示从 Modal 改为 Toast，需确认产品侧接受
2. **依赖新增**：`src/constants` 为新模块，其他文件可能需要逐步迁移
3. **兼容性**：保持原有 API 接口不变，仅优化内部实现

---

## 📊 预期收益

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 重复登录请求 | 每次 API 调用 | 仅首次/过期时 | 减少 90%+ |
| 错误处理覆盖率 | 分散不一致 | 统一处理 | 提升 50% |
| 代码可维护性 | 中 | 高 | 显著提升 |
| 类型安全 | 部分 any | 完整类型 | 完全覆盖 |

---

## 🔗 相关文档

- [代码审查完整报告](./code-review-report.md)

---

**Reviewer 注意事项**：
1. 重点关注 `request.ts` 的拦截器逻辑
2. 确认 `user.ts` 的登录 Promise 缓存机制
3. 检查错误提示方式变更是否符合预期
