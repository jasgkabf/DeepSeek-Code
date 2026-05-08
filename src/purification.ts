import { purifyMemories, loadExperiences, loadHabits, loadReviews } from './memory';

let lastPurifyTime = 0;
const PURIFY_INTERVAL = 30 * 60 * 1000;

export function maybePurify(): { purified: boolean; result?: { removed: number; merged: number; downgraded: number } } {
  const now = Date.now();
  if (now - lastPurifyTime < PURIFY_INTERVAL) {
    return { purified: false };
  }
  lastPurifyTime = now;

  const experiences = loadExperiences();
  const habits = loadHabits();
  const reviews = loadReviews();

  const totalItems = experiences.length + habits.length + reviews.length;
  if (totalItems < 20) {
    return { purified: false };
  }

  const result = purifyMemories();
  return { purified: true, result };
}

export function forcePurify(): { removed: number; merged: number; downgraded: number } {
  lastPurifyTime = Date.now();
  return purifyMemories();
}

export function getMemoryStats(): {
  experienceCount: number;
  habitCount: number;
  reviewCount: number;
  topCategories: string[];
} {
  const experiences = loadExperiences();
  const habits = loadHabits();
  const reviews = loadReviews();

  const categoryCount = new Map<string, number>();
  for (const exp of experiences) {
    categoryCount.set(exp.category, (categoryCount.get(exp.category) || 0) + 1);
  }

  const topCategories = Array.from(categoryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  return {
    experienceCount: experiences.length,
    habitCount: habits.length,
    reviewCount: reviews.length,
    topCategories,
  };
}
