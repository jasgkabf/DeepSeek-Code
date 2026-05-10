<div align="center">

# DeepSeek Code

**CLI AI Coding Assistant — Alternative to Claude Code / Codex**

[中文](#中文) | [English](#english)

</div>

---

<a id="english"></a>

## 🚀 DeepSeek Code

DeepSeek Code is a powerful command-line AI coding assistant, designed as an open-source alternative to Claude Code and OpenAI Codex. It supports multiple LLM providers, features a built-in knowledge Skills system and extensible plugin Skills, and runs even on Android via Termux.

### ✨ Features

- **Multi-LLM Support** — DeepSeek, OpenAI, Claude/Anthropic, Xiaomi MiMo, and any OpenAI-compatible API
- **Autonomous Agent** — AI runs autonomously, only asking you when truly uncertain; smart duplicate detection prevents wasted tokens
- **Wizard-Style Setup** — First launch guides you through language, model, and API key configuration with numbered presets
- **Bilingual Interface** — Full Chinese/English (i18n) support, selectable on first startup
- **Built-in Knowledge Skills** — 9 built-in Skills (frontend-design, mcp-builder, webapp-testing, etc.) available on demand
- **Extensible Plugin Skills** — Install additional Skills from URL or local folder; AI auto-uses installed skill tools
- **Session Management** — Auto-save chats, switch between history sessions, create new conversations
- **Security** — AES-256-CBC encrypted API key storage, hard/soft block command safety, protected path checks
- **Termux Compatible** — Full Android/Termux support with environment detection, storage access hints, and clipboard adaptation
- **Context Optimization** — Token-based context trimming for long conversations
- **Rich Built-in Tools** — File read/write/edit, directory listing, command execution, clipboard, and more
- **Multiple Launch Commands** — `deepseek-code`, `ds-code`, `dscode` (case-insensitive)

### 📦 Installation

> `npm run build` automatically compiles and registers global commands. After build, you can directly use `deepseek-code` / `ds-code` / `dscode` to start.

#### 🪟 Windows

```bash
# 1. Install Node.js (LTS) — https://nodejs.org/ or:
winget install OpenJS.NodeJS.LTS

# 2. Install Git — or: winget install Git.Git

# 3. Clone, build, and run
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

#### 🍎 macOS

```bash
# 1. Install Node.js — or: brew install node

# 2. Install Git — or: brew install git

# 3. Clone, build, and run
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

#### 🐧 Linux

```bash
# 1. Install Node.js
#    Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs
#    Fedora: sudo dnf install nodejs
#    Arch: sudo pacman -S nodejs npm

# 2. Install Git

# 3. Clone, build, and run
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

#### 📱 Android (Termux)

```bash
# 1. Install Termux from F-Droid — https://f-droid.org/packages/com.termux/

# 2. Install dependencies
pkg install nodejs git

# 3. (Optional) Enable storage access
termux-setup-storage

# 4. Clone, build, and run
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

DeepSeek Code auto-detects Termux and adapts:
- Uses `pkg` instead of `apt`
- Shows storage access hints (`termux-setup-storage`)
- Adjusts UI width for mobile screens
- Adapts clipboard commands

### 🏁 Quick Start

On first launch, the setup wizard will guide you through:
1. **Language Selection** — Choose Chinese or English
2. **Model Selection** — Pick from preset models (DeepSeek, OpenAI, Claude, MiMo, etc.) or enter custom settings
3. **API Key** — Enter your API key (stored encrypted with AES-256-CBC)

### 🛠 Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands (categorized) |
| `/setup` | Switch AI model via wizard (recommended) |
| `/new` | Start a new chat (old chat auto-saved) |
| `/sessions` | View and switch between chat history |
| `/history` | View current conversation history |
| `/clear` | Clear current chat context |
| `/config` | View current configuration |
| `/set <key> <value>` | Set a config value |
| `/cd [path]` | View or switch project directory |
| `/skill install <url>` | Install a Skill from URL |
| `/skill install-path <folder>` | Install a Skill from local folder |
| `/skill remove <name>` | Remove an installed Skill |
| `/skills` | List all Skills (built-in + installed) |
| `/memory` | View agent memory and evolution stats |
| `/uninstall` | Completely uninstall DeepSeek Code |
| `/exit` | Exit DeepSeek Code |

### 🔌 Skills System

DeepSeek Code has two types of Skills:

**📚 Built-in Knowledge Skills** (available on demand, read from files when needed):
- `frontend-design` — Create distinctive, production-grade frontend interfaces
- `mcp-builder` — Guide for creating MCP servers
- `webapp-testing` — Toolkit for testing web applications with Playwright
- `skill-creator` — Guide for creating new Skills
- `brand-guidelines` — Apply brand colors and typography
- `internal-comms` — Write internal communications
- `doc-coauthoring` — Co-author documentation
- `theme-factory` — Style artifacts with themes
- `algorithmic-art` — Create algorithmic art with p5.js

**🔌 Extensible Plugin Skills** (install as needed):

Install from URL:
```
/skill install https://github.com/example/my-skill
```

Install from local folder:
```
/skill install-path /path/to/skill-folder
```

Plugin Skill structure:
```
my-skill/
├── skill.json       # name, version, main, tools, author
└── index.js         # Exports tools and execute function
```

### 🌐 Supported Models

| Preset | Provider | API Format |
|--------|----------|------------|
| DeepSeek Chat | DeepSeek | OpenAI-compatible |
| DeepSeek Reasoner | DeepSeek | OpenAI-compatible |
| OpenAI GPT-4o | OpenAI | OpenAI-compatible |
| Claude Sonnet | Anthropic | Claude Messages API |
| Xiaomi MiMo | Xiaomi | OpenAI-compatible |
| Custom | Any | OpenAI / Claude |

### 🏗 Project Structure

```
DeepSeek-Code/
├── skills-builtin/  # Built-in knowledge Skills (SKILL.md format)
├── src/
│   ├── agent/       # AI agent core (tools, safety, system prompt, duplicate detection)
│   ├── api/         # LLM provider adapters (OpenAI, Claude)
│   │   └── providers/ # Provider implementations
│   ├── i18n/        # Internationalization (zh/en)
│   ├── skills/      # Skills plugin system (loader, manager, types)
│   ├── ui/          # Terminal display and banner
│   ├── __tests__/   # Test suites
│   ├── chat.ts      # Chat loop and command handler
│   ├── cli.ts       # CLI entry and initialization
│   ├── config.ts    # Configuration and setup wizard
│   ├── crypto.ts    # AES-256-CBC encryption
│   ├── env.ts       # Environment detection (Termux etc.)
│   ├── memory.ts    # Self-evolution memory system
│   ├── review.ts    # Self-review after tasks
│   ├── purification.ts # Auto-purification of memories
│   ├── session.ts   # Session persistence and context trimming
│   ├── types.ts     # TypeScript type definitions
│   └── uninstall.ts # Complete uninstall module
├── dist/            # Compiled JavaScript (after build)
└── package.json
```

### 🔧 Configuration

Config is stored at `~/.deepseek-code/config.json`. API keys are AES-256-CBC encrypted.

| Key | Description | Default |
|-----|-------------|---------|
| `language` | Interface language (`zh`/`en`) | `zh` |
| `provider` | API provider format (`openai`/`claude`) | `openai` |
| `apiBase` | API base URL | DeepSeek API |
| `apiKey` | API key (encrypted) | — |
| `model` | Model name | `deepseek-chat` |
| `maxTokens` | Max response tokens | `4096` |
| `temperature` | Sampling temperature | `0.7` |
| `safeMode` | Enable strict safety checks | `true` |

### 🧪 Testing

```bash
npm test
```

Tests cover: safety module, crypto encryption, session management, and environment detection.

### 🗑 Uninstall

```bash
# Inside DeepSeek Code chat:
/uninstall          # Remove config, sessions, skills, global command
/uninstall --all    # Also remove project source code

# Or from command line:
npm run uninstall
```

### 📄 License

MIT

---

<a id="中文"></a>

## 🚀 DeepSeek Code

DeepSeek Code 是一个强大的命令行 AI 编程助手，对标 Claude Code 和 OpenAI Codex 的开源替代方案。支持多种大模型供应商、内置知识型 Skills 和可扩展插件 Skills，甚至可以在 Android Termux 上运行。

### ✨ 功能特性

- **多模型支持** — DeepSeek、OpenAI、Claude/Anthropic、小米 MiMo 及任何 OpenAI 兼容 API
- **自主 Agent** — AI 自主运行，智能去重检测防止重复执行浪费 Token
- **向导式配置** — 首次启动引导选择语言、模型和 API Key，数字预设一键切换
- **中英双语界面** — 完整的 i18n 国际化支持，首次启动即可选择语言
- **内置知识型 Skills** — 9 个内置 Skills（前端设计、MCP 构建等），按需读取
- **可扩展插件 Skills** — 从网址或本地文件夹安装扩展，AI 自动使用已安装的 Skill 工具
- **会话管理** — 自动保存聊天记录，切换历史会话，创建新对话
- **安全防护** — AES-256-CBC 加密存储 API Key，命令硬/软拦截，受保护路径检查
- **Termux 兼容** — 完整的 Android/Termux 支持，环境检测、存储访问提示、剪贴板适配
- **上下文优化** — 基于 Token 的上下文裁剪，长对话不爆上下文
- **丰富的内置工具** — 文件读写编辑、目录列表、命令执行、剪贴板等
- **多种启动命令** — `deepseek-code`、`ds-code`、`dscode`（大小写不敏感）

### 📦 安装教程

> `npm run build` 会自动编译并注册全局命令，构建完成后直接用 `deepseek-code` / `ds-code` / `dscode` 启动即可。

#### 🪟 Windows

```bash
# 1. 安装 Node.js（LTS）— https://nodejs.org/ 或：
winget install OpenJS.NodeJS.LTS

# 2. 安装 Git — 或：winget install Git.Git

# 3. 克隆、构建、运行
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

#### 🍎 macOS

```bash
# 1. 安装 Node.js — 或：brew install node

# 2. 安装 Git — 或：brew install git

# 3. 克隆、构建、运行
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

#### 🐧 Linux

```bash
# 1. 安装 Node.js
#    Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs
#    Fedora: sudo dnf install nodejs
#    Arch: sudo pacman -S nodejs npm

# 2. 安装 Git

# 3. 克隆、构建、运行
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

#### 📱 Android (Termux)

```bash
# 1. 安装 Termux（F-Droid）— https://f-droid.org/packages/com.termux/

# 2. 安装依赖
pkg install nodejs git

# 3.（可选）开启存储访问
termux-setup-storage

# 4. 克隆、构建、运行
git clone https://github.com/jasgkabf/DeepSeek-Code.git
cd DeepSeek-Code
npm install
npm run build
deepseek-code
```

DeepSeek Code 自动检测 Termux 环境并适配：
- 使用 `pkg` 代替 `apt`
- 显示存储访问提示（`termux-setup-storage`）
- 适配移动端屏幕宽度
- 适配剪贴板命令

### 🏁 快速开始

首次启动时，配置向导将引导你完成：
1. **语言选择** — 选择中文或英文
2. **模型选择** — 从预设模型中选择（DeepSeek、OpenAI、Claude、MiMo 等）或自定义
3. **API Key** — 输入你的 API Key（AES-256-CBC 加密存储）

### 🛠 命令列表

| 命令 | 说明 |
|------|------|
| `/help` | 显示所有命令（分类展示） |
| `/setup` | 向导式切换 AI 模型（推荐！） |
| `/new` | 开始新聊天（旧聊天自动保存） |
| `/sessions` | 查看和切换历史聊天 |
| `/history` | 查看当前对话历史 |
| `/clear` | 清空当前聊天上下文 |
| `/config` | 查看当前配置 |
| `/set <键> <值>` | 修改单个配置项 |
| `/cd [路径]` | 查看或切换项目目录 |
| `/skill install <网址>` | 从网址安装 Skill |
| `/skill install-path <文件夹>` | 从本地文件夹安装 Skill |
| `/skill remove <名称>` | 删除已安装的 Skill |
| `/skills` | 列出所有 Skills（内置 + 已安装） |
| `/memory` | 查看智能体记忆统计 |
| `/uninstall` | 完全卸载 DeepSeek Code |
| `/exit` | 退出 DeepSeek Code |

### 🔌 Skills 系统

DeepSeek Code 有两种类型的 Skills：

**📚 内置知识型 Skills**（按需读取，不占系统提示词空间）：
- `frontend-design` — 创建独特的生产级前端界面
- `mcp-builder` — MCP 服务器构建指南
- `webapp-testing` — 使用 Playwright 测试 Web 应用
- `skill-creator` — 创建新 Skills 的指南
- `brand-guidelines` — 应用品牌色彩和排版
- `internal-comms` — 撰写内部沟通文档
- `doc-coauthoring` — 协作撰写文档
- `theme-factory` — 主题样式工厂
- `algorithmic-art` — 使用 p5.js 创建算法艺术

**🔌 可扩展插件 Skills**（按需安装）：

从网址安装：
```
/skill install https://github.com/example/my-skill
```

从本地文件夹安装：
```
/skill install-path /path/to/skill-folder
```

插件 Skill 目录结构：
```
my-skill/
├── skill.json       # name, version, main, tools, author
└── index.js         # 导出工具和 execute 函数
```

### 🌐 支持的模型

| 预设 | 供应商 | API 格式 |
|------|--------|----------|
| DeepSeek Chat | DeepSeek | OpenAI 兼容 |
| DeepSeek Reasoner | DeepSeek | OpenAI 兼容 |
| OpenAI GPT-4o | OpenAI | OpenAI 兼容 |
| Claude Sonnet | Anthropic | Claude Messages API |
| 小米 MiMo | 小米 | OpenAI 兼容 |
| 自定义 | 任意 | OpenAI / Claude |

### 🏗 项目结构

```
DeepSeek-Code/
├── skills-builtin/  # 内置知识型 Skills（SKILL.md 格式）
├── src/
│   ├── agent/       # AI Agent 核心（工具、安全、系统提示、重复检测）
│   ├── api/         # LLM 供应商适配器（OpenAI、Claude）
│   │   └── providers/ # 供应商实现
│   ├── i18n/        # 国际化（中/英）
│   ├── skills/      # Skills 插件系统（loader、manager、types）
│   ├── ui/          # 终端显示和横幅
│   ├── __tests__/   # 测试套件
│   ├── chat.ts      # 聊天循环和命令处理
│   ├── cli.ts       # CLI 入口和初始化
│   ├── config.ts    # 配置和设置向导
│   ├── crypto.ts    # AES-256-CBC 加密
│   ├── env.ts       # 环境检测（Termux 等）
│   ├── memory.ts    # 自我进化记忆系统
│   ├── review.ts    # 任务后自我复盘
│   ├── purification.ts # 记忆自动净化
│   ├── session.ts   # 会话持久化和上下文裁剪
│   ├── types.ts     # TypeScript 类型定义
│   └── uninstall.ts # 完全卸载模块
├── dist/            # 编译后的 JavaScript（构建后生成）
└── package.json
```

### 🔧 配置说明

配置文件存储在 `~/.deepseek-code/config.json`，API Key 使用 AES-256-CBC 加密。

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `language` | 界面语言 (`zh`/`en`) | `zh` |
| `provider` | API 供应商格式 (`openai`/`claude`) | `openai` |
| `apiBase` | API 地址 | DeepSeek API |
| `apiKey` | API Key（加密存储） | — |
| `model` | 模型名称 | `deepseek-chat` |
| `maxTokens` | 最大响应 Token 数 | `4096` |
| `temperature` | 采样温度 | `0.7` |
| `safeMode` | 启用严格安全检查 | `true` |

### 🧪 测试

```bash
npm test
```

测试覆盖：安全模块、加密模块、会话管理、环境检测。

### 🗑 卸载

```bash
# 在 DeepSeek Code 聊天界面中：
/uninstall          # 删除配置、会话、Skills、全局命令
/uninstall --all    # 同时删除项目源码

# 或从命令行：
npm run uninstall
```

### 📄 许可证

MIT
