export interface BudgetConfig {
  maxSteps: number;
  maxToolCalls: number;
  maxElapsedMs: number;
  maxConsecutiveFailures: number;
  maxTotalTokens: number;
}

export const DEFAULT_BUDGET: BudgetConfig = {
  maxSteps: 50,
  maxToolCalls: 100,
  maxElapsedMs: 5 * 60 * 1000,
  maxConsecutiveFailures: 5,
  maxTotalTokens: 200000,
};

export interface BudgetState {
  steps: number;
  toolCalls: number;
  elapsedMs: number;
  consecutiveFailures: number;
  totalTokens: number;
  startTime: number;
}

export type BudgetExceededReason =
  | 'maxSteps'
  | 'maxToolCalls'
  | 'maxElapsedMs'
  | 'maxConsecutiveFailures'
  | 'maxTotalTokens';

export class BudgetController {
  private config: BudgetConfig;
  private state: BudgetState;

  constructor(config?: Partial<BudgetConfig>) {
    this.config = { ...DEFAULT_BUDGET, ...config };
    this.state = {
      steps: 0,
      toolCalls: 0,
      elapsedMs: 0,
      consecutiveFailures: 0,
      totalTokens: 0,
      startTime: Date.now(),
    };
  }

  step(): BudgetExceededReason | null {
    this.state.steps++;
    this.state.elapsedMs = Date.now() - this.state.startTime;
    return this.check();
  }

  recordToolCall(success: boolean): BudgetExceededReason | null {
    this.state.toolCalls++;
    if (success) {
      this.state.consecutiveFailures = 0;
    } else {
      this.state.consecutiveFailures++;
    }
    return this.check();
  }

  recordTokens(promptTokens: number, completionTokens: number): BudgetExceededReason | null {
    this.state.totalTokens += promptTokens + completionTokens;
    return this.check();
  }

  private check(): BudgetExceededReason | null {
    if (this.state.steps >= this.config.maxSteps) return 'maxSteps';
    if (this.state.toolCalls >= this.config.maxToolCalls) return 'maxToolCalls';
    if (this.state.elapsedMs >= this.config.maxElapsedMs) return 'maxElapsedMs';
    if (this.state.consecutiveFailures >= this.config.maxConsecutiveFailures) return 'maxConsecutiveFailures';
    if (this.state.totalTokens >= this.config.maxTotalTokens) return 'maxTotalTokens';
    return null;
  }

  exceeded(): boolean {
    return this.check() !== null;
  }

  getReason(): BudgetExceededReason | null {
    return this.check();
  }

  getState(): Readonly<BudgetState> {
    return { ...this.state, elapsedMs: Date.now() - this.state.startTime };
  }

  getConfig(): Readonly<BudgetConfig> {
    return { ...this.config };
  }

  summary(): string {
    const s = this.getState();
    const c = this.config;
    return `Steps: ${s.steps}/${c.maxSteps} | Tools: ${s.toolCalls}/${c.maxToolCalls} | Time: ${Math.round(s.elapsedMs / 1000)}s/${Math.round(c.maxElapsedMs / 1000)}s | Tokens: ${s.totalTokens}/${c.maxTotalTokens} | Failures: ${s.consecutiveFailures}/${c.maxConsecutiveFailures}`;
  }
}
