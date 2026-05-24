import type { ChatResponse, SkinProfile } from "@/types";

const BACKEND_CHAT_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "/api/chat";
const HEALTH_URL = "/api/health";
const REQUEST_TIMEOUT_MS = 120_000;

const OFFLINE_MESSAGE =
  "Clara cannot reach the AI backend. Start FastAPI on port 8000 and set GEMINI_API_KEY in backend/.env.";

function toBackendSkinProfile(skinProfile: SkinProfile) {
  return {
    skin_type: skinProfile.skinType,
    main_concern: skinProfile.mainConcern,
    current_actives: skinProfile.currentActives,
    age_stage: skinProfile.ageStage,
    lifestyle: skinProfile.lifestyle,
  };
}

function isHtmlPayload(text: string) {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

function errorMessageForStatus(status: number, detail: string) {
  if (detail) return detail;

  if (status === 503) {
    return "Clara is not fully configured for this deployment. Set BACKEND_URL to your FastAPI /chat endpoint.";
  }

  if (status === 502 || status === 504) {
    return OFFLINE_MESSAGE;
  }

  return "Clara could not complete that request. Please try again.";
}

async function parseJsonBody(text: string): Promise<Record<string, unknown>> {
  if (!text.trim()) return {};

  if (isHtmlPayload(text)) {
    throw new Error(OFFLINE_MESSAGE);
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("Clara received an invalid response. Please try again.");
  }
}

export async function checkBackendHealth(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const response = await fetch(HEALTH_URL, { cache: "no-store" });
    const payload = await parseJsonBody(await response.text());
    const ok = response.ok && payload.ok === true;

    return {
      ok,
      detail: typeof payload.detail === "string" ? payload.detail : ok ? undefined : OFFLINE_MESSAGE,
    };
  } catch {
    return { ok: false, detail: OFFLINE_MESSAGE };
  }
}

export async function sendChatMessage(
  message: string,
  skinProfile: SkinProfile,
  includeRecommendations = true,
): Promise<ChatResponse> {
  const health = await checkBackendHealth();
  if (!health.ok) {
    throw new Error(health.detail ?? OFFLINE_MESSAGE);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(BACKEND_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        message,
        skin_profile: toBackendSkinProfile(skinProfile),
        include_recommendations: includeRecommendations,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Clara is taking too long to respond. Please try again in a moment.");
    }

    throw new Error(OFFLINE_MESSAGE);
  } finally {
    window.clearTimeout(timeout);
  }

  const text = await response.text();
  const payload = await parseJsonBody(text);

  if (!response.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : "";
    throw new Error(errorMessageForStatus(response.status, detail));
  }

  return payload as unknown as ChatResponse;
}
