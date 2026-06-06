# AI GGB - 智能几何画板

> 上传几何题目图片，AI 自动识别并绘制图形。

**GitHub 仓库**: https://github.com/5iehomecc/AI-GGB-Sketch

**当前版本**: 1.6.1

---

## 项目简介

AI GGB 是一款将 AI 大语言模型与 GeoGebra 动态几何画板深度融合的 Web 应用。用户只需用文字描述几何问题，或上传几何题目图片，AI 就能自动识别并绘制对应的几何图形，帮助教师和学生快速构建数学可视化图形。

项目采用纯原生前端技术（HTML / CSS / JavaScript），无任何前端框架依赖，开箱即用。

---

## 功能特性

### AI 对话与绘图
- **文字描述绘图**：输入几何问题描述，AI 自动生成 GeoGebra 命令并执行绘图
- **图片识别绘图**：上传几何题目图片（支持拖拽、粘贴），AI 自动识别几何元素并还原图形
- **增量绘图**：支持在已有图形基础上追加、修改，保持动态几何关联性
- **多轮工具调用**：AI 通过 6 种专用工具（获取画布状态、执行命令、重置画布、切换视图、获取选中对象、LaTeX 计算）与 GeoGebra 交互
- **智能容错**：模型不支持函数调用时自动降级为代码块模式；命令执行失败后 AI 自动重新规划

### GeoGebra 画板
- **多种视图模式**：几何视图、代数+几何视图、代数+几何+3D 视图
- **导入 / 导出**：支持导入 `.ggb` / `.xml` 文件，导出 `.ggb` 文件或 Markdown 格式脚本
- **画板重置**：一键清空画板（带确认弹窗）
- **撤销 / 重做**：通过 GeoGebra 工具栏操作

### GGB 美化面板
- **背景颜色**：6 种预设背景色快速切换
- **视图控制**：显示/隐藏坐标轴和网格（与 GGB 样式栏双向同步）
- **对象样式**：调节点大小、线粗细、显示标签
- **一键美化预设**：浅色经典、暖色教学两种预设方案

### 对话管理
- **历史记录**：自动保存最多 50 个对话，支持新建、切换、删除
- **对话导航**：超过 2 条用户消息时显示导航小点，快速跳转
- **消息操作**：复制消息内容、重新生成 AI 回复、回滚图形状态
- **长消息折叠**：自动检测长消息并提供展开/折叠功能

### AI 平台配置
- **多平台支持**：OpenRouter、新疆幻城网安科技公益大模型、BlazeAPI、Poixe AI、Google Gemini、Google Gemini (本地)
- **OpenAI 兼容接口**：任何兼容 OpenAI API 格式的接口均可使用
- **模型自动获取**：一键获取可用模型列表，支持下拉搜索和键盘导航
- **自定义系统提示词**：可完全自定义 AI 角色和行为
- **CORS 代理**：内置服务端代理 + 公共 CORS 代理自动降级，解决跨域问题

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | 无（纯原生 JavaScript，IIFE 模式） |
| 样式 | CSS3（CSS 变量、Flexbox 布局） |
| 图形引擎 | GeoGebra Classic（CDN 加载，多源容灾） |
| AI 接口 | OpenAI 兼容 API（`/v1/chat/completions`） |
| 数据存储 | `localStorage`（配置、对话历史） |
| 图片处理 | Canvas API（压缩、缩略图生成） |
| 部署方式 | 静态文件直托管 或 Node.js 服务端代理 |

---

## 快速开始

### 方式一：直接打开（推荐用于体验）

```bash
# 克隆仓库
git clone https://github.com/5iehomecc/AI-GGB-Sketch.git
cd AI-GGB-Sketch

# 直接用浏览器打开 index.html
# 或在 VS Code 中使用 Live Server 插件
```

### 方式二：使用 Node.js 代理服务器（推荐用于生产）

```bash
# 克隆仓库
git clone https://github.com/5iehomecc/AI-GGB-Sketch.git
cd AI-GGB-Sketch

# 安装依赖（如有 package.json）
npm install

# 启动服务端代理
node server.js

# 访问 http://localhost:3000
```

> **提示**：启动服务端代理后，AI API 请求将通过 `/api/proxy` 转发，避免 CORS 跨域问题。

### 配置 AI

1. 点击右上角 **⚙️ 设置** 按钮
2. 选择 AI 平台（或自定义 API 地址）
3. 填写 API Key
4. 点击 **获取模型** 选择目标模型
5. 点击 **保存**

---

## 使用说明

### 基本操作

| 操作 | 方法 |
|------|------|
| 发送消息 | 输入文字后点击发送按钮 或 按 `Enter` |
| 换行 | `Shift + Enter` |
| 上传图片 | 点击上传按钮 / 拖拽到聊天区 / `Ctrl+V` 粘贴 |
| 停止生成 | 点击停止按钮（发送后出现） |
| 切换视图 | 点击顶部「几何视图」下拉菜单 |
| 美化画板 | 点击顶部「🎨 GGB 美化」按钮 |
| 导入/导出 | 点击顶部「导入 / 导出」下拉菜单 |

### 对话操作

| 操作 | 说明 |
|------|------|
| **复制** | 点击消息下方的复制图标 |
| **重新生成** | 点击重新生成图标，回滚到该位置重新请求 AI |
| **导航跳转** | 点击左侧导航小点快速定位到特定用户消息 |

### GGB 美化

- **背景色**：点击颜色按钮即时切换
- **坐标轴/网格**：切换开关控制显示状态
- **点大小/线粗细**：拖动滑块实时调整
- **一键美化**：点击预设按钮自动应用整套样式方案

### 导入 / 导出

| 功能 | 格式 | 说明 |
|------|------|------|
| 导入 ggb | `.ggb`（ZIP）/ `.xml` | 从文件加载 GeoGebra 工程 |
| 导出 ggb | `.ggb` | 导出为标准 GeoGebra 文件，可用 GeoGebra 打开 |
| 导出脚本 | `.md` | 导出为 Markdown 格式，包含点坐标、函数方程和可执行命令 |

---

## 项目结构

```
ai-ggb/
├── index.html          # 主页面，包含画板区域和聊天面板
├── app.js              # 核心应用逻辑（IIFE 封装）
│   ├── 系统提示词定义
│   ├── GeoGebra 工具定义（6 种）
│   ├── AI 平台配置
│   ├── GeoGebra 初始化与 CDN 容灾
│   ├── AI 对话与工具调用流程
│   ├── 图片上传与压缩
│   ├── GGB 美化功能
│   ├── 导入/导出功能
│   ├── 对话历史管理
│   └── 配置管理
├── styles.css          # 全部样式（CSS 变量体系）
├── manifest.json       # PWA 清单文件
├── favicon.svg         # 站点图标
├── sw.js               # Service Worker 缓存脚本
├── server.js           # Node.js 代理服务器（可选）
└── README.md           # 项目文档
```

---

## API 配置说明

### 支持的 AI 平台

| 平台 | 默认 API 地址 | 说明 |
|------|--------------|------|
| OpenRouter | `https://openrouter.ai/api/v1` | 聚合多模型平台 |
| 新疆幻城网安科技公益大模型 | `https://api.iamhc.cn/v1` | 国内公益平台 |
| BlazeAPI | `https://blazeai.boxu.dev/api/v1` | 聚合平台 |
| Poixe AI | `https://api.poixe.com/v1` | 聚合平台，提供免费模型 |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta` | Google 官方 |
| Google Gemini (本地) | `http://127.0.0.1:8045/v1` | 本地部署的 Gemini 代理 |
| 自定义 | 手动填写 | 任意兼容 OpenAI 格式的接口 |

### 配置字段

| 字段 | 说明 | 存储位置 |
|------|------|----------|
| API 地址 | AI 服务的基础 URL | `localStorage` (`ai-ggb-config`) |
| API Key | 认证密钥 | `localStorage`（密码输入框） |
| 模型 | 目标模型名称 | `localStorage` |
| 系统提示词 | 自定义 AI 角色指令（可选） | `localStorage` |

### 自定义系统提示词

默认系统提示词将 AI 定位为「专业 GeoGebra 几何专家 Agent」，包含完整的思维协议和工具调用规范。如需自定义行为，可在设置面板中修改。

---

## 更新日志摘要

### v1.6.1
- 移除 NVIDIA NIM 平台及其 API URL 配置

### v1.6.0
- 坐标轴/网格显示与 GGB 样式栏双向同步
- 模型下拉菜单支持键盘导航和搜索筛选
- 统一 API 请求架构（9 个函数合并为 1 个 `doApiRequest`）

### v1.5.0
- Favicon 金色空洞立方体设计
- Happy Hues 自然绿+金黄色配色方案
- GGB 美化预设精简为浅色经典与暖色教学

### v1.4.0
- 重置画板按钮（带确认弹窗）
- GeoGebra 官方样式栏按钮
- 点击版本号查看更新日志
- 导出脚本包含可执行的 GeoGebra 命令块

### v1.3.0
- 可搜索模型组合框
- 对话导航小点
- 导入/导出合并为下拉菜单
- 导出文件名时间戳格式

### v1.2.0
- 千问/Gemini 外部链接按钮
- 模型 Badge 显示
- AI 助手栏与左侧画板等高

### v1.1.0
- AI 对话与 GeoGebra 画板联动
- 多平台 API 配置
- 对话历史记录保存与切换
- GeoGebra 脚本自动识别与执行

---

## 参考项目

- [AI GGB - 智能几何画板](https://www.chatggb.cn/index.php) - AI 几何画板在线体验站点
- [GeoGebra AI 对话](https://shu.nat100.top/static/pages/chat/geogebra.html) - GeoGebra AI 对话工具
- [ai-ggb](https://github.com/pHsl-z/ai-ggb) - AI GGB 开源项目

---

## 版权信息

**Copyright &copy; 2026 [E家分享](https://www.5iehome.cc)**

本项目仅供学习和教育用途使用。
