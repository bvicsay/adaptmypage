"use client";

import { DEMO_PAGES } from "@/demos/pages";
import { DemoShell } from "@/demos/shared/DemoShell";
import type { DemoConfig } from "@/demos/types";

export function FrameClient({ demo }: { demo: DemoConfig }) {
  const Page = DEMO_PAGES[demo.id];
  return (
    <DemoShell demo={demo}>
      <Page />
    </DemoShell>
  );
}
