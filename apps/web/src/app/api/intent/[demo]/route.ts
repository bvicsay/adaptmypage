import { createIntentHandler } from "adaptmypage/server";
import { DEMOS, isDemoId } from "@/demos/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One handler per demo, exactly as each of these sites would mount it. */
const handlers = Object.fromEntries(
  Object.values(DEMOS).map((d) => [
    d.id,
    createIntentHandler({ siteContext: d.siteContext, questions: d.questions, allowDebug: true, timeoutMs: 6000, retries: 1 }),
  ]),
) as Record<string, (req: Request) => Promise<Response>>;

export async function POST(req: Request, ctx: RouteContext<"/api/intent/[demo]">) {
  const { demo } = await ctx.params;
  if (!isDemoId(demo)) return Response.json({ error: "unknown_demo" }, { status: 404 });
  return handlers[demo]!(req);
}
