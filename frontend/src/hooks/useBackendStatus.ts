"use client";

import { useCallback, useEffect, useState } from "react";

import { checkBackendHealth } from "@/lib/api";

export function useBackendStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [detail, setDetail] = useState("");

  const refresh = useCallback(async () => {
    const status = await checkBackendHealth();
    setIsOnline(status.ok);
    setDetail(status.detail ?? "");
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 12_000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  return { isOnline, detail, refresh };
}
