import type { TaskType, ModelCapability, RoutingRule } from "../../types/routing";

const CODE_KEYWORDS = /function|debug|syntax|import|script\b|code\b|\bclass\b|error|exception|compile|undefined|null pointer/i;
const REASONING_KEYWORDS = /analyze|analysis|architecture|compare|tradeoff|design|evaluate|explain why|pros and cons|strategy|difference between/i;

const VISION_PATTERNS = [
  /gpt-4o/i,
  /gpt-4.*turbo/i,
  /gpt-4.*vision/i,
  /llava/i,
  /moondream/i,
  /qwen.*vl/i,
  /minicpm-v/i,
];

const CODE_PATTERNS = [/coder/i, /starcoder/i, /deepseek-cod/i, /codellama/i, /code.*llm/i];
const REASONING_PATTERNS = [/70b/i, /72b/i, /opus/i, /gpt-4/i, /claude-3/i, /mixtral/i];

export function classifyTask(message: string, hasAttachment: boolean): TaskType {
  if (hasAttachment) return "vision";
  if (CODE_KEYWORDS.test(message)) return "code";
  if (REASONING_KEYWORDS.test(message)) return "reasoning";
  return "general";
}

export function inferCapabilities(modelId: string): ModelCapability {
  return {
    modelId,
    supportsVision: VISION_PATTERNS.some((p) => p.test(modelId)),
    supportsCode: CODE_PATTERNS.some((p) => p.test(modelId)),
    supportsReasoning: REASONING_PATTERNS.some((p) => p.test(modelId)),
  };
}

export function selectModel(
  taskType: TaskType,
  models: string[],
  message?: string,
  userRules?: RoutingRule[],
): string {
  const realModels = models.filter((m) => m !== "auto");
  if (realModels.length === 0) return models[0] ?? "";

  // User-defined keyword rules take priority
  if (message && userRules && userRules.length > 0) {
    for (const rule of userRules) {
      if (!rule.keyword || !rule.model) continue;
      try {
        if (new RegExp(rule.keyword, "i").test(message)) {
          const found = realModels.find((m) => m === rule.model);
          if (found) return found;
        }
      } catch {
        // invalid regex — skip rule
      }
    }
  }

  // Default capability-based routing
  const capabilityKey: Record<TaskType, keyof ModelCapability> = {
    vision: "supportsVision",
    code: "supportsCode",
    reasoning: "supportsReasoning",
    general: "supportsVision", // won't match, falls back to first model
  };

  if (taskType !== "general") {
    const key = capabilityKey[taskType];
    const match = realModels.find((m) => inferCapabilities(m)[key]);
    if (match) return match;
  }

  return realModels[0];
}
