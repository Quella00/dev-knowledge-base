# 🐞 Dev Knowledge Base (开发者知识库)

![Next.js](https://img.shields.io/badge/Next.js-15-black) ![React](https://img.shields.io/badge/React-19-blue) ![Prisma](https://img.shields.io/badge/Prisma-SQLite-green) ![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)

一个基于 **Next.js 15 (App Router)** 全栈开发的个人技术知识库应用。旨在帮助开发者记录开发过程中遇到的 Bug、报错解决方案以及技术笔记。支持 Markdown 编辑、代码高亮、用户权限隔离及公开分享功能。

## ✨ 功能特性

- **📚 沉浸式阅读体验**：左侧目录导航 + 中间列表 + 右侧像 GitBook/Notion 一样的阅读视窗。
- **📝 Markdown 富文本编辑**：支持实时预览、表格、任务列表及快捷键。
- **🎨 代码高亮与复制**：集成 VS Code 风格 (One Light) 代码高亮，支持一键复制。
- **🔐 用户认证系统**：
  - 完整的注册/登录流程。
  - 图形验证码 (svg-captcha) 防止恶意注册。
  - 基于 JWT (jose) 的 Session 管理。
- **🛡️ 数据隔离与权限**：每个用户只能管理自己的文档，支持数据的增删改查 (CRUD)。
- **🌏 公开广场**：支持将文档设为“公开”，所有人可在广场可见，但仅作者可编辑。
- **🔍 搜索与分类**：支持全文检索（标题/标签）、按分类筛选、收藏夹功能。
- **⚡ 极简部署**：使用 SQLite 本地数据库，无需配置复杂的 MySQL/PostgreSQL，数据随项目走。

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router), React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS, Lucide React (图标)
- **数据库/ORM**: SQLite, Prisma
- **编辑器**: @uiw/react-md-editor
- **渲染**: React Markdown, React Syntax Highlighter
- **安全**: Bcrypt.js (密码加密), Jose (JWT), SVG Captcha

## 🚀 快速开始 (Quick Start)

### 1. 环境准备
确保你的本地环境已安装：
- Node.js (v18.17 或更高版本)

### 2. 常用命令汇总

你可以直接按顺序执行以下命令来启动项目：

# 1. 安装依赖
npm install

# 2. 初始化数据库 (创建表结构)
# 注意：如果是首次运行或修改了 schema.prisma，必须运行此命令
npx prisma migrate dev --name init

# 3. 启动开发服务器
npm run dev

启动成功后，访问：http://localhost:3000

## 🗄️ 数据库管理
本项目使用 SQLite，数据库文件位于项目根目录下的 dev_kb.db。

# 查看并管理本地数据 (打开 Web 管理界面)
npx prisma studio

# 如果修改了 prisma/schema.prisma 模型，运行此命令同步数据库
npx prisma migrate dev --name update_reason

# 彻底重置数据库 (清空所有数据)
npx prisma migrate reset

## 📂 项目结构
.
├── app/
│   ├── actions.ts       # 后端逻辑 (Server Actions: 增删改查、登录注册)
│   ├── lib.ts           # 工具函数 (Session 加密/解密)
│   ├── api/             # API 路由 (验证码接口)
│   ├── components/      # 前端组件 (AuthForm, KnowledgeBase, Markdown渲染器)
│   └── page.tsx         # 主入口 (路由守卫)
├── prisma/
│   ├── schema.prisma    # 数据库模型定义
│   └── dev_kb.db        # SQLite 数据库文件
├── public/              # 静态资源
└── ...配置文件

# 本项目使用了 React 19 RC (Next.js 15 默认)。如果遇到依赖冲突，尝试使用 npm install --legacy-peer-deps。