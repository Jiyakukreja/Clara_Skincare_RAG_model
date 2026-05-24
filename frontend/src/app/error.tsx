"use client";

import { ErrorScreen } from "@/components/ErrorScreen";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  return (
    <ErrorScreen
      message={
        error.message ||
        "Something went wrong loading Clara. Start the FastAPI backend on port 8000, then try again."
      }
      onRetry={reset}
    />
  );
}
