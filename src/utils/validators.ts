/**
 * Input validation utilities
 * Validates user input and API parameters
 */

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate API key format
 */
export const validateApiKey = (apiKey: string): ValidationResult => {
  if (!apiKey || typeof apiKey !== "string") {
    return { isValid: false, error: "API key is required" };
  }

  if (apiKey.trim().length === 0) {
    return { isValid: false, error: "API key cannot be empty" };
  }

  if (apiKey.length < 10) {
    return { isValid: false, error: "API key appears to be invalid" };
  }

  return { isValid: true };
};

/**
 * Validate API URL format
 */
export const validateApiUrl = (url: string): ValidationResult => {
  if (!url || typeof url !== "string") {
    return { isValid: false, error: "API URL is required" };
  }

  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith("http")) {
      return { isValid: false, error: "API URL must use HTTP or HTTPS" };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid API URL format" };
  }
};

/**
 * Validate message content
 */
export const validateMessageContent = (content: string): ValidationResult => {
  if (!content || typeof content !== "string") {
    return { isValid: false, error: "Message is required" };
  }

  if (content.trim().length === 0) {
    return { isValid: false, error: "Message cannot be empty" };
  }

  if (content.length > 32000) {
    return {
      isValid: false,
      error: "Message is too long (max 32000 characters)",
    };
  }

  return { isValid: true };
};

/**
 * Validate system prompt
 */
export const validateSystemPrompt = (prompt: string): ValidationResult => {
  if (typeof prompt !== "string") {
    return { isValid: false, error: "System prompt must be a string" };
  }

  if (prompt.length > 32000) {
    return {
      isValid: false,
      error: "System prompt is too long (max 32000 characters)",
    };
  }

  return { isValid: true };
};

/**
 * Validate temperature parameter
 */
export const validateTemperature = (value: number): ValidationResult => {
  if (typeof value !== "number") {
    return { isValid: false, error: "Temperature must be a number" };
  }

  if (value < 0 || value > 2) {
    return { isValid: false, error: "Temperature must be between 0 and 2" };
  }

  return { isValid: true };
};

/**
 * Validate maxTokens parameter
 */
export const validateMaxTokens = (value: number): ValidationResult => {
  if (typeof value !== "number") {
    return { isValid: false, error: "Max tokens must be a number" };
  }

  if (value < 1 || value > 128000) {
    return { isValid: false, error: "Max tokens must be between 1 and 128000" };
  }

  return { isValid: true };
};

/**
 * Validate topP parameter
 */
export const validateTopP = (value: number): ValidationResult => {
  if (typeof value !== "number") {
    return { isValid: false, error: "Top P must be a number" };
  }

  if (value < 0 || value > 1) {
    return { isValid: false, error: "Top P must be between 0 and 1" };
  }

  return { isValid: true };
};

/**
 * Validate frequency penalty parameter
 */
export const validateFrequencyPenalty = (value: number): ValidationResult => {
  if (typeof value !== "number") {
    return { isValid: false, error: "Frequency penalty must be a number" };
  }

  if (value < -2 || value > 2) {
    return {
      isValid: false,
      error: "Frequency penalty must be between -2 and 2",
    };
  }

  return { isValid: true };
};

/**
 * Validate presence penalty parameter
 */
export const validatePresencePenalty = (value: number): ValidationResult => {
  if (typeof value !== "number") {
    return { isValid: false, error: "Presence penalty must be a number" };
  }

  if (value < -2 || value > 2) {
    return {
      isValid: false,
      error: "Presence penalty must be between -2 and 2",
    };
  }

  return { isValid: true };
};

/**
 * Validate conversation title
 */
export const validateConversationTitle = (title: string): ValidationResult => {
  if (!title || typeof title !== "string") {
    return { isValid: false, error: "Title is required" };
  }

  if (title.trim().length === 0) {
    return { isValid: false, error: "Title cannot be empty" };
  }

  if (title.length > 200) {
    return { isValid: false, error: "Title is too long (max 200 characters)" };
  }

  return { isValid: true };
};

/**
 * Validate model selection
 */
export const validateModel = (
  model: string,
  availableModels: string[],
): ValidationResult => {
  if (!model || typeof model !== "string") {
    return { isValid: false, error: "Model is required" };
  }

  if (!availableModels.includes(model)) {
    return { isValid: false, error: "Invalid model selection" };
  }

  return { isValid: true };
};

/**
 * Validate all API parameters at once
 */
export const validateApiParameters = (params: {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}): ValidationResult => {
  if (params.temperature !== undefined) {
    const result = validateTemperature(params.temperature);
    if (!result.isValid) return result;
  }

  if (params.maxTokens !== undefined) {
    const result = validateMaxTokens(params.maxTokens);
    if (!result.isValid) return result;
  }

  if (params.topP !== undefined) {
    const result = validateTopP(params.topP);
    if (!result.isValid) return result;
  }

  if (params.frequencyPenalty !== undefined) {
    const result = validateFrequencyPenalty(params.frequencyPenalty);
    if (!result.isValid) return result;
  }

  if (params.presencePenalty !== undefined) {
    const result = validatePresencePenalty(params.presencePenalty);
    if (!result.isValid) return result;
  }

  return { isValid: true };
};
