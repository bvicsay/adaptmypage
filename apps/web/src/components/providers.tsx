"use client";

import { IntentFlagsProvider } from "adaptmypage";
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
      context={{ page: "landing", sdk_version: "0.1.0", brand: "adaptmypage" }}
      onError={(e) => console.warn("[adaptmypage]", e)}
    >
      {children}
    </IntentFlagsProvider>
  );
}
