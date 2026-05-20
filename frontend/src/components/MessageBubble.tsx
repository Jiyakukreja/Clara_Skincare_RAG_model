"use client";

import type { Message, SkinProfile } from "@/types";

import { ProductCard } from "@/components/ProductCard";
import { RoutineCard } from "@/components/RoutineCard";

type Props = {
  message: Message;
  profile: SkinProfile;
};

export function MessageBubble({ message, profile }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-[message-rise_250ms_ease_both]">
        <div className="max-w-[75%] rounded-[8px] bg-[var(--purple)] px-4 py-3 text-[14px] leading-[1.7] text-white shadow-[0_10px_24px_rgba(140,48,245,0.2)]">
          {message.content}
        </div>
      </div>
    );
  }

  const response = message.response;
  const showDetails = response?.show_details ?? Boolean(
    response?.products?.length ||
      response?.morning_routine?.length ||
      response?.night_routine?.length,
  );

  return (
    <div className="flex justify-start animate-[message-rise_250ms_ease_both]">
      <div className="max-w-[100%] rounded-[8px] border border-[var(--border)] bg-white px-4 py-4 text-[14px] leading-[1.7] text-[var(--text-dark)] shadow-[0_10px_24px_rgba(26,26,46,0.05)] lg:px-5 lg:py-5">
        {response?.ai_source ? (
          <div className="mb-3 inline-flex rounded-full bg-[var(--purple-light)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6b21c8]">
            Live Gemini{response.model_used ? ` · ${response.model_used}` : ""}
          </div>
        ) : null}

        <p className="mb-4 text-[14px] leading-[1.7] text-[var(--text-dark)]">
          {message.content}
        </p>

        {showDetails ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <Pill>{profile.skinType}</Pill>
            <Pill>{profile.mainConcern}</Pill>
            {profile.currentActives.map((item) => <Pill key={item}>{item}</Pill>)}
            <Pill>{profile.ageStage}</Pill>
            {profile.lifestyle.slice(0, 4).map((item) => <Pill key={item}>{item}</Pill>)}
          </div>
        ) : null}

        {showDetails && response?.safety_warnings?.length ? (
          <div className="mb-4 rounded-[8px] border border-[var(--border)] border-l-[3px] border-l-[var(--purple)] bg-[#fdf6ff] p-[14px_16px]">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--purple)]">Safety Notes</div>
            <p className="text-[13px] leading-[1.7] text-[var(--text-dark)]">⚠ {response.safety_warnings.join(" ")}</p>
          </div>
        ) : null}

        {showDetails && (response?.morning_routine?.length || response?.night_routine?.length) ? (
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <RoutineCard title="Morning" icon="sun" tone="mint" steps={response?.morning_routine ?? []} />
            <RoutineCard title="Night" icon="moon" tone="lavender" steps={response?.night_routine ?? []} />
          </div>
        ) : null}

        {showDetails && response?.products?.length ? (
          <div className="mb-4">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--purple)]">Recommended Products</div>
            <div className="grid gap-3 md:grid-cols-2">
              {response.products.map((product) => (
                <ProductCard key={`${product.name}-${product.brand}`} product={product} />
              ))}
            </div>
          </div>
        ) : null}

        {showDetails && response?.lifestyle_tip ? (
          <div className="border-l-2 border-[var(--purple)] pl-3 text-[13px] italic leading-[1.7] text-[var(--text-dark)]">
            {response.lifestyle_tip}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[var(--purple-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6b21c8]">
      {children}
    </span>
  );
}
