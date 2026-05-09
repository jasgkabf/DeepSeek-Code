import { purifyMemories, loadExperiences, loadHabits, loadReviews } from './memory';

let lastPurifyTime = 0;
const PURIFY_INTERVAL = 30 * 60 * 1000;

export async function maybePurify(): Promise<{ purified: boolean; result?: { removed: number; merged: number; downgraded: number } }> {
  const now = Date.now();
  if (now - lastPurifyTime < PURIFY_INTERVAL) {
    return { purified: false };
  }
  lastPurifyTime = now;

  const experiences = await loadExperiences();
  const habits = await loadHabits();
  const reviews = await loadReviews();

  const totalItems = experiences.length + habits.length + reviews.length;
  if (totalItems < 20) {
    return { purified: false };
  }

  const result = await purifyMemories();
  return { purified: true, result };
}

export async function forcePurify(): Promise<{ removed: number; merged: number; downgraded: number }> {
  lastPurifyTime = Date.now();
  return purifyMemories();
}

export async function getMemoryStats(): Promise<{
  experienceCount: number;
  habitCount: number;
  reviewCount: number;
  topCategories: string[];
}> {
  const experiences = await loadExperiences();
  const habits = await loadHabits();
  const reviews = await loadReviews();

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
