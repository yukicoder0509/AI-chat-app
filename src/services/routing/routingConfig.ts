import type { RoutingConfig } from "../../types/routing";

const STORAGE_KEY = "ai-chatroom-routing-config";
const DEFAULT_CONFIG: RoutingConfig = { rules: [] };

export function loadRoutingConfig(): RoutingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return JSON.parse(raw) as RoutingConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveRoutingConfig(config: RoutingConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
