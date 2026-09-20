"use client";

import { IntentFlagsProvider } from "intentflags";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <IntentFlagsProvider
      endpoint="/api/intent"
      debug
      initialDelayMs={1200}
      debounceMs={1800}
      minIntervalMs={3500}
      heartbeatMs={15000}
      context={{ page: "landing", sdk_version: "0.1.0" }}
      onError={(e) => console.warn("[intentflags]", e)}
    >
      {children}
    </IntentFlagsProvider>
  );
}
