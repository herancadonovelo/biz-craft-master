// CSV import audit log with undo-last-batch.
// Persists in localStorage so a page reload still lets you roll back the last
// import (creations get deleted, updates restore the previous material state).

import type { Material } from "@/lib/store";
import { useStore } from "@/lib/store";

export interface CsvImportBatch {
  id: string;
  ts: number; // epoch ms
  file?: string;
  criados: string[]; // material ids created in this batch
  atualizados: { id: string; before: Partial<Material> }[]; // pre-image
  fornecedoresCriados: string[]; // supplier ids created in this batch
  totals: { novos: number; updates: number; ignorados: number };
}

const KEY = "cbm:csv-import-history:v1";
const CAP = 20;

function safeRead(): CsvImportBatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CsvImportBatch[]) : [];
  } catch { return []; }
}

function safeWrite(list: CsvImportBatch[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(list.slice(-CAP))); } catch { /* noop */ }
}

export function listImportBatches(): CsvImportBatch[] {
  return safeRead().slice().reverse();
}

export function recordImportBatch(batch: Omit<CsvImportBatch, "id" | "ts">): CsvImportBatch {
  const full: CsvImportBatch = { ...batch, id: `imp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ts: Date.now() };
  const list = safeRead();
  list.push(full);
  safeWrite(list);
  return full;
}

/** Roll back a previously-recorded import batch. Returns counts of undone changes. */
export function undoImportBatch(id: string): { removidos: number; restaurados: number; fornecedoresRemovidos: number } {
  const list = safeRead();
  const idx = list.findIndex((b) => b.id === id);
  if (idx < 0) return { removidos: 0, restaurados: 0, fornecedoresRemovidos: 0 };
  const batch = list[idx];
  const store = useStore.getState();

  let removidos = 0;
  for (const mid of batch.criados) {
    if (store.materiais.some((m) => m.id === mid)) { store.remove("materiais", mid); removidos++; }
  }
  let restaurados = 0;
  for (const { id: mid, before } of batch.atualizados) {
    if (store.materiais.some((m) => m.id === mid)) { store.update("materiais", mid, before); restaurados++; }
  }
  let fornecedoresRemovidos = 0;
  for (const fid of batch.fornecedoresCriados) {
    const f = store.fornecedores.find((x) => x.id === fid);
    // Only delete if unused by remaining materials.
    const usado = useStore.getState().materiais.some((m) => m.fornecedorId === fid || (m.fornecedoresExtra ?? []).some((e) => e.fornecedorId === fid));
    if (f && !usado) { store.remove("fornecedores", fid); fornecedoresRemovidos++; }
  }

  list.splice(idx, 1);
  safeWrite(list);
  return { removidos, restaurados, fornecedoresRemovidos };
}

export function clearImportHistory() { safeWrite([]); }

// ---------------- Column-mapping templates (per supplier or generic) ---------------

import type { Campo } from "@/lib/csv-import";

export interface CsvMappingTemplate {
  id: string;
  nome: string;
  fornecedor?: string;
  mapping: Partial<Record<Campo, string>>;
  createdAt: number;
}

const TPL_KEY = "cbm:csv-mapping-templates:v1";

export function listMappingTemplates(): CsvMappingTemplate[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(TPL_KEY) ?? "[]") as CsvMappingTemplate[]; } catch { return []; }
}

export function saveMappingTemplate(t: Omit<CsvMappingTemplate, "id" | "createdAt">): CsvMappingTemplate {
  const list = listMappingTemplates();
  const full: CsvMappingTemplate = { ...t, id: `tpl-${Date.now()}`, createdAt: Date.now() };
  list.push(full);
  try { window.localStorage.setItem(TPL_KEY, JSON.stringify(list.slice(-50))); } catch { /* noop */ }
  return full;
}

export function deleteMappingTemplate(id: string) {
  const list = listMappingTemplates().filter((t) => t.id !== id);
  try { window.localStorage.setItem(TPL_KEY, JSON.stringify(list)); } catch { /* noop */ }
}