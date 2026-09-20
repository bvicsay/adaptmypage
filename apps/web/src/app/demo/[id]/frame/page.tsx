import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DEMOS, isDemoId } from "@/demos/registry";
import { FrameClient } from "./FrameClient";

export default async function FramePage({ params }: PageProps<"/demo/[id]/frame">) {
  const { id } = await params;
  if (!isDemoId(id)) notFound();
  const demo = DEMOS[id];
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FrameClient demo={demo} />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps<"/demo/[id]/frame">) {
  const { id } = await params;
  const demo = isDemoId(id) ? DEMOS[id] : null;
  return { title: demo ? `${demo.brand} — live demo` : "Demo", robots: { index: false } };
}
