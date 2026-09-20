import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  source: z.string().max(60).optional(),
  intent: z.string().max(60).optional(),
});

/** Adds an address to the launch list. Resend audience → webhook → local file (dev only). */
export async function POST(req: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return Response.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  const record = { ...parsed, ts: new Date().toISOString() };

  try {
    if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
      const res = await fetch(`https://api.resend.com/audiences/${process.env.RESEND_AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ email: parsed.email, unsubscribed: false }),
      });
      if (!res.ok && res.status !== 409) throw new Error(`resend ${res.status}`);
      return Response.json({ ok: true });
    }
    if (process.env.SUBSCRIBE_WEBHOOK_URL) {
      const res = await fetch(process.env.SUBSCRIBE_WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
      return Response.json({ ok: true });
    }
    if (process.env.NODE_ENV !== "production") {
      const dir = path.join(process.cwd(), ".data");
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "subscribers.jsonl"), `${JSON.stringify(record)}\n`);
      return Response.json({ ok: true, stored: "local" });
    }
    console.error("[subscribe] no provider configured; set RESEND_API_KEY+RESEND_AUDIENCE_ID or SUBSCRIBE_WEBHOOK_URL");
    return Response.json({ ok: false, error: "The list is not accepting sign-ups right now. Try again later." }, { status: 503 });
  } catch (err) {
    console.error("[subscribe]", err);
    return Response.json({ ok: false, error: "Could not save your address. Try again in a moment." }, { status: 502 });
  }
}
