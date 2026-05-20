import type { ChatResponse, SkinProfile } from "@/types";

const BACKEND_CHAT_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "/api/chat";
const REQUEST_TIMEOUT_MS = 120_000;

function toBackendSkinProfile(skinProfile: SkinProfile) {
  return {
    skin_type: skinProfile.skinType,
    main_concern: skinProfile.mainConcern,
    current_actives: skinProfile.currentActives,
    age_stage: skinProfile.ageStage,
    lifestyle: skinProfile.lifestyle,
  };
}

export async function sendChatMessage(
  message: string,
  skinProfile: SkinProfile,
  includeRecommendations = true,
): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(BACKEND_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

    throw new Error("Could not reach the AI backend. Please check the backend deployment and try again.");
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    let detail = "";
    try {
      const payload = JSON.parse(errorText) as { detail?: string };
      detail = payload.detail ?? "";
    } catch {
      detail = "";
    }

    throw new Error(detail || errorText || "AI response failed.");
  }

  return (await response.json()) as ChatResponse;
}
