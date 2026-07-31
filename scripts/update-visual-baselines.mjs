#!/usr/bin/env node
/**
 * Atualização controlada das baselines de screenshot (PT/EN).
 *
 * Exige aprovação manual explícita para evitar commits acidentais:
 *   bun run test:visual:baseline -- --approve
 *   APPROVE_VISUAL_BASELINE=yes bun run test:visual:baseline
 *
 * Sem aprovação, apenas mostra o que seria atualizado e sai com código 1.
 * Bloqueado em CI (não se aprovam baselines automaticamente).
 */
import { execFileSync, execSync } from "node:child_process";

const args = process.argv.slice(2);
const approved = args.includes("--approve") || process.env.APPROVE_VISUAL_BASELINE === "yes";
const SPEC = args.find((a) => !a.startsWith("--")) ?? "e2e/i18n-visual-layout.spec.ts";

if (process.env.CI) {
  console.error("[baselines] Bloqueado em CI. As baselines só se atualizam localmente, com aprovação manual.");
  process.exit(1);
}

function gitDirty() {
  try {
    return execSync("git status --porcelain -- '**/*-snapshots/**'", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

if (!approved) {
  console.log("Atualização de baselines de screenshot (PT/EN)");
  console.log("-------------------------------------------------");
  console.log(`Spec alvo: ${SPEC}`);
  console.log("");
  console.log("Nada foi alterado. Isto é apenas uma pré-visualização.");
  console.log("Para aprovar e regravar as baselines corre:");
  console.log("");
  console.log("  bun run test:visual:baseline -- --approve");
  console.log("");
  process.exit(1);
}

const before = gitDirty();
if (before) {
  console.error("[baselines] Existem alterações não commitadas em pastas de snapshots:");
  console.error(before);
  console.error("Faz commit ou limpa essas alterações antes de regravar as baselines.");
  process.exit(1);
}

console.log(`[baselines] A regravar baselines para ${SPEC}…`);
try {
  execFileSync("bunx", ["playwright", "test", SPEC, "--update-snapshots"], { stdio: "inherit" });
} catch {
  console.error("[baselines] A execução do Playwright falhou; nada foi aprovado.");
  process.exit(1);
}

const after = gitDirty();
console.log("");
if (!after) {
  console.log("[baselines] Nenhuma baseline mudou — o layout está igual.");
} else {
  console.log("[baselines] Baselines atualizadas (revê e faz commit destes ficheiros):");
  console.log(after);
  console.log("");
  console.log("Revisão sugerida: abre cada PNG e confirma que a mudança é intencional.");
}