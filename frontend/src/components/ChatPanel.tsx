"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";

import { sendChatMessage } from "@/lib/api";
import { createMessageId } from "@/lib/id";
import type { Message, SkinProfile } from "@/types";

import { MessageBubble } from "@/components/MessageBubble";

type Props = {
  profile: SkinProfile | null;
  hasProfile: boolean;
  backendOnline: boolean;
  backendDetail?: string;
  onBack: () => void;
};

const OFFLINE_REPLY =
  "Clara is ready, but the AI backend is offline. Start FastAPI on port 8000 and add GEMINI_API_KEY to backend/.env, then try again.";

export function ChatPanel({ profile, hasProfile, backendOnline, backendDetail, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bootstrappedProfileKeyRef = useRef("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return "Clara could not respond right now. Please try again.";
  }

  function appendAssistantMessage(content: string) {
    setMessages((current) => [...current, { id: createMessageId(), role: "assistant", content }]);
  }

  const prompt = useMemo(() => {
    if (!profile) return "";

    return [
      `I have ${profile.skinType.toLowerCase()} skin, my main concern is ${profile.mainConcern.toLowerCase()}.`,
      profile.currentActives.length ? `I currently use ${profile.currentActives.join(", ")}.` : "I am not currently using active ingredients.",
      `I am ${profile.ageStage} years old.`,
      profile.lifestyle.length ? `My lifestyle: ${profile.lifestyle.join(", ")}.` : "My lifestyle details are limited.",
      "Please give me a complete skincare routine.",
    ].join(" ");
  }, [profile]);

  const profileKey = useMemo(() => (profile ? JSON.stringify(profile) : ""), [profile]);

  function shouldIncludeRecommendations(text: string) {
    const normalized = text.toLowerCase();
    const recommendationWords = [
      "routine",
      "product",
      "recommend",
      "suggest",
      "cleanser",
      "moisturizer",
      "sunscreen",
      "serum",
      "treatment",
      "acne",
      "pigmentation",
    ];
    const dietOnlyWords = ["diet", "food", "eat", "nutrition", "water"];

    if (dietOnlyWords.some((word) => normalized.includes(word))) {
      return recommendationWords.some((word) => normalized.includes(word) && !["acne", "pigmentation"].includes(word));
    }

    return recommendationWords.some((word) => normalized.includes(word));
  }

  useEffect(() => {
    if (!profile || !profileKey || bootstrappedProfileKeyRef.current === profileKey) return;
    const activeProfile = profile;

    async function launchConversation() {
      bootstrappedProfileKeyRef.current = profileKey;
      setIsTyping(true);
      const userMessage: Message = { id: createMessageId(), role: "user", content: prompt };
      setMessages([userMessage]);

      if (!backendOnline) {
        setMessages([
          userMessage,
          { id: createMessageId(), role: "assistant", content: backendDetail || OFFLINE_REPLY },
        ]);
        setIsTyping(false);
        return;
      }

      try {
        const response = await sendChatMessage(prompt, activeProfile, true);
        setMessages([
          userMessage,
          { id: createMessageId(), role: "assistant", content: response.answer, response },
        ]);
      } catch (error) {
        setMessages([
          userMessage,
          { id: createMessageId(), role: "assistant", content: getErrorMessage(error) },
        ]);
      } finally {
        setIsTyping(false);
      }
    }

    void launchConversation();
  }, [profile, profileKey, prompt, backendOnline, backendDetail]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading || !profile) return;

    if (!backendOnline) {
      appendAssistantMessage(backendDetail || OFFLINE_REPLY);
      return;
    }

    const userMessage: Message = { id: createMessageId(), role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await sendChatMessage(text, profile, shouldIncludeRecommendations(text));
      setMessages((current) => [
        ...current,
        { id: createMessageId(), role: "assistant", content: response.answer, response },
      ]);
    } catch (error) {
      appendAssistantMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  }

  if (!hasProfile) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-5 py-4 lg:px-6">
          <div>
            <div className="brand-name text-[20px] italic text-[var(--purple)]">Clara</div>
            <div className="text-[12px] text-[var(--text-muted)]">· AI skin assistant</div>
          </div>
          <div className="rounded-full bg-[var(--purple-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--purple)]">Beta</div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
          <div className="max-w-sm rounded-[8px] border border-[var(--border)] bg-white p-8 shadow-[0_18px_40px_rgba(26,26,46,0.05)]">
            <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--purple)]">Clara Chat</div>
            <h2 className="brand-name text-[34px] italic leading-[1.04] text-[var(--text-dark)]">A routine built around your profile.</h2>
            <p className="mt-3 text-[14px] leading-[1.7] text-[var(--text-dark)]">Select your skin profile on the left and Clara will open with a complete, clinically guided routine.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeProfile = profile as SkinProfile;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-white px-5 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-[8px] border border-[var(--border)] bg-white px-3 py-2 text-[12px] font-bold text-[var(--text-dark)] transition-all duration-150 ease-out hover:border-[var(--purple)] hover:text-[var(--purple)] lg:hidden">
            <ArrowLeft size={14} />
            Back
          </button>
          <div>
            <div className="brand-name text-[20px] italic text-[var(--purple)]">Clara</div>
            <div className="text-[12px] text-[var(--text-muted)]">· AI skin assistant</div>
          </div>
        </div>
        <div className="rounded-full bg-[var(--purple-light)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--purple)]">Beta</div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-5 py-5 lg:px-6">
        <div className="space-y-4">
          {!backendOnline ? (
            <div className="rounded-[8px] border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-[13px] leading-[1.6] text-[#7f1d1d]">
              {backendDetail || OFFLINE_REPLY}
            </div>
          ) : null}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} profile={activeProfile} />
          ))}

          {isTyping ? <TypingDots /> : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[var(--border)] bg-white p-4 lg:p-5">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={backendOnline ? "Ask a follow-up — ingredients, alternatives..." : "Backend offline — start FastAPI on port 8000"}
            rows={1}
            disabled={!backendOnline}
            className="min-h-[48px] flex-1 resize-none rounded-[8px] border border-[var(--border)] bg-white px-4 py-3 text-[14px] text-[var(--text-dark)] outline-none transition-all duration-150 ease-out placeholder:text-[var(--text-muted)] focus:border-[var(--purple-mid)] disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:text-[var(--text-muted)]"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !profile || !backendOnline}
            className="inline-flex h-[48px] w-[48px] items-center justify-center rounded-[8px] text-white transition-all duration-150 ease-out hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--purple)" }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "var(--purple-hover)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "var(--purple)";
            }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="rounded-[8px] border border-[var(--border)] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(26,26,46,0.05)]">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2 w-2 rounded-full bg-[var(--purple)]"
              style={{ animation: `clara-bounce 1s ease-in-out ${dot * 0.15}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
