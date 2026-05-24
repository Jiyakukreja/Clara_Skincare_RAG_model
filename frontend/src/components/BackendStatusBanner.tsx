"use client";

type Props = {
  isOnline: boolean | null;
  detail: string;
  onRetry: () => void;
};

export function BackendStatusBanner({ isOnline, detail, onRetry }: Props) {
  if (isOnline !== false) return null;

  return (
    <div
      role="alert"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 text-[13px] leading-[1.6] text-[#7f1d1d]"
    >
      <span>
        {detail || "AI backend is offline. Start FastAPI on port 8000 before chatting with Clara."}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-[6px] border border-[#f5c2c7] bg-white px-3 py-1 text-[12px] font-bold text-[#7f1d1d]"
      >
        Retry connection
      </button>
    </div>
  );
}
