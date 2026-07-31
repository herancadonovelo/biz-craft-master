#!/usr/bin/env node
/**
 * Traduz automaticamente as frases do registo português (src/i18n/content/pt.json)
 * para os restantes idiomas usando o Lovable AI Gateway.
 * Preenche apenas valores em falta/vazios — nunca sobrepõe traduções revistas.
 *
 *   LOVABLE_API_KEY=... node scripts/i18n-autotranslate.mjs [en es fr de it]
 */
import { readFileSync, writeFileSync } from "node:fs";

const LANGS = { en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian" };
const targets = process.argv.slice(2).filter((l) => LANGS[l]);
const langs = targets.length ? targets : Object.keys(LANGS);
const KEY = process.env.LOVABLE_API_KEY;
if (!KEY) { console.error("LOVABLE_API_KEY em falta"); process.exit(1); }

const pt = JSON.parse(readFileSync("src/i18n/content/pt.json", "utf8"));
const phrases = Object.keys(pt);
const BATCH = 40;

async function translateBatch(items, langName) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            `You translate UI strings of a craft-business management app from European Portuguese to ${langName}. ` +
            `Reply ONLY with a JSON object mapping each input string (verbatim key) to its translation. ` +
            `Keep placeholders ({{x}}, %s), emoji, punctuation, markdown markers and casing style intact. ` +
            `Keep translations short — they render in buttons, tabs and labels.`,
        },
        { role: "user", content: JSON.stringify(items) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

for (const lang of langs) {
  const file = `src/i18n/content/${lang}.json`;
  let dict = {};
  try { dict = JSON.parse(readFileSync(file, "utf8")); } catch { dict = {}; }
  const missing = phrases.filter((p) => !String(dict[p] ?? "").trim());
  console.log(`[${lang}] ${missing.length} por traduzir de ${phrases.length}`);
  for (let i = 0; i < missing.length; i += BATCH) {
    const slice = missing.slice(i, i + BATCH);
    let attempt = 0;
    for (;;) {
      try {
        const out = await translateBatch(slice, LANGS[lang]);
        for (const p of slice) {
          const v = out[p];
          if (typeof v === "string" && v.trim()) dict[p] = v.trim();
        }
        break;
      } catch (e) {
        attempt++;
        if (attempt >= 3) { console.warn(`[${lang}] lote ${i} falhou: ${e.message}`); break; }
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    const ordered = Object.fromEntries(Object.keys(dict).sort().map((k) => [k, dict[k]]));
    writeFileSync(file, JSON.stringify(ordered, null, 2) + "\n");
    console.log(`[${lang}] ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
  }
}
console.log("Concluído.");
