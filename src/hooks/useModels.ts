import { useState, useEffect, useCallback } from "react";
import { OpenAIClient } from "../services/openai/openaiClient";
import { useAppStore } from "../app/store";

export const useModels = () => {
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const { settings } = useAppStore();

  const fetchModels = useCallback(async () => {
    if (!settings.apiUrl || !settings.apiKey) return;
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const client = new OpenAIClient({
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
      });
      const list = await client.fetchModels();
      setModels(["auto", ...list]);
    } catch (e) {
      setModelsError(e instanceof Error ? e.message : "Failed to fetch models");
    } finally {
      setIsLoadingModels(false);
    }
  }, [settings.apiUrl, settings.apiKey]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, isLoadingModels, modelsError, refetchModels: fetchModels };
};
