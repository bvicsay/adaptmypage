"use client";

import { useVisitorState } from "adaptmypage";
import { useState } from "react";
import { SectionHeader } from "../ui";

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
      setMessage("You’re on the list.");
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <section id="subscribe" data-section="subscribe" className="band">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-28 sm:px-10 lg:grid-cols-2 lg:items-center lg:gap-20">
        <SectionHeader
          eyebrow="Early access"
          title={
            <>
              Get the launch
              <br />
              <span className="serif-italic">email.</span>
            </>
          }
          lede="One message when the hosted API opens. Nothing else."
        />
        <form onSubmit={submit} name="early-access" data-intent="early-access" className="w-full max-w-md lg:ml-auto">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@company.com"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "done"}
              className="h-12 flex-1 rounded-[6px] border border-ink/25 bg-surface px-4 text-[16px] text-ink placeholder:text-ink-3 focus:border-ink disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "sending" || status === "done"}
              data-intent="Subscribe: Get updates"
              className="h-12 rounded-[6px] bg-ink px-5 text-[0.95rem] font-semibold text-paper hover:bg-black disabled:opacity-60"
            >
              {status === "sending" ? "Adding…" : status === "done" ? "Added" : "Get updates"}
            </button>
          </div>
          <p className={`mt-3 min-h-[1.25rem] font-mono text-[11.5px] ${status === "error" ? "text-red-700" : "text-ink-3"}`} role="status">
            {message}
          </p>
        </form>
      </div>
    </section>
  );
}
