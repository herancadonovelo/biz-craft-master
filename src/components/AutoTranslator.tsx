import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useStore } from "@/lib/store";
import { translateBatch } from "@/lib/translate.functions";

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
};

export function AutoTranslator() {
  const lang = useStore((s) => s.design.idioma);
  const cache = useStore((s) => s.traducoes);
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
    const langCache: Record<string, string> = (cache as any)?.[lang] || {};

    const flush = async () => {
      timerRef.current = null;
      if (lang === "pt") return;
      const q = queueRef.current;
      queueRef.current = new Map();
      const sources = Array.from(q.keys()).slice(0, 60);
      if (sources.length === 0) return;
      try {
        const res = await run({ data: { target: lang, strings: sources } });
        if (!res.ok) return;
        res.translations.forEach((t, i) => {
          const src = sources[i];
          setTraducao(lang, src, t);
          (q.get(src) || []).forEach((job) => job.apply(t));
        });
      } catch {}
    };

    const enqueue = (source: string, apply: (t: string) => void) => {
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
          const knownTranslation = langCache[original];
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
      const cached = langCache[original];
      if (cached) {
        if (n.data !== cached) n.data = cached;
        return;
      }
      enqueue(original, (t) => { try { n.data = t; } catch {} });
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
          const known = langCache[original];
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
        const cached = langCache[original];
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
  }, [lang, cache, run, setTraducao]);

  return null;
}