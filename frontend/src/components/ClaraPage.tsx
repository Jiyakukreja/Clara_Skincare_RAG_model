"use client";

import { useMemo, useState } from "react";

import { ChatPanel } from "@/components/ChatPanel";
import { SkinProfileSelector } from "@/components/SkinProfileSelector";
import type { SkinProfile } from "@/types";

export function ClaraPage() {
  const [selectedProfile, setSelectedProfile] = useState<SkinProfile | null>(null);
  const [mobileView, setMobileView] = useState<"profile" | "chat">("profile");

  const hasProfile = useMemo(() => Boolean(selectedProfile?.skinType && selectedProfile?.mainConcern), [selectedProfile]);

  function handleStart(profile: SkinProfile) {
    setSelectedProfile(profile);
    setMobileView("chat");
  }

  return (
    <main className="min-h-screen bg-white px-4 py-4 text-[var(--text-dark)] sm:px-6 lg:px-8 lg:py-6">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.94fr_1.06fr] lg:gap-6">
        <section className={`${mobileView === "chat" ? "hidden lg:flex" : "flex"} flex-col rounded-[28px] bg-[var(--mint)] p-6 shadow-[0_18px_45px_rgba(26,26,46,0.05)] lg:p-8`}>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--purple-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--purple)]">
              <span>✦</span>
              AI Skincare Assistant
            </div>
            <h1 className="mt-6 max-w-xl text-[52px] font-black not-italic leading-[0.95] tracking-[-0.04em] text-[var(--text-dark)]">
              Skin that's finally understood.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] font-light leading-[1.7] tracking-[0.02em] text-[var(--text-mid)]">
              Select your profile below and let Clara build a routine made for your actual life.
            </p>
          </div>

          <SkinProfileSelector onStart={handleStart} />
        </section>

        <section className={`${mobileView === "profile" ? "hidden lg:flex" : "flex"} min-h-[680px] flex-col rounded-[28px] bg-[var(--lavender)] shadow-[0_18px_45px_rgba(26,26,46,0.05)]`}>
          <ChatPanel profile={selectedProfile} hasProfile={hasProfile} onBack={() => setMobileView("profile")} />
        </section>
      </section>
    </main>
  );
}
