#!/usr/bin/env node
/**
 * Auditoria estática de navegação.
 * Falha se existir uma âncora <a href="/..."> para uma rota interna: isso
 * provoca recarga total da página (e o splash screen volta a aparecer).
 * Navegação interna tem de usar <Link to="..."> do TanStack Router.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const ficheiros = execFileSync("bash", ["-lc", "grep -rl '<a ' src --include='*.tsx' || true"])
  .toString().split("\n").filter(Boolean);

const problemas = [];
for (const f of ficheiros) {
  const linhas = readFileSync(f, "utf8").split("\n");
  linhas.forEach((linha, i) => {
    const m = linha.match(/<a\s[^>]*href=["']\/(?!\/)([^"']*)["']/);
    if (!m) return;
    const alvo = "/" + m[1];
    if (alvo.startsWith("/api") || /\.(png|jpg|svg|pdf|xml|txt|ico)$/i.test(alvo)) return;
    problemas.push(`${f}:${i + 1} → <a href="${alvo}"> (usa <Link to="${alvo}">)`);
  });
}

if (problemas.length) {
  console.error("\nAuditoria de navegação falhou — ligações internas com recarga total:");
  for (const p of problemas) console.error(" - " + p);
  process.exit(1);
}
console.log("Auditoria de navegação OK — todas as ligações internas usam o router.");
