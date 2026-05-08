export type Language = 'zh' | 'en';

export interface Translations {
  banner: {
    subtitle: string;
    termuxEnv: string;
    helpHint: string;
    exitHint: string;
  };
  cli: {
    termuxDetected: string;
    storageWarning: string;
    storageHint: string;
    configLoaded: string;
    apiKeyNotSet: string;
    apiKeyHint: string;
    ready: string;
    goodbye: string;
    sessionSaved: string;
    sessionRestored: string;
    historyMessages: string;
  };
  setup: {
    firstTime: string;
    selectModel: string;
    enterNumber: string;
    invalidChoice: string;
    usingDefault: string;
    youSelected: string;
    enterApiKey: string;
    apiKeyRequired: string;
    modelName: string;
    modelUseDefault: string;
    customSetup: string;
    apiFormat: string;
    apiAddress: string;
    apiAddressDefault: string;
    modelRequired: string;
    configSaved: string;
    switchSuccess: string;
    currentModel: string;
    selectLanguage: string;
  };
  chat: {
    userPrefix: string;
    assistantPrefix: string;
    chatManagement: string;
    modelConfig: string;
    other: string;
    skillsSection: string;
    newChat: string;
    sessions: string;
    history: string;
    clear: string;
    setup: string;
    config: string;
    setConfig: string;
    cd: string;
    exit: string;
    skillInstall: string;
    skillInstallPath: string;
    skillRemove: string;
    directChat: string;
    chatCreated: string;
    chatOldSaved: string;
    chatSwitchHint: string;
    noHistory: string;
    historyTitle: string;
    historyCount: string;
    noSessions: string;
    sessionsTitle: string;
    sessionCurrent: string;
    sessionEmpty: string;
    sessionSwitchPrompt: string;
    sessionSwitched: string;
    sessionAlready: string;
    invalidIndex: string;
    sessionNotFound: string;
    sessionLoaded: string;
    cantDeleteCurrent: string;
    confirmDelete: string;
    sessionDeleted: string;
  };
  tools: {
    callingTool: string;
    params: string;
    commandConfirm: string;
    commandCancelled: string;
    commandBlocked: string;
    commandExecuting: string;
    commandTimeout: string;
    fileNotFound: string;
    dirNotFound: string;
    notAFile: string;
    notADir: string;
    cannotRead: string;
    cannotWrite: string;
    cannotEdit: string;
    protectedPath: string;
    fileWritten: string;
    fileAppended: string;
    fileEdited: string;
    fileEditedAll: string;
    textNotFound: string;
    multipleMatch: string;
    multipleMatchHint: string;
    copied: string;
    clipboardNotFound: string;
    clipboardFailed: string;
    termuxPkgHint: string;
    aptToPkg: string;
    storageHint: string;
    noPermission: string;
  };
  agent: {
    systemPrompt: string;
    systemPromptTools: string;
    systemPromptPrinciples: string;
    termuxNote: string;
    skillsNote: string;
    maxIterations: string;
    apiError: string;
    requestFailed: string;
  };
  skills: {
    noSkills: string;
    installHint: string;
    installedTitle: string;
    toolCount: string;
    author: string;
    removeHint: string;
    installing: string;
    installSuccess: string;
    installFailed: string;
    usage: string;
    example: string;
    confirmRemove: string;
    removeSuccess: string;
    removeFailed: string;
    unknownSub: string;
    available: string;
    installed: string;
    notInstalled: string;
    downloadFailed: string;
    noSkillJson: string;
    invalidJson: string;
    missingFields: string;
    mainNotFound: string;
    copyFailed: string;
    skillExecError: string;
  };
  errors: {
    authFailed: string;
    authSuggestion: string;
    rateLimited: string;
    rateSuggestion: string;
    networkError: string;
    networkSuggestion: string;
    generic: string;
    reasoningError: string;
    badRequest: string;
    accessDenied: string;
    serverError: string;
  };
  config: {
    currentConfig: string;
    provider: string;
    apiBase: string;
    model: string;
    maxTokens: string;
    temperature: string;
    topP: string;
    frequencyPenalty: string;
    presencePenalty: string;
    safeMode: string;
    projectDir: string;
    maxContextTokens: string;
    apiKey: string;
    notSet: string;
    updated: string;
    unknownKey: string;
    configurableKeys: string;
  };
  uninstall: {
    title: string;
    warning: string;
    confirm: string;
    confirmType: string;
    removingConfig: string;
    removingSessions: string;
    removingSkills: string;
    removingGlobalLink: string;
    removingProject: string;
    success: string;
    cancelled: string;
    confirmMismatch: string;
    configRemoved: string;
    sessionsRemoved: string;
    skillsRemoved: string;
    globalLinkRemoved: string;
    projectRemoved: string;
    notInstalled: string;
    hint: string;
  };
}

const zh: Translations = {
  banner: {
    subtitle: '对标 Claude Code / Codex 的命令行 AI 编程助手',
    termuxEnv: '运行环境: Termux (Android)',
    helpHint: '输入 /help 查看帮助，/exit 退出',
    exitHint: '启动命令: deepseek-code / ds-code / dscode',
  },
  cli: {
    termuxDetected: '检测到 Termux 环境',
    storageWarning: '未获取存储访问权限，访问 /sdcard 等路径可能失败',
    storageHint: '请运行: termux-setup-storage（需先安装: pkg install termux-api）',
    configLoaded: '已加载配置 - 供应商: {provider}, 模型: {model} [{env}]',
    apiKeyNotSet: 'API Key 未设置，无法启动',
    apiKeyHint: '请运行配置向导或使用 /set apiKey <key> 设置',
    ready: 'DeepSeek Code 已就绪',
    goodbye: 'DeepSeek Code 会话已保存，再见！',
    sessionSaved: '会话已保存',
    sessionRestored: '已恢复上次会话 ({count} 条历史消息)',
    historyMessages: '条消息',
  },
  setup: {
    firstTime: '首次使用 DeepSeek Code，请配置 API 信息',
    selectModel: '请选择你要用的 AI 模型（输入数字）',
    enterNumber: '请输入序号',
    invalidChoice: '无效选择，使用默认 DeepSeek',
    usingDefault: '使用默认 DeepSeek',
    youSelected: '你选择了: {name}',
    enterApiKey: '请输入 API Key',
    apiKeyRequired: 'API Key 不能为空',
    modelName: '模型名称',
    modelUseDefault: '回车使用 {model}',
    customSetup: '自定义配置',
    apiFormat: 'API 格式 (1=openai兼容, 2=claude，回车默认 openai)',
    apiAddress: 'API 地址',
    apiAddressDefault: '回车使用 {url}',
    modelRequired: '模型名称不能为空',
    configSaved: '配置已保存到 {path}',
    switchSuccess: '模型切换成功！当前模型: {model}',
    currentModel: '当前模型: {model} ({url})',
    selectLanguage: '请选择语言 / Select language',
  },
  chat: {
    userPrefix: 'You',
    assistantPrefix: 'DeepSeek Code',
    chatManagement: '💬 聊天管理',
    modelConfig: '⚙ 模型与配置',
    other: '📁 其他',
    skillsSection: '🔌 Skills (扩展工具)',
    newChat: '开始新聊天（旧聊天自动保存）',
    sessions: '查看/切换历史聊天',
    history: '查看当前对话历史',
    clear: '清空当前聊天上下文',
    setup: '切换 AI 模型（向导式，推荐！）',
    config: '查看当前配置',
    setConfig: '修改单个配置项',
    cd: '查看/切换项目目录',
    exit: '退出 DeepSeek Code',
    skillInstall: '从网址安装 Skill',
    skillInstallPath: '从本地文件夹安装 Skill',
    skillRemove: '删除已安装的 Skill',
    directChat: '直接输入自然语言即可与 AI 对话，AI 可调用工具读写文件和执行命令',
    chatCreated: '已创建新会话，旧会话已保存',
    chatOldSaved: '输入 /sessions 可查看历史会话，/load <id> 切换回去',
    chatSwitchHint: '输入 /sessions 查看历史聊天，/setup 切换模型',
    noHistory: '暂无对话历史',
    historyTitle: '对话历史',
    historyCount: '条',
    noSessions: '暂无历史会话',
    sessionsTitle: '历史聊天',
    sessionCurrent: '← 当前',
    sessionEmpty: '(空)',
    sessionSwitchPrompt: '输入序号切换到该聊天，或回车返回',
    sessionSwitched: '已切换到聊天 {index} ({count} 条消息)',
    sessionAlready: '已经是当前会话',
    invalidIndex: '无效序号',
    sessionNotFound: '会话不存在: {id}',
    sessionLoaded: '已加载会话 ({count} 条消息)',
    cantDeleteCurrent: '不能删除当前活跃会话',
    confirmDelete: '确认删除该会话?',
    sessionDeleted: '会话已删除',
  },
  tools: {
    callingTool: '调用工具',
    params: '参数',
    commandConfirm: '确认执行此命令?',
    commandCancelled: '用户取消了命令执行',
    commandBlocked: '命令被安全机制拦截',
    commandExecuting: '执行命令',
    commandTimeout: '命令执行超时',
    fileNotFound: '文件不存在',
    dirNotFound: '目录不存在',
    notAFile: '路径是目录而非文件',
    notADir: '路径不是目录',
    cannotRead: '无法读取文件',
    cannotWrite: '无法写入文件',
    cannotEdit: '无法编辑文件',
    protectedPath: '禁止写入受保护的系统路径',
    fileWritten: '文件已写入',
    fileAppended: '内容已追加',
    fileEdited: '文件已编辑',
    fileEditedAll: '替换了 {count} 处',
    textNotFound: '未找到要替换的文本',
    multipleMatch: '找到 {count} 处匹配',
    multipleMatchHint: '请提供更精确的上下文以唯一定位，或设置 replace_all=true 替换所有匹配',
    copied: '已复制到剪贴板',
    clipboardNotFound: '剪贴板工具未安装',
    clipboardFailed: '复制到剪贴板失败',
    termuxPkgHint: '请运行: pkg install termux-api',
    aptToPkg: '检测到 Termux 环境，建议使用',
    storageHint: '在 Termux 中访问手机存储需要运行: termux-setup-storage',
    noPermission: '无权限',
  },
  agent: {
    systemPrompt: '你是 DeepSeek Code，一个强大的命令行 AI 编程助手。你可以帮助用户编写代码、调试问题、管理项目文件和执行命令。',
    systemPromptTools: '你具备以下内置工具能力',
    systemPromptPrinciples: '工作原则',
    termuxNote: '当前运行在 Termux (Android) 环境下，请注意',
    skillsNote: '已安装的 Skills (扩展工具)',
    maxIterations: '本轮对话已达到最大工具调用次数，如需继续请发送新消息',
    apiError: 'API 错误',
    requestFailed: '请求失败',
  },
  skills: {
    noSkills: '暂未安装任何 Skill',
    installHint: '使用 /skill install <网址> 安装，或告诉 AI 帮你安装',
    installedTitle: '已安装的 Skills',
    toolCount: '工具数',
    author: '作者',
    removeHint: '使用 /skill remove <名称> 删除，AI 可自动使用已安装的 Skill 工具',
    installing: '正在安装 Skill',
    installSuccess: '安装成功',
    installFailed: '安装失败',
    usage: '用法',
    example: '示例',
    confirmRemove: '确认删除 Skill',
    removeSuccess: '已删除',
    removeFailed: '删除失败',
    unknownSub: '未知子命令',
    available: '可用',
    installed: '已安装',
    notInstalled: '未安装',
    downloadFailed: '下载完成但未找到 skill.json，请确认这是一个有效的 Skill',
    noSkillJson: '未找到 skill.json',
    invalidJson: 'skill.json 格式无效',
    missingFields: 'skill.json 缺少必要字段 (name, version, main, tools)',
    mainNotFound: 'Skill 主文件不存在',
    copyFailed: '复制文件失败',
    skillExecError: 'Skill 工具执行错误',
  },
  errors: {
    authFailed: '认证失败: API Key 无效或已过期',
    authSuggestion: '请检查 API Key 是否正确，输入 /setup 重新配置',
    rateLimited: '请求过于频繁: 已触发速率限制',
    rateSuggestion: '请稍后重试，或检查 API 账户余额',
    networkError: '网络连接失败',
    networkSuggestion: '请检查网络连接，输入 /setup 确认 API 地址',
    generic: '处理消息时出错',
    reasoningError: '推理模型请求格式错误: reasoning_content 必须回传',
    badRequest: '请求参数错误',
    accessDenied: '访问被拒绝: 无权限访问该模型',
    serverError: '服务端错误: API 服务暂时不可用',
  },
  config: {
    currentConfig: '当前配置',
    provider: '供应商',
    apiBase: 'API 地址',
    model: '模型',
    maxTokens: '最大Token数',
    temperature: '温度',
    topP: 'TopP',
    frequencyPenalty: '频率惩罚',
    presencePenalty: '存在惩罚',
    safeMode: '安全模式',
    projectDir: '项目目录',
    maxContextTokens: '最大上下文Token',
    apiKey: 'API Key',
    notSet: '(未设置)',
    updated: '配置已更新',
    unknownKey: '未知的配置项',
    configurableKeys: '可配置项',
  },
  uninstall: {
    title: '🗑 完全卸载 DeepSeek Code',
    warning: '⚠️  此操作将删除所有配置、会话记录、已安装的 Skills 和全局命令，不可恢复！',
    confirm: '请输入 "uninstall" 确认完全卸载',
    confirmType: 'uninstall',
    removingConfig: '正在删除配置文件...',
    removingSessions: '正在删除会话记录...',
    removingSkills: '正在删除已安装的 Skills...',
    removingGlobalLink: '正在移除全局命令...',
    removingProject: '正在删除项目文件...',
    success: 'DeepSeek Code 已完全卸载，再见！',
    cancelled: '卸载已取消',
    confirmMismatch: '输入不匹配，卸载已取消',
    configRemoved: '已删除配置目录: {path}',
    sessionsRemoved: '已删除 {count} 个会话文件',
    skillsRemoved: '已删除 {count} 个 Skill',
    globalLinkRemoved: '已移除全局命令 deepseek-code',
    projectRemoved: '已删除项目目录: {path}',
    notInstalled: '全局命令未安装（非 npm link 安装）',
    hint: '你也可以手动删除项目文件夹来完成卸载',
  },
};

const en: Translations = {
  banner: {
    subtitle: 'CLI AI Coding Assistant — Alternative to Claude Code / Codex',
    termuxEnv: 'Environment: Termux (Android)',
    helpHint: 'Type /help for help, /exit to quit',
    exitHint: 'Commands: deepseek-code / ds-code / dscode',
  },
  cli: {
    termuxDetected: 'Termux environment detected',
    storageWarning: 'Storage access not granted, /sdcard paths may fail',
    storageHint: 'Run: termux-setup-storage (requires: pkg install termux-api)',
    configLoaded: 'Config loaded - Provider: {provider}, Model: {model} [{env}]',
    apiKeyNotSet: 'API Key not set, cannot start',
    apiKeyHint: 'Run the setup wizard or use /set apiKey <key>',
    ready: 'DeepSeek Code is ready',
    goodbye: 'Session saved. Goodbye!',
    sessionSaved: 'Session saved',
    sessionRestored: 'Restored previous session ({count} messages)',
    historyMessages: 'messages',
  },
  setup: {
    firstTime: 'First time using DeepSeek Code, please configure API',
    selectModel: 'Select an AI model (enter number)',
    enterNumber: 'Enter number',
    invalidChoice: 'Invalid choice, using default DeepSeek',
    usingDefault: 'Using default DeepSeek',
    youSelected: 'You selected: {name}',
    enterApiKey: 'Enter API Key',
    apiKeyRequired: 'API Key cannot be empty',
    modelName: 'Model name',
    modelUseDefault: 'Press Enter to use {model}',
    customSetup: 'Custom setup',
    apiFormat: 'API format (1=openai-compatible, 2=claude, Enter=openai)',
    apiAddress: 'API base URL',
    apiAddressDefault: 'Press Enter to use {url}',
    modelRequired: 'Model name cannot be empty',
    configSaved: 'Config saved to {path}',
    switchSuccess: 'Model switched! Current model: {model}',
    currentModel: 'Current model: {model} ({url})',
    selectLanguage: 'Select language / 请选择语言',
  },
  chat: {
    userPrefix: 'You',
    assistantPrefix: 'DeepSeek Code',
    chatManagement: '💬 Chat',
    modelConfig: '⚙ Model & Config',
    other: '📁 Other',
    skillsSection: '🔌 Skills (Extensions)',
    newChat: 'Start new chat (old chat auto-saved)',
    sessions: 'View/switch chat history',
    history: 'View current chat history',
    clear: 'Clear current chat context',
    setup: 'Switch AI model (wizard, recommended!)',
    config: 'View current config',
    setConfig: 'Set a config value',
    cd: 'View/switch project directory',
    exit: 'Exit DeepSeek Code',
    skillInstall: 'Install Skill from URL',
    skillInstallPath: 'Install Skill from local folder',
    skillRemove: 'Remove an installed Skill',
    directChat: 'Type naturally to chat with AI. AI can read/write files and run commands.',
    chatCreated: 'New chat created, old chat saved',
    chatOldSaved: 'Use /sessions to view history, /load <id> to switch back',
    chatSwitchHint: 'Type /sessions to view chats, /setup to switch model',
    noHistory: 'No chat history',
    historyTitle: 'Chat history',
    historyCount: '',
    noSessions: 'No saved sessions',
    sessionsTitle: 'Chat history',
    sessionCurrent: '← current',
    sessionEmpty: '(empty)',
    sessionSwitchPrompt: 'Enter number to switch, or Enter to go back',
    sessionSwitched: 'Switched to chat {index} ({count} messages)',
    sessionAlready: 'Already the current session',
    invalidIndex: 'Invalid number',
    sessionNotFound: 'Session not found: {id}',
    sessionLoaded: 'Session loaded ({count} messages)',
    cantDeleteCurrent: 'Cannot delete the active session',
    confirmDelete: 'Confirm delete this session?',
    sessionDeleted: 'Session deleted',
  },
  tools: {
    callingTool: 'Calling tool',
    params: 'Params',
    commandConfirm: 'Confirm execute this command?',
    commandCancelled: 'Command cancelled by user',
    commandBlocked: 'Command blocked by safety mechanism',
    commandExecuting: 'Executing command',
    commandTimeout: 'Command timed out',
    fileNotFound: 'File not found',
    dirNotFound: 'Directory not found',
    notAFile: 'Path is a directory, not a file',
    notADir: 'Path is not a directory',
    cannotRead: 'Cannot read file',
    cannotWrite: 'Cannot write file',
    cannotEdit: 'Cannot edit file',
    protectedPath: 'Write to protected system path denied',
    fileWritten: 'File written',
    fileAppended: 'Content appended',
    fileEdited: 'File edited',
    fileEditedAll: 'Replaced {count} occurrences',
    textNotFound: 'Text to replace not found',
    multipleMatch: 'Found {count} matches',
    multipleMatchHint: 'Provide more context for unique match, or set replace_all=true',
    copied: 'Copied to clipboard',
    clipboardNotFound: 'Clipboard tool not installed',
    clipboardFailed: 'Copy to clipboard failed',
    termuxPkgHint: 'Run: pkg install termux-api',
    aptToPkg: 'Termux detected, recommend using',
    storageHint: 'Run termux-setup-storage to access phone storage',
    noPermission: 'Permission denied',
  },
  agent: {
    systemPrompt: 'You are DeepSeek Code, a powerful CLI AI coding assistant. You help users write code, debug issues, manage project files, and execute commands.',
    systemPromptTools: 'Built-in tools',
    systemPromptPrinciples: 'Working principles',
    termuxNote: 'Running in Termux (Android) environment. Note',
    skillsNote: 'Installed Skills (extensions)',
    maxIterations: 'Max tool calls reached for this turn. Send a new message to continue',
    apiError: 'API error',
    requestFailed: 'Request failed',
  },
  skills: {
    noSkills: 'No Skills installed',
    installHint: 'Use /skill install <url> to install, or ask AI to help',
    installedTitle: 'Installed Skills',
    toolCount: 'tools',
    author: 'Author',
    removeHint: 'Use /skill remove <name> to remove. AI auto-uses installed Skill tools.',
    installing: 'Installing Skill',
    installSuccess: 'Installed successfully',
    installFailed: 'Installation failed',
    usage: 'Usage',
    example: 'Example',
    confirmRemove: 'Confirm remove Skill',
    removeSuccess: 'Removed',
    removeFailed: 'Remove failed',
    unknownSub: 'Unknown sub-command',
    available: 'Available',
    installed: 'Installed',
    notInstalled: 'Not installed',
    downloadFailed: 'Downloaded but skill.json not found. Is this a valid Skill?',
    noSkillJson: 'skill.json not found',
    invalidJson: 'Invalid skill.json format',
    missingFields: 'skill.json missing required fields (name, version, main, tools)',
    mainNotFound: 'Skill main file not found',
    copyFailed: 'Copy files failed',
    skillExecError: 'Skill tool execution error',
  },
  errors: {
    authFailed: 'Authentication failed: API Key invalid or expired',
    authSuggestion: 'Check your API Key, or run /setup to reconfigure',
    rateLimited: 'Rate limited: too many requests',
    rateSuggestion: 'Please retry later, or check your API account balance',
    networkError: 'Network connection failed',
    networkSuggestion: 'Check your network, or run /setup to verify API URL',
    generic: 'Error processing message',
    reasoningError: 'Reasoning model format error: reasoning_content must be passed back',
    badRequest: 'Bad request parameters',
    accessDenied: 'Access denied: no permission for this model',
    serverError: 'Server error: API service temporarily unavailable',
  },
  config: {
    currentConfig: 'Current config',
    provider: 'Provider',
    apiBase: 'API Base',
    model: 'Model',
    maxTokens: 'MaxTokens',
    temperature: 'Temperature',
    topP: 'TopP',
    frequencyPenalty: 'FreqPenalty',
    presencePenalty: 'PresPenalty',
    safeMode: 'SafeMode',
    projectDir: 'ProjectDir',
    maxContextTokens: 'MaxContextTokens',
    apiKey: 'API Key',
    notSet: '(not set)',
    updated: 'Config updated',
    unknownKey: 'Unknown config key',
    configurableKeys: 'Configurable keys',
  },
  uninstall: {
    title: '🗑 Uninstall DeepSeek Code Completely',
    warning: '⚠️  This will remove all config, sessions, installed Skills, and the global command. This cannot be undone!',
    confirm: 'Type "uninstall" to confirm complete uninstall',
    confirmType: 'uninstall',
    removingConfig: 'Removing config files...',
    removingSessions: 'Removing session files...',
    removingSkills: 'Removing installed Skills...',
    removingGlobalLink: 'Removing global command...',
    removingProject: 'Removing project files...',
    success: 'DeepSeek Code has been completely uninstalled. Goodbye!',
    cancelled: 'Uninstall cancelled',
    confirmMismatch: 'Input mismatch, uninstall cancelled',
    configRemoved: 'Removed config directory: {path}',
    sessionsRemoved: 'Removed {count} session files',
    skillsRemoved: 'Removed {count} Skill(s)',
    globalLinkRemoved: 'Removed global command deepseek-code',
    projectRemoved: 'Removed project directory: {path}',
    notInstalled: 'Global command not installed (not linked via npm link)',
    hint: 'You can also manually delete the project folder to complete uninstall',
  },
};

const translations: Record<Language, Translations> = { zh, en };

let currentLang: Language = 'zh';

export function setLanguage(lang: Language): void {
  currentLang = lang;
}

export function getLanguage(): Language {
  return currentLang;
}

export function t(): Translations {
  return translations[currentLang];
}

export function template(str: string, vars: Record<string, string | number>): string {
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? _));
}
