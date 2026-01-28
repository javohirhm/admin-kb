import type { LanguageKey } from "@/types";

export interface TranslationRequest {
  sourceLanguage: LanguageKey;
  targets: LanguageKey[];
  title: string;
  content: string;
}

export type TranslationMap = Partial<
  Record<LanguageKey, { title: string; content: string }>
>;

export interface TranslationResponse {
  translations: TranslationMap;
}

export async function translateArticle(
  payload: TranslationRequest
): Promise<TranslationResponse> {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.error || data?.detail || JSON.stringify(data);
    } catch {
      detail = await response.text();
    }
    throw new Error(detail || "Translation request failed");
  }

  return response.json();
}
