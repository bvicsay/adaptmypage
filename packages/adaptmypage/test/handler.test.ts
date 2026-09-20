import { describe, expect, it } from "vitest";
import { createIntentHandler, validateSnapshot } from "../src/server";
import { snapshot } from "./heuristic.test";

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/intent", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("createIntentHandler", () => {
  const handler = createIntentHandler({ provider: { kind: "heuristic" }, allowDebug: true, cors: ["https://example.com"] });

  it("evaluates a valid snapshot", async () => {
    const res = await handler(post({ snapshot: snapshot(), debug: true }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.state.intent.value).toBeTypeOf("string");
    expect(json.debug.answers.intent).toBeDefined();
  });

  it("strips debug unless allowed", async () => {
    const strict = createIntentHandler({ provider: { kind: "heuristic" } });
    const json = await (await strict(post({ snapshot: snapshot(), debug: true }))).json();
    expect(json.debug).toBeUndefined();
  });

  it("rejects bad payloads", async () => {
    expect((await handler(post("{nope"))).status).toBe(400);
    expect((await handler(post({ snapshot: { v: 2 } }))).status).toBe(400);
    expect((await handler(new Request("http://x/api/intent", { method: "GET" }))).status).toBe(405);
  });

  it("answers CORS preflight for allowed origins only", async () => {
    const ok = await handler(new Request("http://x/api/intent", { method: "OPTIONS", headers: { origin: "https://example.com" } }));
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://example.com");
    const no = await handler(new Request("http://x/api/intent", { method: "OPTIONS", headers: { origin: "https://evil.com" } }));
    expect(no.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("lets authorize() short-circuit", async () => {
    const guarded = createIntentHandler({
      provider: { kind: "heuristic" },
      authorize: () => new Response("nope", { status: 401 }),
    });
    expect((await guarded(post({ snapshot: snapshot() }))).status).toBe(401);
  });
});

describe("validateSnapshot", () => {
  it("accepts a well-formed snapshot", () => {
    expect(validateSnapshot(snapshot())).toBeNull();
  });
  it("flags oversized actions", () => {
    const s = snapshot({ actions: [{ t: 0, type: "click", target: "x".repeat(300) }] });
    expect(validateSnapshot(s)).toMatch(/too long/);
  });
});
