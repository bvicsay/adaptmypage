import { DOCS } from "./docs/config";
import { PRICING } from "./pricing/config";
import { PRODUCT } from "./product/config";
import { SIGNUP } from "./signup/config";
import type { DemoConfig, DemoId } from "./types";

export const DEMOS: Record<DemoId, DemoConfig> = { pricing: PRICING, product: PRODUCT, docs: DOCS, signup: SIGNUP };
export const DEMO_IDS = Object.keys(DEMOS) as DemoId[];
export const isDemoId = (id: string): id is DemoId => id in DEMOS;
