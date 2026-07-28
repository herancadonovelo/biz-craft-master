import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useStore } from "@/lib/store";
import { translateBatch, TRANSLATE_STRING_LIMIT } from "@/lib/translate.functions";
import { KNIT_GLOSSARY } from "@/lib/knit/i18n";
import { useAuth } from "@/lib/auth-state";
import { toast } from "sonner";

const ATTRS = ["placeholder", "title", "aria-label"] as const;
const SKIP_TAGS = new Set([
  "SCRIPT", "STYLE", "CODE", "PRE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT",
]);
const HAS_LETTERS = /\p{L}/u;

function shouldTranslate(text: string) {
  const t = text.trim();
  if (t.length < 2) return false;
  if (!HAS_LETTERS.test(t)) return false;
  // skip URLs/emails
  if (/^https?:\/\//i.test(t) || /^[\w.+-]+@[\w.-]+$/.test(t)) return false;
  return true;
}

function isInsideSkip(node: Node) {
  let el: Node | null = node;
  while (el) {
    if (el.nodeType === 1) {
      const e = el as HTMLElement;
      if (SKIP_TAGS.has(e.tagName)) return true;
      if (e.hasAttribute("data-no-translate")) return true;
      if (e.getAttribute("contenteditable") === "true") return true;
    }
    el = el.parentNode;
  }
  return false;
}

type Job = {
  apply: (translated: string) => void;
  source: string;
  // For long strings we translate chunk-by-chunk and rejoin them before
  // applying — the caller only ever sees the fully-translated string.
  parts?: { total: number; results: (string | null)[] };
  partIndex?: number;
};

// Split a long string on paragraph / sentence / whitespace boundaries so each
// chunk fits within TRANSLATE_STRING_LIMIT. Rejoined with the same separator.
function splitLongString(input: string, limit = TRANSLATE_STRING_LIMIT - 200): string[] {
  if (input.length <= limit) return [input];
  const chunks: string[] = [];
  let rest = input;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n\n", limit);
    if (cut < limit * 0.5) cut = rest.lastIndexOf(". ", limit);
    if (cut < limit * 0.5) cut = rest.lastIndexOf(" ", limit);
    if (cut < limit * 0.3) cut = limit;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).replace(/^[.\s]+/, "");
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function describeElement(root: Node): string {
  try {
    let el: Node | null = root;
    while (el && el.nodeType !== 1) el = el.parentNode;
    if (!el) return "unknown";
    const e = el as HTMLElement;
    const tag = e.tagName.toLowerCase();
    const id = e.id ? `#${e.id}` : "";
    const cls = e.className && typeof e.className === "string"
      ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".")
      : "";
    return `${tag}${id}${cls}`.slice(0, 80);
  } catch { return "unknown"; }
}

export function AutoTranslator() {
  const lang = useStore((s) => s.design.idioma);
  const { user, loading } = useAuth();
  const setTraducao = useStore((s) => s.setTraducao);
  const run = useServerFn(translateBatch);
  const queueRef = useRef<Map<string, Job[]>>(new Map());
  const timerRef = useRef<number | null>(null);
  // store the original PT text for each text-node / element-attribute we touched,
  // so that switching languages back works and React re-renders are detected.
  const originalText = useRef<WeakMap<Text, string>>(new WeakMap());
  const originalAttr = useRef<WeakMap<Element, Record<string, string>>>(new WeakMap());

  useEffect(() => {
    if (typeof window === "undefined") return;
    // translateBatch requires an authenticated session, mas o glossário
    // estático funciona offline — por isso continuamos a observar o DOM e
    // apenas bloqueamos as chamadas ao servidor quando não há sessão.
    if (loading) return;
    // Glossário estático (offline, instantâneo) + cache do utilizador/IA.
    // O cache dinâmico tem prioridade para permitir correcções manuais.
    const getLangCache = (): Record<string, string> => ({
      ...((KNIT_GLOSSARY as Record<string, Record<string, string>>)[lang] || {}),
      ...(((useStore.getState().traducoes as any) || {})[lang] || {}),
    });

    const flush = async () => {
      timerRef.current = null;
      if (lang === "pt") return;
      if (!user) return;
      const q = queueRef.current;
      queueRef.current = new Map();
      const sources = Array.from(q.keys()).slice(0, 60);
      if (sources.length === 0) return;
      try {
        const res = await run({ data: { target: lang, strings: sources } });
        if (!res.ok) {
          if ((res as any).error === "string_too_long") {
            const off = (res as any).offending as { index: number; length: number; preview: string }[];
            for (const o of off) {
              const src = sources[o.index];
              // eslint-disable-next-line no-console
              console.error(
                `[i18n] String exceeds serverFn limit (${o.length}/${TRANSLATE_STRING_LIMIT} chars)`,
                {
                  preview: o.preview + "…",
                  origin: (q.get(src) || [])[0] ? "auto-translator (DOM scrape)" : "unknown",
                  source: "src/components/AutoTranslator.tsx",
                  hint: "The string will be re-queued as split chunks. Consider breaking the source paragraph into <p> elements.",
                },
              );
            }
            if (import.meta.env.DEV) {
              toast.error("i18n: string demasiado longa — ver consola para localização.");
            }
            // Re-enqueue as split chunks and let the next flush handle them.
            for (const o of off) {
              const src = sources[o.index];
              const jobs = q.get(src) || [];
              const parts = splitLongString(src);
              const bag = { total: parts.length, results: new Array(parts.length).fill(null) as (string | null)[] };
              parts.forEach((p, i) => {
                for (const j of jobs) {
                  enqueue(p, (translated) => {
                    bag.results[i] = translated;
                    if (bag.results.every((r) => r !== null)) {
                      j.apply(bag.results.join(" "));
                    }
                  });
                }
              });
            }
          }
          return;
        }
        res.translations.forEach((t, i) => {
          const src = sources[i];
          setTraducao(lang, src, t);
          (q.get(src) || []).forEach((job) => job.apply(t));
        });
      } catch {}
    };

    const enqueue = (source: string, apply: (t: string) => void) => {
      // Sem sessão só conseguimos servir o glossário estático / cache local.
      if (!user) return;
      // Short-circuit: never send an over-limit string to the server — split
      // it locally first so the server call always succeeds. This is the
      // "seamless" fallback promised in the plan.
      if (source.length > TRANSLATE_STRING_LIMIT) {
        const parts = splitLongString(source);
        const bag = { total: parts.length, results: new Array(parts.length).fill(null) as (string | null)[] };
        parts.forEach((p, i) => {
          enqueue(p, (translated) => {
            bag.results[i] = translated;
            if (bag.results.every((r) => r !== null)) apply(bag.results.join(" "));
          });
        });
        return;
      }
      const list = queueRef.current.get(source) || [];
      list.push({ apply, source });
      queueRef.current.set(source, list);
      if (timerRef.current == null) {
        timerRef.current = window.setTimeout(flush, 450);
      }
    };

    const handleTextNode = (n: Text) => {
      if (isInsideSkip(n)) return;
      const current = n.data;
      let original = originalText.current.get(n);
      // If we don't have an original yet, treat current as original (PT source).
      if (!original) {
        if (!shouldTranslate(current)) return;
        original = current;
        originalText.current.set(n, original);
      } else {
        // React updated text? If current matches stored translation for any lang, keep original.
        // If current differs from both original and known translations, refresh original.
        if (current !== original) {
          const knownTranslation = getLangCache()[original];
          if (knownTranslation && current === knownTranslation) {
            // already translated, nothing to do
            return;
          }
          // React changed the source text -> reset original
          if (shouldTranslate(current)) {
            original = current;
            originalText.current.set(n, original);
          } else {
            return;
          }
        }
      }
      if (lang === "pt") {
        if (n.data !== original) n.data = original;
        return;
      }
      const cached = getLangCache()[original];
      if (cached) {
        if (n.data !== cached) n.data = cached;
        return;
      }
      enqueue(original, (t) => { try { n.data = t; } catch {} });
      // silence unused-var lint on describeElement in prod
      void describeElement;
    };

    const handleAttrs = (el: Element) => {
      if (isInsideSkip(el)) return;
      const store = originalAttr.current.get(el) || {};
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v == null) continue;
        let original = store[a];
        if (!original) {
          if (!shouldTranslate(v)) continue;
          original = v;
          store[a] = original;
        } else if (v !== original) {
          const known = getLangCache()[original];
          if (known && v === known) continue;
          if (shouldTranslate(v)) {
            original = v;
            store[a] = original;
          } else continue;
        }
        if (lang === "pt") {
          if (v !== original) el.setAttribute(a, original);
          continue;
        }
        const cached = getLangCache()[original];
        if (cached) {
          if (v !== cached) el.setAttribute(a, cached);
          continue;
        }
        enqueue(original, (t) => { try { el.setAttribute(a, t); } catch {} });
      }
      originalAttr.current.set(el, store);
    };

    const walk = (root: Node) => {
      if (root.nodeType === 3) { handleTextNode(root as Text); return; }
      if (root.nodeType !== 1) return;
      const el = root as Element;
      if (SKIP_TAGS.has(el.tagName)) return;
      if (el.hasAttribute && el.hasAttribute("data-no-translate")) return;
      handleAttrs(el);
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
          if (node.nodeType === 1) {
            const e = node as Element;
            if (SKIP_TAGS.has(e.tagName) || (e.hasAttribute && e.hasAttribute("data-no-translate"))) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let cur: Node | null = tw.currentNode;
      while (cur) {
        if (cur.nodeType === 3) handleTextNode(cur as Text);
        else if (cur.nodeType === 1 && cur !== el) handleAttrs(cur as Element);
        cur = tw.nextNode();
      }
    };

    walk(document.body);

    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === 3) {
          handleTextNode(m.target as Text);
        } else if (m.type === "childList") {
          m.addedNodes.forEach((n) => walk(n));
        } else if (m.type === "attributes" && m.target.nodeType === 1) {
          handleAttrs(m.target as Element);
        }
      }
    });
    obs.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    return () => {
      obs.disconnect();
      if (timerRef.current != null) { window.clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [lang, run, setTraducao, user, loading]);

  return null;
}