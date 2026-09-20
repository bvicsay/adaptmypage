import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

/** IntentFlags code theme: navy paper, signal blue keywords, amber strings. */
const theme = {
  name: "adaptmypage",
  type: "dark" as const,
  colors: {
    "editor.background": "#0c1222",
    "editor.foreground": "#dfe6f5",
  },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#6a7691", fontStyle: "italic" } },
    { scope: ["keyword", "storage.type", "storage.modifier", "keyword.operator.new", "keyword.control"], settings: { foreground: "#8fa8ff" } },
    { scope: ["string", "string.template", "punctuation.definition.string"], settings: { foreground: "#f5c76a" } },
    { scope: ["constant.numeric", "constant.language", "constant.language.boolean"], settings: { foreground: "#ffb08a" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#dfe6f5" } },
    { scope: ["entity.name.tag", "support.class.component"], settings: { foreground: "#8fa8ff" } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: "#a9c2ff" } },
    { scope: ["variable", "meta.object-literal.key", "support.variable.property", "variable.other.property"], settings: { foreground: "#dfe6f5" } },
    { scope: ["support.type", "entity.name.type", "support.type.primitive"], settings: { foreground: "#7fd8b0" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#9aa7c2" } },
    { scope: ["keyword.operator"], settings: { foreground: "#9aa7c2" } },
    { scope: ["source.shell", "source.bash"], settings: { foreground: "#dfe6f5" } },
    { scope: ["support.type.property-name.json"], settings: { foreground: "#a9c2ff" } },
    { scope: ["string.quoted.double.json"], settings: { foreground: "#f5c76a" } },
  ],
};

export type Lang = "tsx" | "ts" | "bash" | "json" | "text";

export async function highlight(code: string, lang: Lang): Promise<string> {
  highlighterPromise ??= createHighlighter({ themes: [theme], langs: ["tsx", "typescript", "bash", "json"] });
  const h = await highlighterPromise;
  const l = lang === "ts" ? "typescript" : lang === "text" ? "text" : lang;
  return h.codeToHtml(code.trim(), { lang: l, theme: "adaptmypage" });
}

export async function highlightAll<T extends Record<string, { code: string; lang: Lang }>>(
  snippets: T,
): Promise<Record<keyof T, string>> {
  const out = {} as Record<keyof T, string>;
  await Promise.all(
    (Object.keys(snippets) as Array<keyof T>).map(async (k) => {
      out[k] = await highlight(snippets[k].code, snippets[k].lang);
    }),
  );
  return out;
}
