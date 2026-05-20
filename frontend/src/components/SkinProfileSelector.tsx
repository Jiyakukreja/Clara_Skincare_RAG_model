"use client";

import { useMemo, useState } from "react";

import type { SkinProfile } from "@/types";

type Props = {
  onStart: (profile: SkinProfile) => void;
};

const skinTypes = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];
const concerns = ["Acne", "Pigmentation", "Anti-aging", "Dryness", "Dullness", "Dark circles", "Redness", "Large pores"];
const actives = ["Retinol", "Niacinamide", "Vitamin C", "AHA/BHA", "Benzoyl peroxide", "Hyaluronic acid", "None"];
const ages = ["Under 18", "18–24", "25–32", "33–40", "40+", "Pregnant", "Postpartum"];
const lifestyleOptions = [
  "Outdoor work",
  "Office/AC",
  "High stress",
  "Gym 4x+ /week",
  "Heavy makeup daily",
  "Poor sleep",
  "Low water intake",
  "Vegetarian/Vegan",
];

export function SkinProfileSelector({ onStart }: Props) {
  const [skinType, setSkinType] = useState("");
  const [mainConcern, setMainConcern] = useState("");
  const [currentActives, setCurrentActives] = useState<string[]>([]);
  const [ageStage, setAgeStage] = useState("");
  const [lifestyle, setLifestyle] = useState<string[]>([]);

  const canStart = Boolean(skinType && mainConcern);

  const profile = useMemo<SkinProfile>(
    () => ({ skinType, mainConcern, currentActives, ageStage, lifestyle }),
    [skinType, mainConcern, currentActives, ageStage, lifestyle],
  );

  function toggleMulti(value: string, items: string[], setItems: (value: string[]) => void) {
    setItems(items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);
  }

  function Pill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-full border px-4 py-[7px] text-[13px] transition-all duration-150 ease-out"
        style={{
          background: selected ? "var(--purple)" : "var(--white)",
          borderColor: selected ? "var(--purple)" : "var(--border)",
          color: selected ? "var(--white)" : "var(--text-dark)",
          fontWeight: selected ? 700 : 400,
          transform: selected ? "scale(1.03)" : "scale(1)",
          boxShadow: selected ? "0 10px 24px rgba(140, 48, 245, 0.18)" : "none",
        }}
        onMouseEnter={(event) => {
          if (!selected) {
            event.currentTarget.style.background = "var(--purple-light)";
            event.currentTarget.style.borderColor = "var(--purple-mid)";
            event.currentTarget.style.color = "var(--purple)";
          }
        }}
        onMouseLeave={(event) => {
          if (!selected) {
            event.currentTarget.style.background = "var(--white)";
            event.currentTarget.style.borderColor = "var(--border)";
            event.currentTarget.style.color = "var(--text-dark)";
          }
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <Section label="Skin Type">
        {skinTypes.map((option) => (
          <Pill key={option} label={option} selected={skinType === option} onClick={() => setSkinType(option)} />
        ))}
      </Section>

      <Section label="Main Concern">
        {concerns.map((option) => (
          <Pill key={option} label={option} selected={mainConcern === option} onClick={() => setMainConcern(option)} />
        ))}
      </Section>

      <Section label="Current Actives">
        {actives.map((option) => (
          <Pill key={option} label={option} selected={currentActives.includes(option)} onClick={() => toggleMulti(option, currentActives, setCurrentActives)} />
        ))}
      </Section>

      <Section label="Age & Life Stage">
        {ages.map((option) => (
          <Pill key={option} label={option} selected={ageStage === option} onClick={() => setAgeStage(option)} />
        ))}
      </Section>

      <Section label="Lifestyle">
        {lifestyleOptions.map((option) => (
          <Pill key={option} label={option} selected={lifestyle.includes(option)} onClick={() => toggleMulti(option, lifestyle, setLifestyle)} />
        ))}
      </Section>

      <button
        type="button"
        disabled={!canStart}
        onClick={() => onStart(profile)}
        className="w-full rounded-[8px] px-8 py-[14px] text-[14px] font-bold text-white transition-all duration-150 ease-out"
        style={{
          background: canStart ? "var(--purple)" : "rgba(140, 48, 245, 0.45)",
          boxShadow: canStart ? "0 14px 28px rgba(140, 48, 245, 0.2)" : "none",
          cursor: canStart ? "pointer" : "not-allowed",
        }}
        onMouseEnter={(event) => {
          if (canStart) {
            event.currentTarget.style.background = "var(--purple-hover)";
            event.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(event) => {
          if (canStart) {
            event.currentTarget.style.background = "var(--purple)";
            event.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        Ask Clara →
      </button>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--purple)]">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}
