const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-3.6-flash";
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const ATTEMPTS_PER_MODEL = 2;

type CallOptions = {
  system: string;
  prompt: string;
  maxTokens?: number;
  timeoutMs?: number;
  json?: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class AIError extends Error {
  constructor(
    message: string,
    public retryable: boolean
  ) {
    super(message);
  }
}

async function requestOnce(
  model: string,
  apiKey: string,
  options: CallOptions
): Promise<string> {
  const { system, prompt, maxTokens = 8192, timeoutMs = 45_000, json = true } =
    options;

  const res = await fetch(`${BASE_URL}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        ...(json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`AI API error (${model}):`, res.status, detail);

    if (res.status === 400 && detail.includes("API_KEY_INVALID")) {
      throw new AIError("The API key is invalid.", false);
    }
    if (res.status === 403) {
      throw new AIError("The API key was refused. Create a new key in AI Studio.", false);
    }
    if (res.status === 404) {
      throw new AIError("The AI model was not found. Check GEMINI_MODEL in .env.", true);
    }
    throw new AIError(
      res.status === 429
        ? "Free limit reached. Wait a minute and try again."
        : `The AI service is busy right now (${res.status}). Please try again.`,
      RETRYABLE.has(res.status)
    );
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");

  if (!text) throw new AIError("The AI service returned an empty response.", true);
  return text;
}

export async function callAI(options: CallOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in .env");
  }

  const primary = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const fallback = process.env.GEMINI_FALLBACK_MODEL ?? FALLBACK_MODEL;
  const models = primary === fallback ? [primary] : [primary, fallback];

  let lastError: Error = new Error("The AI request failed.");

  for (const model of models) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        return await requestOnce(model, apiKey, options);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        const retryable = err instanceof AIError ? err.retryable : true;
        if (!retryable) throw lastError;

        if (attempt < ATTEMPTS_PER_MODEL) {
          await sleep(2000 * attempt);
        }
      }
    }
  }

  throw lastError;
}

export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("The AI response did not contain JSON.");
  }
  return JSON.parse(text.slice(start, end + 1));
}