// Minimal iCalendar (RFC5545) builder for production plans.
import type { ProducaoPlano } from "./store";

const pad = (n: number) => String(n).padStart(2, "0");
const toDate = (iso?: string) => {
  if (!iso) return null;
  // Accept "YYYY-MM-DD" or ISO datetime.
  const s = iso.length === 10 ? iso.replace(/-/g, "") : null;
  if (s) return s;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
};
const esc = (s: string) =>
  String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const nowStamp = () => {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
};

export function planoToICS(plano: ProducaoPlano): string {
  const stamp = nowStamp();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CraftBusinessMaster//Planeador//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(plano.nome)}`,
  ];
  for (const et of plano.etapas) {
    const start = toDate(et.inicio);
    const end = toDate(et.fim) ?? start;
    if (start) {
      const isAllDay = start.length === 8;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:etapa-${et.id}@cbm`);
      lines.push(`DTSTAMP:${stamp}`);
      if (isAllDay) {
        lines.push(`DTSTART;VALUE=DATE:${start}`);
        if (end) lines.push(`DTEND;VALUE=DATE:${end}`);
      } else {
        lines.push(`DTSTART:${start}`);
        if (end) lines.push(`DTEND:${end}`);
      }
      lines.push(`SUMMARY:${esc(`[Etapa] ${et.nome}`)}`);
      const desc = et.tarefas.map((t) => `• ${t.texto}${t.responsavel ? ` (${t.responsavel})` : ""}`).join("\n");
      if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);
      if (et.concluida) lines.push("STATUS:CONFIRMED");
      lines.push("END:VEVENT");
    }
    for (const t of et.tarefas) {
      const d = toDate(t.prazo);
      if (!d) continue;
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:tarefa-${t.id}@cbm`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART;VALUE=DATE:${d}`);
      lines.push(`SUMMARY:${esc(`${t.texto || "Tarefa"}${t.responsavel ? ` — ${t.responsavel}` : ""}`)}`);
      lines.push(`DESCRIPTION:${esc(`Etapa: ${et.nome}`)}`);
      const status = t.status === "feito" || t.feito ? "COMPLETED" : t.status === "em_progresso" ? "IN-PROCESS" : "NEEDS-ACTION";
      lines.push(`STATUS:${status === "COMPLETED" ? "CONFIRMED" : "TENTATIVE"}`);
      lines.push("END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(plano: ProducaoPlano) {
  const blob = new Blob([planoToICS(plano)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${(plano.nome || "plano").replace(/[^\w-]+/g, "_")}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}