/**
 * Default API parameters and configuration values
 */

// Parameter range configurations
export const TEMPERATURE = {
  default: 0.7,
  min: 0,
  max: 2,
  step: 0.1,
  label: "Temperature",
  description:
    "Controls randomness. Higher values (closer to 2) make output more random, while lower values (closer to 0) make output more focused.",
};

export const MAX_TOKENS = {
  default: 2000,
  min: 1,
  max: 4000,
  step: 100,
  label: "Max Tokens",
  description: "Maximum number of tokens in the response.",
};

export const TOP_P = {
  default: 1,
  min: 0,
  max: 1,
  step: 0.05,
  label: "Top P",
  description:
    "Controls diversity via nucleus sampling. Values closer to 1 are more diverse, values closer to 0 are more focused.",
};

export const FREQUENCY_PENALTY = {
  default: 0,
  min: -2,
  max: 2,
  step: 0.1,
  label: "Frequency Penalty",
  description:
    "Reduces the model's likelihood to repeat the same line verbatim. Range: -2.0 to 2.0.",
};

export const PRESENCE_PENALTY = {
  default: 0,
  min: -2,
  max: 2,
  step: 0.1,
  label: "Presence Penalty",
  description:
    "Increases the model's likelihood to talk about new topics. Range: -2.0 to 2.0.",
};

export const API_DEFAULTS = {
  temperature: TEMPERATURE,
  maxTokens: MAX_TOKENS,
  topP: TOP_P,
  frequencyPenalty: FREQUENCY_PENALTY,
  presencePenalty: PRESENCE_PENALTY,
};

export const SYSTEM_PROMPT_TEMPLATES = {
  default:
    "You are a helpful, harmless, and honest assistant. Help the user with their questions.",
  developer:
    "You are an expert software developer. Help the user with coding questions and provide clean, well-documented code examples.",
  teacher:
    "You are a patient and knowledgeable teacher. Explain concepts clearly and provide helpful examples.",
  creative:
    "You are a creative writing assistant. Help the user brainstorm ideas and improve their creative writing.",
  analyst:
    "You are a data analyst. Help the user understand data, create visualizations, and draw insights.",
};

export const CONVERSATION_DEFAULTS = {
  maxMessagesPerConversation: 100,
  maxConversations: 10,
  autoSaveIntervalMs: 5000,
  messageIdPrefix: "msg-",
  conversationIdPrefix: "conv-",
};

export const ERROR_MESSAGES = {
  API_KEY_MISSING: "API key is not configured. Please set it in settings.",
  API_KEY_INVALID:
    "The API key appears to be invalid. Please check and try again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  API_ERROR: "API error. Please try again later.",
  INVALID_RESPONSE: "Received invalid response from API. Please try again.",
  STREAM_ERROR: "Error during streaming response. Please try again.",
  STORAGE_ERROR:
    "Error saving to local storage. Your data may not be persisted.",
  SESSION_ERROR: "Session error. Please refresh the page.",
};

export const SUCCESS_MESSAGES = {
  CONVERSATION_SAVED: "Conversation saved successfully.",
  CONVERSATION_EXPORTED: "Conversation exported successfully.",
  SETTINGS_SAVED: "Settings saved successfully.",
};
