"use client";

import type { ComponentType } from "react";
import DocsDemo from "./docs/Page";
import PricingDemo from "./pricing/Page";
import ProductDemo from "./product/Page";
import SignupDemo from "./signup/Page";
import type { DemoId } from "./types";

export const DEMO_PAGES: Record<DemoId, ComponentType> = { pricing: PricingDemo, product: ProductDemo, docs: DocsDemo, signup: SignupDemo };
