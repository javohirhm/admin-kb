import { NextRequest, NextResponse } from "next/server";
import type { LanguageKey } from "@/types";

const MODEL = "gemini-2.5-flash";

const LANGUAGE_LABELS: Record<LanguageKey, string> = {
  uz_latin: "Uzbek (Latin)",
  uz_cyrillic: "Uzbek (Cyrillic)",
  ru: "Russian",
  en: "English",
};

interface TranslateRequestBody {
  sourceLanguage: LanguageKey;
  targets: LanguageKey[];
  title: string;
  content: string;
}

interface GeminiResponse {
  candidates?: Array<{
    finishReason?: string;
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

function extractJsonCandidate(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

async function callGemini(apiKey: string, prompt: string): Promise<GeminiResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        systemInstruction: {
          parts: [
            {
              text: "Return JSON only. Do not wrap output in markdown or code fences.",
            },
          ],
        },
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        ],
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Gemini request failed");
  }

  return response.json();
}

function readCandidateText(data: GeminiResponse): { text: string; reason: string | null } {
  const candidate = data?.candidates?.[0];
  const text =
    candidate?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";
  const reason =
    candidate?.finishReason || data?.promptFeedback?.blockReason || null;
  return { text, reason };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY" },
      { status: 500 }
    );
  }

  let body: TranslateRequestBody;
  try {
    body = (await request.json()) as TranslateRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sourceLanguage, targets, title, content } = body;

  if (!sourceLanguage || !(sourceLanguage in LANGUAGE_LABELS)) {
    return NextResponse.json({ error: "Invalid source language" }, { status: 400 });
  }

  if (!Array.isArray(targets) || targets.length === 0) {
    return NextResponse.json({ error: "Targets are required" }, { status: 400 });
  }

  const uniqueTargets = Array.from(new Set(targets)).filter(
    (target) => target !== sourceLanguage && target in LANGUAGE_LABELS
  ) as LanguageKey[];

  if (uniqueTargets.length === 0) {
    return NextResponse.json(
      { error: "No valid target languages" },
      { status: 400 }
    );
  }

  const promptPayload = {
    sourceLanguage,
    sourceLanguageName: LANGUAGE_LABELS[sourceLanguage],
    targets: uniqueTargets.map((lang) => ({
      key: lang,
      name: LANGUAGE_LABELS[lang],
    })),
    title,
    content,
  };

  const prompt = `You are a translation engine. Translate the article title and markdown content from ${LANGUAGE_LABELS[sourceLanguage]} into each target language. Preserve markdown formatting, punctuation, links, code, and proper nouns. Do not add commentary. Output JSON only with the exact schema and do not wrap it in markdown or code fences:\n\n{\n  "translations": {\n    "<language_key>": {\n      "title": "...",\n      "content": "..."\n    }\n  }\n}\n\nLanguage keys must match the provided targets. Input:\n${JSON.stringify(
    promptPayload
  )}`;

  let data: GeminiResponse;
  try {
    data = await callGemini(apiKey, prompt);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Translation request failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }

  let { text, reason } = readCandidateText(data);

  if (!text) {
    return NextResponse.json(
      { error: "Translation response was empty", detail: reason || "No content returned" },
      { status: 502 }
    );
  }

  let parsed: unknown;
  let candidateJson = extractJsonCandidate(text);
  if (!candidateJson) {
    const repairPrompt = `Extract translations from the text below and output JSON only with the exact schema:\n\n{\n  "translations": {\n    "<language_key>": {\n      "title": "...",\n      "content": "..."\n    }\n  }\n}\n\nTargets: ${uniqueTargets.join(", ")}\n\nText:\n${text}`;
    try {
      const repairData = await callGemini(apiKey, repairPrompt);
      const repairText = readCandidateText(repairData).text;
      candidateJson = extractJsonCandidate(repairText);
    } catch {
      // ignore and fall through to error below
    }
  }

  if (!candidateJson) {
    return NextResponse.json(
      {
        error: "Failed to locate JSON in translation response",
        detail: {
          finishReason: reason,
          snippet: text.slice(0, 800),
        },
      },
      { status: 502 }
    );
  }

  try {
    parsed = JSON.parse(candidateJson);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse translation response" },
      { status: 502 }
    );
  }

  const translationsRaw =
    typeof parsed === "object" && parsed && "translations" in parsed
      ? (parsed as { translations: Record<string, unknown> }).translations
      : parsed;

  if (!translationsRaw || typeof translationsRaw !== "object") {
    return NextResponse.json(
      { error: "Invalid translation payload" },
      { status: 502 }
    );
  }

  const translations: Partial<Record<LanguageKey, { title: string; content: string }>> =
    {};

  for (const lang of uniqueTargets) {
    const entry = (translationsRaw as Record<string, { title?: unknown; content?: unknown }>)[
      lang
    ];
    translations[lang] = {
      title: typeof entry?.title === "string" ? entry.title : "",
      content: typeof entry?.content === "string" ? entry.content : "",
    };
  }

  return NextResponse.json({ translations });
}
