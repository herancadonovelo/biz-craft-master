import { test, expect } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// Consistency guard for renamed navigation entries. Whenever a sidebar label
// is renamed (e.g. "Cursos" -> "Academia Criativa de Artesanato: Cursos"),
// this suite makes sure every locale exposes the new label and no page still
// hardcodes the old title.

type LocaleExpectation = { locale: string; mustContain: string[] };

const RENAMES: Array<{
  key: string;
  route: string;
  legacyExact: string[]; // labels that must NOT appear alone anywhere in src/
  perLocale: LocaleExpectation[];
}> = [
  {
    key: "nav.courses",
    route: "/cursos",
    legacyExact: [], // "Cursos" as a word is still allowed inside the new label
    perLocale: [
      { locale: "pt", mustContain: ["Academia", "Cursos"] },
      { locale: "en", mustContain: ["Academy", "Courses"] },
      { locale: "es", mustContain: ["Academia", "Cursos"] },
      { locale: "fr", mustContain: ["Académie", "Cours"] },
      { locale: "de", mustContain: ["Akademie", "Kurse"] },
      { locale: "it", mustContain: ["Accademia", "Corsi"] },
    ],
  },
];

function readI18n(): string {
  return readFileSync("src/lib/i18n.ts", "utf8");
}

function extractLocaleDict(source: string, locale: string): Record<string, string> {
  const re = new RegExp(`const ${locale}: Dict = \\{([\\s\\S]*?)\\n\\};`);
  const m = source.match(re);
  if (!m) throw new Error(`locale block ${locale} not found`);
  const body = m[1];
  const out: Record<string, string> = {};
  const entryRe = /"([^"]+)":\s*"((?:[^"\\]|\\.)*)"/g;
  let e: RegExpExecArray | null;
  while ((e = entryRe.exec(body))) out[e[1]] = e[2];
  return out;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, files);
    else if (/\.(tsx?|mdx?)$/.test(name)) files.push(full);
  }
  return files;
}

test.describe("i18n rename consistency", () => {
  const source = readI18n();

  for (const entry of RENAMES) {
    test(`${entry.key} is translated in every locale`, () => {
      for (const exp of entry.perLocale) {
        const dict = extractLocaleDict(source, exp.locale);
        const value = dict[entry.key];
        expect(value, `${exp.locale} missing ${entry.key}`).toBeTruthy();
        for (const token of exp.mustContain) {
          expect(value, `${exp.locale}:${entry.key} should contain "${token}"`).toContain(token);
        }
      }
    });

    test(`${entry.key} has no stale legacy labels in src/`, () => {
      if (entry.legacyExact.length === 0) return;
      const files = walk("src");
      const offenders: string[] = [];
      for (const f of files) {
        const txt = readFileSync(f, "utf8");
        for (const legacy of entry.legacyExact) {
          const re = new RegExp(`(title|label)=\\{?["'\`]${legacy}["'\`]\\}?`);
          if (re.test(txt)) offenders.push(`${f} -> "${legacy}"`);
        }
      }
      expect(offenders, "legacy labels still present").toEqual([]);
    });

    test(`route ${entry.route} loads after rename`, async ({ page }) => {
      const status = await page.goto(entry.route, { waitUntil: "domcontentloaded" });
      // Accept both direct render and auth redirect; the goal is: no 404/5xx.
      expect(status?.status() ?? 0, `HTTP status for ${entry.route}`).toBeLessThan(400);
      // Sidebar link -> /cursos should still be wired.
      const src = readFileSync("src/components/app-sidebar.tsx", "utf8");
      expect(src).toContain(`url: "${entry.route}"`);
      expect(src).toContain(`t("${entry.key}")`);
    });
  }
});