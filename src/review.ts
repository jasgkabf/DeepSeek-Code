import {
  addReview,
  addExperience,
  categorizeTask,
  loadExperiences,
  Experience,
} from './memory';

export interface ReviewResult {
  taskGoal: string;
  detours: string;
  optimizations: string;
  keyExperience: string;
  optimalFlow: string;
  category: string;
}

export function performSelfReview(
  userMessage: string,
  assistantMessages: string[],
  toolCallsCount: number,
  hadErrors: boolean
): ReviewResult | null {
  if (assistantMessages.length === 0) return null;

  const category = categorizeTask(userMessage);
  const taskGoal = userMessage.substring(0, 100);

  let detours = '';
  if (hadErrors) {
    detours = '执行过程中遇到错误，需要分析错误原因并修复';
  }

  let optimizations = '';
  if (toolCallsCount > 8) {
    optimizations = '工具调用次数较多，可能存在冗余步骤，下次尝试精简流程';
  }

  const relevantExperiences = loadExperiences()
    .filter((e) => e.category === category && e.weight >= 0.5)
    .slice(0, 3);

  let keyExperience = '';
  if (relevantExperiences.length > 0) {
    keyExperience = relevantExperiences
      .map((e) => e.lessons)
      .join('; ');
  }

  const allAssistantText = assistantMessages.join(' ');
  let optimalFlow = '';
  if (allAssistantText.length > 50) {
    const sentences = allAssistantText.split(/[。.!\n]/).filter((s) => s.trim().length > 10);
    if (sentences.length > 0) {
      optimalFlow = sentences[0].trim().substring(0, 100);
    }
  }

  if (!detours && !optimizations && !keyExperience) {
    if (toolCallsCount <= 3 && !hadErrors) {
      return null;
    }
  }

  if (keyExperience || detours || optimizations) {
    addReview(taskGoal, detours, optimizations, keyExperience || '任务顺利完成', optimalFlow || '按当前流程执行即可');
  }

  if (detours || optimizations) {
    addExperience(
      category,
      taskGoal,
      keyExperience || detours || optimizations,
      optimalFlow || '按需执行'
    );
  }

  return {
    taskGoal,
    detours,
    optimizations,
    keyExperience,
    optimalFlow,
    category,
  };
}
