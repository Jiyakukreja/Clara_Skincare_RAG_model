import type { ChatResponse, SkinProfile } from "@/types";

function toBackendSkinProfile(skinProfile: SkinProfile) {
  return {
    skin_type: skinProfile.skinType,
    main_concern: skinProfile.mainConcern,
    current_actives: skinProfile.currentActives,
    age_stage: skinProfile.ageStage,
    lifestyle: skinProfile.lifestyle,
  };
}

export async function sendChatMessage(message: string, skinProfile: SkinProfile): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, skin_profile: toBackendSkinProfile(skinProfile) }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI response failed.");
  }

  return (await response.json()) as ChatResponse;
}
