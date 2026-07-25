import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Keep this in sync with scripts/i18n-length-check.mjs
export const TRANSLATE_STRING_LIMIT = 5000;

const LANG_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish (Spain)",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese (Portugal)",
};

export const translateBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      // Do NOT enforce per-string max here — a Zod throw crashes the request
      // and gives no actionable info. We validate manually below and return a
      // structured payload so the client can log which entry is too long.
      target: z.string().min(2).max(5),
      strings: z.array(z.string().min(1)).min(1).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const offending = data.strings
      .map((s, index) => ({ index, length: s.length, preview: s.slice(0, 80) }))
      .filter((s) => s.length > TRANSLATE_STRING_LIMIT);
    if (offending.length > 0) {
      return {
        ok: false as const,
        error: "string_too_long" as const,
        limit: TRANSLATE_STRING_LIMIT,
        offending,
      };
    }
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "LOVABLE_API_KEY missing" };
    if (data.target === "pt") {
      return { ok: true as const, translations: data.strings };
    }
    const langName = LANG_NAMES[data.target] || data.target;
    const system = `You are a professional UI translator. Translate the given Portuguese (Portugal) UI strings to ${langName}.
Rules:
- Preserve placeholders like {name}, %s, numbers, dates, currency symbols, emails, URLs, brand names.
- Keep punctuation and casing style.
- Return ONLY a JSON array of strings in the EXACT same order and length as input. No commentary.`;
    const user = JSON.stringify(data.strings);
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });
      if (res.status === 429) return { ok: false as const, error: "rate_limit" };
      if (res.status === 402) return { ok: false as const, error: "no_credits" };
      if (!res.ok) return { ok: false as const, error: `gateway_${res.status}` };
      const json: any = await res.json();
      let content: string = json?.choices?.[0]?.message?.content ?? "[]";
      // strip code fences if present
      content = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      let arr: unknown;
      try { arr = JSON.parse(content); } catch { return { ok: false as const, error: "parse" }; }
      if (!Array.isArray(arr) || arr.length !== data.strings.length) {
        return { ok: false as const, error: "shape" };
      }
      const translations = arr.map((x, i) => (typeof x === "string" ? x : data.strings[i]));
      return { ok: true as const, translations };
    } catch (e) {
      console.error("translateBatch", e);
      return { ok: false as const, error: "network" };
    }
  });