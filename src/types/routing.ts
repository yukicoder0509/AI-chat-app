export type TaskType = "vision" | "code" | "reasoning" | "general";

export interface RoutingDecision {
  taskType: TaskType;
  selectedModel: string;
  wasOverridden: boolean;
  overriddenModel?: string;
}

export interface ModelCapability {
  modelId: string;
  supportsVision: boolean;
  supportsCode: boolean;
  supportsReasoning: boolean;
}

export interface RoutingRule {
  keyword: string;
  model: string;
}

export interface RoutingConfig {
  rules: RoutingRule[];
}
