type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorScreen({
  title = "Clara hit a snag",
  message,
  onRetry,
  retryLabel = "Try again",
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-[#1a1a2e]">
      <div className="max-w-md rounded-[8px] border border-[#e8e4f0] bg-[#f5f0ff] p-8 shadow-[0_18px_45px_rgba(26,26,46,0.05)]">
        <div className="text-[28px] italic text-[#8c30f5]" style={{ fontFamily: "Georgia, serif" }}>
          Clara
        </div>
        <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mt-3 text-[14px] leading-[1.7]">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 rounded-[8px] bg-[#8c30f5] px-4 py-2 text-[14px] font-bold text-white"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    </main>
  );
}
