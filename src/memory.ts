import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const MEMORY_DIR = path.join(os.homedir(), '.deepseek-code', 'memory');
const EXPERIENCES_FILE = path.join(MEMORY_DIR, 'experiences.json');
const HABITS_FILE = path.join(MEMORY_DIR, 'habits.json');
const REVIEW_FILE = path.join(MEMORY_DIR, 'reviews.json');

export interface Experience {
  id: string;
  category: string;
  task: string;
  lessons: string;
  optimalFlow: string;
  weight: number;
  createdAt: number;
  lastUsedAt: number;
  useCount: number;
}

export interface UserHabit {
  id: string;
  pattern: string;
  frequency: number;
  lastSeenAt: number;
}

export interface Review {
  id: string;
  taskGoal: string;
  detours: string;
  optimizations: string;
  keyExperience: string;
  optimalFlow: string;
  createdAt: number;
}

const MAX_EXPERIENCES = 200;
const MAX_HABITS = 100;
const MAX_REVIEWS = 50;
const LOW_WEIGHT_THRESHOLD = 0.1;
const SIMILARITY_MERGE_THRESHOLD = 0.7;

function ensureDir(): void {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function loadExperiences(): Experience[] {
  ensureDir();
  try {
    if (!fs.existsSync(EXPERIENCES_FILE)) return [];
    return JSON.parse(fs.readFileSync(EXPERIENCES_FILE, 'utf-8'));
  } catch { return []; }
}

export function saveExperiences(experiences: Experience[]): void {
  ensureDir();
  fs.writeFileSync(EXPERIENCES_FILE, JSON.stringify(experiences, null, 2));
}

export function loadHabits(): UserHabit[] {
  ensureDir();
  try {
    if (!fs.existsSync(HABITS_FILE)) return [];
    return JSON.parse(fs.readFileSync(HABITS_FILE, 'utf-8'));
  } catch { return []; }
}

export function saveHabits(habits: UserHabit[]): void {
  ensureDir();
  fs.writeFileSync(HABITS_FILE, JSON.stringify(habits, null, 2));
}

export function loadReviews(): Review[] {
  ensureDir();
  try {
    if (!fs.existsSync(REVIEW_FILE)) return [];
    return JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf-8'));
  } catch { return []; }
}

export function saveReviews(reviews: Review[]): void {
  ensureDir();
  fs.writeFileSync(REVIEW_FILE, JSON.stringify(reviews, null, 2));
}

export function addExperience(category: string, task: string, lessons: string, optimalFlow: string): Experience {
  const experiences = loadExperiences();

  const similar = findSimilarExperience(experiences, category, task);
  if (similar) {
    similar.lessons = lessons;
    similar.optimalFlow = optimalFlow;
    similar.weight = Math.min(similar.weight + 0.1, 1.0);
    similar.lastUsedAt = Date.now();
    similar.useCount++;
    saveExperiences(experiences);
    return similar;
  }

  const exp: Experience = {
    id: generateId(),
    category,
    task,
    lessons,
    optimalFlow,
    weight: 0.5,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    useCount: 1,
  };

  experiences.push(exp);

  if (experiences.length > MAX_EXPERIENCES) {
    experiences.sort((a, b) => b.weight - a.weight);
    experiences.splice(MAX_EXPERIENCES);
  }

  saveExperiences(experiences);
  return exp;
}

function findSimilarExperience(experiences: Experience[], category: string, task: string): Experience | null {
  const taskLower = task.toLowerCase();
  const taskWords = taskLower.split(/\s+/);

  for (const exp of experiences) {
    if (exp.category !== category) continue;
    const expLower = exp.task.toLowerCase();
    const expWords = expLower.split(/\s+/);
    const commonWords = taskWords.filter((w) => expWords.includes(w) && w.length > 2);
    const similarity = commonWords.length / Math.max(taskWords.length, expWords.length, 1);
    if (similarity >= SIMILARITY_MERGE_THRESHOLD) {
      return exp;
    }
  }
  return null;
}

export function recordUserHabit(pattern: string): void {
  const habits = loadHabits();
  const existing = habits.find((h) => h.pattern === pattern);
  if (existing) {
    existing.frequency++;
    existing.lastSeenAt = Date.now();
  } else {
    habits.push({
      id: generateId(),
      pattern,
      frequency: 1,
      lastSeenAt: Date.now(),
    });
  }
  if (habits.length > MAX_HABITS) {
    habits.sort((a, b) => b.frequency - a.frequency);
    habits.splice(MAX_HABITS);
  }
  saveHabits(habits);
}

export function addReview(taskGoal: string, detours: string, optimizations: string, keyExperience: string, optimalFlow: string): Review {
  const reviews = loadReviews();
  const review: Review = {
    id: generateId(),
    taskGoal,
    detours,
    optimizations,
    keyExperience,
    optimalFlow,
    createdAt: Date.now(),
  };
  reviews.unshift(review);
  if (reviews.length > MAX_REVIEWS) {
    reviews.splice(MAX_REVIEWS);
  }
  saveReviews(reviews);
  return review;
}

export function purifyMemories(): { removed: number; merged: number; downgraded: number } {
  const experiences = loadExperiences();
  let removed = 0;
  let merged = 0;
  let downgraded = 0;

  const now = Date.now();
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

  for (let i = experiences.length - 1; i >= 0; i--) {
    const exp = experiences[i];
    const age = now - exp.lastUsedAt;

    if (exp.weight < LOW_WEIGHT_THRESHOLD && age > ONE_WEEK) {
      experiences.splice(i, 1);
      removed++;
      continue;
    }

    if (age > ONE_WEEK && exp.useCount <= 1) {
      exp.weight *= 0.8;
      downgraded++;
    }
  }

  const seen = new Map<string, number>();
  for (let i = experiences.length - 1; i >= 0; i--) {
    const key = experiences[i].category + ':' + experiences[i].task.substring(0, 30);
    if (seen.has(key)) {
      const prevIdx = seen.get(key)!;
      if (experiences[prevIdx].weight >= experiences[i].weight) {
        experiences.splice(i, 1);
        merged++;
      } else {
        experiences.splice(prevIdx, 1);
        merged++;
        seen.set(key, i);
      }
    } else {
      seen.set(key, i);
    }
  }

  saveExperiences(experiences);

  const habits = loadHabits();
  const beforeHabits = habits.length;
  const filtered = habits.filter((h) => h.frequency > 1 || (now - h.lastSeenAt) < ONE_WEEK);
  removed += beforeHabits - filtered.length;
  saveHabits(filtered);

  return { removed, merged, downgraded };
}

export function buildMemoryPrompt(): string {
  const experiences = loadExperiences();
  const habits = loadHabits();
  const reviews = loadReviews();

  if (experiences.length === 0 && habits.length === 0 && reviews.length === 0) {
    return '';
  }

  let prompt = '\n\n[进化记忆]';

  const topExperiences = experiences
    .filter((e) => e.weight >= 0.3)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  if (topExperiences.length > 0) {
    prompt += ' 经验:';
    for (const exp of topExperiences) {
      prompt += `\n- [${exp.category}] ${exp.lessons} → ${exp.optimalFlow}`;
    }
  }

  const topHabits = habits
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  if (topHabits.length > 0) {
    prompt += ' 用户习惯:';
    for (const habit of topHabits) {
      prompt += ` ${habit.pattern}(${habit.frequency}次)`;
    }
  }

  const recentReviews = reviews.slice(0, 2);
  if (recentReviews.length > 0) {
    prompt += ' 近期复盘:';
    for (const review of recentReviews) {
      prompt += ` ${review.keyExperience.substring(0, 60)}`;
    }
  }

  return prompt;
}

export function extractUserHabitFromMessage(message: string): string | null {
  const patterns: Array<{ regex: RegExp; habit: string }> = [
    { regex: /(?:帮我|给我|请)?(?:创建|新建|生成|写)(?:一个|个)?(.{2,20})(?:文件|组件|模块|页面|接口|函数|类)/, habit: '创建文件/组件' },
    { regex: /(?:修复|解决|fix|debug)(.{2,30})(?:bug|错误|问题|报错|error)/, habit: '修复 Bug' },
    { regex: /(?:优化|改进|重构|refactor)(.{2,30})/, habit: '优化重构' },
    { regex: /(?:安装|install|添加)(.{2,30})(?:包|依赖|库|插件|skill)/, habit: '安装依赖' },
    { regex: /(?:运行|启动|执行|跑)(.{2,20})/, habit: '运行项目' },
    { regex: /(?:部署|发布|deploy|publish)(.{2,20})/, habit: '部署发布' },
    { regex: /(?:测试|test)(.{2,20})/, habit: '编写测试' },
    { regex: /(?:解释|说明|什么是|怎么理解)(.{2,30})/, habit: '知识解释' },
  ];

  for (const { regex, habit } of patterns) {
    if (regex.test(message)) return habit;
  }

  if (message.length < 10) return null;
  if (/\/\w+/.test(message)) return null;

  const firstWord = message.split(/\s+/)[0];
  if (firstWord && firstWord.length <= 4) {
    return `常用: ${firstWord}...`;
  }

  return null;
}

export function categorizeTask(message: string): string {
  if (/(?:创建|新建|生成|写|add|create|write|new)/.test(message)) return 'create';
  if (/(?:修复|解决|fix|debug|solve|resolve)/.test(message)) return 'fix';
  if (/(?:优化|改进|重构|refactor|optimize|improve)/.test(message)) return 'optimize';
  if (/(?:安装|install|setup|配置)/.test(message)) return 'setup';
  if (/(?:运行|启动|run|start|execute)/.test(message)) return 'run';
  if (/(?:部署|deploy|publish|发布)/.test(message)) return 'deploy';
  if (/(?:测试|test)/.test(message)) return 'test';
  if (/(?:解释|explain|说明|什么是)/.test(message)) return 'explain';
  return 'general';
}
