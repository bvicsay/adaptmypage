// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Intent, IntentFlagsProvider, useIntent, useVisitorState, createIntentFlags } from "../src";
import type { IntentResponse } from "../src";
import { toVisitorState, DEFAULT_QUESTIONS, evaluateHeuristic } from "../src/server";

class IO {
  static instances: IO[] = [];
  cb: IntersectionObserverCallback;
  els = new Set<Element>();
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    IO.instances.push(this);
  }
  observe(el: Element) {
    this.els.add(el);
  }
  unobserve(el: Element) {
    this.els.delete(el);
  }
  disconnect() {
    this.els.clear();
  }
  takeRecords() {
    return [];
  }
  fire(el: Element, visible: boolean) {
    this.cb(
      [{ target: el, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function fakeFetch(onBody?: (b: unknown) => void) {
  return vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    onBody?.(body);
    const raw = evaluateHeuristic(body.snapshot, DEFAULT_QUESTIONS);
    const resp: IntentResponse = { state: toVisitorState(raw, DEFAULT_QUESTIONS, { source: "heuristic", latencyMs: 1 }) };
    return new Response(JSON.stringify(resp), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.useFakeTimers();
  IO.instances = [];
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  sessionStorage.clear();
  localStorage.clear();
  document.body.innerHTML = "";
});
afterEach(() => {
  vi.useRealTimers();
});

describe("core client", () => {
  it("collects semantic actions and posts a snapshot", async () => {
    document.body.innerHTML = `
      <section id="hero"><h2>Hero</h2><button>Start building</button></section>
      <section id="pricing"><h2>Pricing</h2></section>`;
    let sent: unknown = null;
    const client = createIntentFlags({ fetch: fakeFetch((b) => (sent = b)), initialDelayMs: 10, minIntervalMs: 0 });

    const btn = document.querySelector("button")!;
    btn.click();
    IO.instances[0]!.fire(document.getElementById("pricing")!, true);

    const actions = client.getActions();
    expect(actions.map((a) => a.type)).toEqual(["pageview", "click", "section_enter"]);
    expect(actions[1]).toMatchObject({ target: "button:Start building", detail: "hero" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    const body = sent as { snapshot: { actions: unknown[]; sections: Array<{ id: string }> } };
    expect(body.snapshot.actions.length).toBe(3);
    expect(body.snapshot.sections.map((s) => s.id)).toContain("pricing");
    expect(client.getState().meta.source).toBe("heuristic");
    client.destroy();
  });

  it("detects rage clicks", () => {
    document.body.innerHTML = `<button>Buy</button>`;
    const client = createIntentFlags({ fetch: fakeFetch(), initialDelayMs: 100000 });
    const btn = document.querySelector("button")!;
    btn.click();
    btn.click();
    btn.click();
    expect(client.getActions().at(-1)?.type).toBe("rage_click");
    expect(client.getSnapshot().cursor.rageClicks).toBe(1);
    client.destroy();
  });

  it("is inert on the server", () => {
    const client = createIntentFlags({ disabled: true });
    expect(client.getState().meta.source).toBe("initial");
    expect(client.getActions()).toEqual([]);
  });
});

describe("react bindings", () => {
  it("renders <Intent> based on live flags", async () => {
    function Probe() {
      const s = useVisitorState();
      const tech = useIntent("technical_evaluation", { threshold: 0.01 });
      return (
        <div>
          <span data-testid="src">{s.meta.source}</span>
          <span data-testid="tech">{tech.active ? "yes" : "no"}</span>
          <Intent when="exploring" confidence={2}>never</Intent>
          <Intent when="exploring" confidence={0}>always</Intent>
        </div>
      );
    }
    render(
      <IntentFlagsProvider fetch={fakeFetch()} initialDelayMs={10}>
        <Probe />
      </IntentFlagsProvider>,
    );
    expect(screen.getByTestId("src").textContent).toBe("initial");
    expect(screen.getByText("always")).toBeTruthy();
    expect(screen.queryByText("never")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(screen.getByTestId("src").textContent).toBe("heuristic");
    expect(screen.getByTestId("tech").textContent).toBe("yes");
  });
});
