// Named snapshots for the Ponto Cruz editor. Persisted per projectId in localStorage.
import { chartToJson, jsonToChart, type ChartDoc } from "@/lib/ponto-cruz";

export interface PcSnapshot {
  id: string;
  nome: string;
  ts: number;
  chartJson: string;
  thumb?: string; // reserved for future
}

const KEY = (pid: string) => `ponto-cruz-versions-v1:${pid || "default"}`;
const CAP = 25;

export function listSnapshots(projectId: string): PcSnapshot[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY(projectId)) ?? "[]") as PcSnapshot[]; }
  catch { return []; }
}

export function saveSnapshot(projectId: string, nome: string, chart: ChartDoc): PcSnapshot {
  const list = listSnapshots(projectId);
  const snap: PcSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    nome: nome.trim() || `Versão ${list.length + 1}`,
    ts: Date.now(),
    chartJson: chartToJson(chart),
  };
  list.push(snap);
  try { window.localStorage.setItem(KEY(projectId), JSON.stringify(list.slice(-CAP))); } catch { /* noop */ }
  return snap;
}

export function deleteSnapshot(projectId: string, id: string) {
  const list = listSnapshots(projectId).filter((s) => s.id !== id);
  try { window.localStorage.setItem(KEY(projectId), JSON.stringify(list)); } catch { /* noop */ }
}

export function restoreSnapshot(snap: PcSnapshot): ChartDoc {
  return jsonToChart(snap.chartJson);
}