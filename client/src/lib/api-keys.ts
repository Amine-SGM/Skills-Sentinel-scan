const GEMINI_KEY = "skillguard-gemini-key";
const OPENROUTER_KEY = "skillguard-openrouter-key";

export function getGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY) || "";
}

export function getOpenRouterKey(): string {
  return localStorage.getItem(OPENROUTER_KEY) || "";
}

export function setGeminiKey(key: string) {
  localStorage.setItem(GEMINI_KEY, key);
}

export function setOpenRouterKey(key: string) {
  localStorage.setItem(OPENROUTER_KEY, key);
}

export function hasApiKeys(): boolean {
  return getGeminiKey().length > 0 && getOpenRouterKey().length > 0;
}
