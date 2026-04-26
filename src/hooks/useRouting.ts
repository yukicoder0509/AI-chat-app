import { classifyTask, selectModel } from "../services/routing/taskRouter";
import { loadRoutingConfig } from "../services/routing/routingConfig";
import type { RoutingDecision } from "../types/routing";

export interface UseRoutingReturn {
  resolveModel: (
    message: string,
    hasAttachment: boolean,
    availableModels: string[],
  ) => { modelId: string; decision: RoutingDecision };
}

export const useRouting = (): UseRoutingReturn => {
  const resolveModel = (
    message: string,
    hasAttachment: boolean,
    availableModels: string[],
  ): { modelId: string; decision: RoutingDecision } => {
    const taskType = classifyTask(message, hasAttachment);
    const { rules } = loadRoutingConfig();
    const modelId = selectModel(taskType, availableModels, message, rules);

    return {
      modelId,
      decision: {
        taskType,
        selectedModel: modelId,
        wasOverridden: false,
      },
    };
  };

  return { resolveModel };
};
