// Minimal iCalendar (RFC5545) builder for production plans.
import type { ProducaoPlano } from "./store";

const pad = (n: number) => String(n).padStart(2, "0");
const toDateOnly = (iso?: string) => {
  if (!iso) return null;
  if (iso.length === 10) return iso.replace(/-/g, "");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
};
const shiftDateStr = (yyyymmdd: string, days: number) => {
  const y = +yyyymmdd.slice(0, 4), m = +yyyymmdd.slice(4, 6) - 1, d = +yyyymmdd.slice(6, 8);
  const dt = new Date(Date.UTC(y, m, d + days));
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
};
const esc = (s: string) =>
  String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const nowStamp = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
};

export interface IcsOptions {
  /** IANA timezone name (e.g. "Europe/Lisbon"). Empty/undefined = floating UTC dates. */
  timezone?: string;
  /** Include stage notes and full task detail in DESCRIPTION. */
  includeDescription?: boolean;
  /** Duration in days used when an etapa has início but no fim. Default 1. */
  defaultDurationDays?: number;
  /** Duration in days used for individual task events (deadline). Default 1. */
  taskDurationDays?: number;
}

export function planoToICS(plano: ProducaoPlano, opts: IcsOptions = {}): string {
  const {
    timezone,
    includeDescription = true,
    defaultDurationDays = 1,
    taskDurationDays = 1,
  } = opts;
  const stamp = nowStamp();
  const tzid = timezone && timezone.trim() ? timezone.trim() : "";
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CraftBusinessMaster//Planeador//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(plano.nome)}`,
  ];
  if (tzid) lines.push(`X-WR-TIMEZONE:${esc(tzid)}`);
  for (const et of plano.etapas) {
    const start = toDateOnly(et.inicio);
    const endRaw = toDateOnly(et.fim);
    // DTEND for all-day events is exclusive; also give a duration fallback.
    const end = endRaw
      ? shiftDateStr(endRaw, 1)
      : start
      ? shiftDateStr(start, Math.max(1, defaultDurationDays))
      : null;
    if (start) {
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:etapa-${et.id}@cbm`);
      lines.push(`DTSTAMP:${stamp}`);
      const tzParam = tzid ? `;TZID=${tzid}` : "";
      lines.push(`DTSTART;VALUE=DATE${tzParam}:${start}`);
      if (end) lines.push(`DTEND;VALUE=DATE${tzParam}:${end}`);
      lines.push(`SUMMARY:${esc(`[Etapa] ${et.nome}`)}`);
      if (includeDescription) {
        const done = et.tarefas.filter((t) => t.status === "feito" || t.feito).length;
        const header = `Etapa: ${et.nome}\nProgresso: ${done}/${et.tarefas.length} tarefas${
          et.concluida ? " · Concluída" : ""
        }`;
        const body = et.tarefas
          .map((t) => {
            const st = t.status === "feito" || t.feito
              ? "✓"
              : t.status === "em_progresso"
              ? "→"
              : "○";
            const meta = [
              t.responsavel ? `resp: ${t.responsavel}` : null,
              t.prazo ? `prazo: ${t.prazo}` : null,
            ].filter(Boolean).join(" · ");
            return `${st} ${t.texto}${meta ? ` (${meta})` : ""}`;
          })
          .join("\n");
        const desc = [header, body].filter(Boolean).join("\n\n");
        if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
      }
      if (et.concluida) lines.push("STATUS:CONFIRMED");
      lines.push("END:VEVENT");
    }
    for (const t of et.tarefas) {
      const d = toDateOnly(t.prazo);
      if (!d) continue;
      const tEnd = shiftDateStr(d, Math.max(1, taskDurationDays));
      const tzParam = tzid ? `;TZID=${tzid}` : "";
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:tarefa-${t.id}@cbm`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART;VALUE=DATE${tzParam}:${d}`);
      lines.push(`DTEND;VALUE=DATE${tzParam}:${tEnd}`);
      lines.push(`SUMMARY:${esc(`${t.texto || "Tarefa"}${t.responsavel ? ` — ${t.responsavel}` : ""}`)}`);
      if (includeDescription) {
        const parts = [
          `Etapa: ${et.nome}`,
          t.responsavel ? `Responsável: ${t.responsavel}` : null,
          `Status: ${t.status ?? (t.feito ? "feito" : "nao_iniciado")}`,
        ].filter(Boolean).join("\n");
        lines.push(`DESCRIPTION:${esc(parts)}`);
      }
      const status = t.status === "feito" || t.feito ? "COMPLETED" : t.status === "em_progresso" ? "IN-PROCESS" : "NEEDS-ACTION";
      lines.push(`STATUS:${status === "COMPLETED" ? "CONFIRMED" : "TENTATIVE"}`);
      lines.push("END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(plano: ProducaoPlano, opts?: IcsOptions) {
  const blob = new Blob([planoToICS(plano, opts)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(plano.nome || "plano").replace(/[^\w-]+/g, "_")}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}