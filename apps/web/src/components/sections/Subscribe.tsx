"use client";

import { useVisitorState } from "intentflags";
import { useState } from "react";
import { Button, SectionHeader } from "../ui";

export function Subscribe() {
  const state = useVisitorState();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: "landing", intent: state.intent.value }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Could not subscribe.");
      setStatus("done");
      setMessage("You’re on the list. One email when the hosted API opens.");
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <section id="subscribe" data-section="subscribe" className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center">
        <SectionHeader
          eyebrow="Early access"
          title="Get the launch email."
          lede="One message when the hosted API and dashboard open, with pricing. No sequence, no digest. The SDK is on npm today."
        />
        <form onSubmit={submit} name="early-access" data-intent="early-access" className="w-full max-w-md lg:ml-auto">
          <label htmlFor="email" className="eyebrow">
            Email
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "done"}
              className="h-11 flex-1 rounded-[8px] border border-line-2 bg-surface px-3.5 text-[16px] text-ink placeholder:text-ink-3 focus:border-signal disabled:opacity-60"
            />
            <Button type="submit" disabled={status === "sending" || status === "done"} dataIntent="Subscribe: Get updates">
              {status === "sending" ? "Adding…" : status === "done" ? "Added" : "Get updates"}
            </Button>
          </div>
          <p className={`mt-2 min-h-[1.25rem] text-[13px] ${status === "error" ? "text-live" : "text-ink-3"}`} role="status">
            {message || "Unsubscribe with one click. Address is used for this one email only."}
          </p>
        </form>
      </div>
    </section>
  );
}
