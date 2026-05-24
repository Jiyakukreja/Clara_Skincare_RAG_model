"use client";

import { ErrorScreen } from "@/components/ErrorScreen";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** Replaces the default Next.js “500: This page couldn’t load” screen. */
export default function GlobalError({ reset }: Props) {
  return (
    <html lang="en">
      <body>
        <ErrorScreen
          title="Clara is still here"
          message="The app ran into an unexpected problem, but your chat is safe. Reload to continue — if chat fails, start the backend on port 8000 and check GEMINI_API_KEY."
          onRetry={reset}
          retryLabel="Reload Clara"
        />
      </body>
    </html>
  );
}
