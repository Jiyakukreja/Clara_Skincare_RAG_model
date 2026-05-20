"use client";

import { Moon, Sun } from "lucide-react";

type Props = {
  title: string;
  icon: "sun" | "moon";
  tone: "mint" | "lavender";
  steps: string[];
};

export function RoutineCard({ title, icon, tone, steps }: Props) {
  const Icon = icon === "sun" ? Sun : Moon;

  return (
    <div
      className="rounded-[8px] border border-[var(--border)] p-4"
      style={{ background: tone === "mint" ? "var(--mint)" : "var(--lavender)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className="text-[var(--purple)]" />
        <span className="brand-name text-[14px] italic font-normal text-[var(--text-dark)]">{title}</span>
      </div>
      <ol className="space-y-1 text-[13px] leading-[1.7] text-[var(--text-dark)]">
        {steps.map((step, index) => (
          <li key={step}>
            {index + 1}. {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
