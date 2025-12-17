# 二维码生成器 - 架构文档

## 📁 目录结构

```
tools-app-webpack/
├── src/
│   ├── pages/                      # 页面目录（保持整洁）
│   │   └── qrcode.vue             # 二维码生成器主页面
│   │
│   ├── components/                 # 业务组件
│   │   └── qrcode/                # 二维码相关组件
│   │       ├── BaseInfoForm.vue   # 基础信息表单
│   │       ├── StyleConfig.vue    # 样式配置
│   │       ├── LogoConfig.vue     # Logo配置
│   │       └── QRCodePreview.vue  # 二维码预览
│   │
│   ├── types/                      # 类型定义
│   │   └── qrcode.ts              # 二维码类型定义
│   │
│   └── utils/                      # 工具函数
│       └── qrcode/                # 二维码工具
│           ├── utils.ts           # QR生成、URL验证等
│           └── constants.ts       # 常量配置
│
└── docs/
    └── qrcode-architecture.md     # 本文档
```

## 🎯 设计原则

### 1. **页面目录整洁性**
- `src/pages/` 只包含页面级组件（`.vue` 文件）
- 不包含子组件、工具函数、类型定义等

### 2. **组件按功能分组**
- `src/components/qrcode/` 包含二维码功能的所有UI组件
- 便于其他页面复用

### 3. **类型统一管理**
- `src/types/` 集中管理类型定义
- 避免类型散落各处

### 4. **工具函数模块化**
- `src/utils/qrcode/` 包含业务逻辑和配置
- 便于测试和维护

## 📦 模块说明

### **页面层** (`src/pages/qrcode.vue`)
- **职责**：页面容器、状态管理、业务协调
- **依赖**：组件、工具、类型
- **大小**：~180 行

### **组件层** (`src/components/qrcode/`)
| 组件 | 职责 | Props | Emits |
|------|------|-------|-------|
| BaseInfoForm | URL和参数配置 | form, options | update, create-param |
| StyleConfig | 尺寸和颜色设置 | size, colors | update:* |
| LogoConfig | Logo上传和调整 | logo, size | update:*, remove |
| QRCodePreview | 结果展示和下载 | dataUrl, url | - |

### **类型层** (`src/types/qrcode.ts`)
```typescript
- QRCodeForm          # 表单数据
- ParamOption         # 参数选项
- StyleConfig         # 样式配置
- LogoConfig          # Logo配置
- QRCodeOptions       # 生成选项
```

### **工具层** (`src/utils/qrcode/`)

**utils.ts** - 核心业务逻辑
```typescript
- generateQRCode()    # 生成二维码
- addLogoToQRCode()   # Canvas叠加Logo
- buildURL()          # 构建URL
- isValidURL()        # 验证URL
```

**constants.ts** - 配置常量
```typescript
- ORIGIN_OPTIONS      # 来源选项
- DEFAULT_PARAM_OPTIONS  # 默认参数
- DEFAULT_STYLE_CONFIG   # 默认样式
- LOGO_UPLOAD_LIMIT     # 上传限制
```

## 🔄 导入路径规范

### ✅ 使用别名路径（推荐）
```typescript
import BaseInfoForm from '@/components/qrcode/BaseInfoForm.vue';
import type { QRCodeForm } from '@/types/qrcode';
import { generateQRCode } from '@/utils/qrcode/utils';
```

### ❌ 避免相对路径
```typescript
// 不推荐
import BaseInfoForm from '../../components/qrcode/BaseInfoForm.vue';
```

## 🌟 优势

### 1. **清晰的职责划分**
- 页面专注于布局和协调
- 组件专注于UI交互
- 工具专注于业务逻辑

### 2. **易于维护**
- 修改某个功能只需找到对应模块
- 不会影响其他功能

### 3. **便于复用**
- 组件可在其他页面直接引用
- 工具函数可在其他业务使用

### 4. **便于测试**
- 纯函数易于单元测试
- 组件可独立测试

### 5. **团队协作友好**
- 目录结构清晰
- 代码定位快速

## 📈 扩展指南

### 添加新的二维码组件
```bash
# 在 src/components/qrcode/ 下创建新组件
src/components/qrcode/NewFeature.vue
```

### 添加新的工具函数
```bash
# 在 src/utils/qrcode/ 下添加
# utils.ts 或创建新文件
```

### 添加新的类型定义
```bash
# 在 src/types/qrcode.ts 中添加
export interface NewType { ... }
```

## 🔍 文件查找

| 需求 | 位置 |
|------|------|
| 修改页面布局 | `src/pages/qrcode.vue` |
| 修改表单UI | `src/components/qrcode/BaseInfoForm.vue` |
| 修改生成逻辑 | `src/utils/qrcode/utils.ts` |
| 修改默认配置 | `src/utils/qrcode/constants.ts` |
| 修改类型定义 | `src/types/qrcode.ts` |

## 📝 命名规范

- **组件**：PascalCase（`BaseInfoForm.vue`）
- **工具文件**：camelCase（`utils.ts`）
- **类型文件**：camelCase（`qrcode.ts`）
- **常量**：UPPER_SNAKE_CASE（`ORIGIN_OPTIONS`）
- **函数**：camelCase（`generateQRCode`）
- **类型**：PascalCase（`QRCodeForm`）

---

**最后更新**: 2025年12月17日
