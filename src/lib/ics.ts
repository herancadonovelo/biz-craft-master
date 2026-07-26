// Minimal iCalendar (RFC5545) builder for production plans.
import type { ProducaoPlano, EtapaProducao } from "./store";

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
const unesc = (s: string) =>
  String(s ?? "").replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");

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
      lines.push(`X-CBM-KIND:etapa`);
      lines.push(`X-CBM-ETAPA-ID:${et.id}`);
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
      lines.push(`X-CBM-KIND:tarefa`);
      lines.push(`X-CBM-ETAPA-ID:${et.id}`);
      lines.push(`X-CBM-ETAPA-NOME:${esc(et.nome)}`);
      if (t.responsavel) lines.push(`X-CBM-RESPONSAVEL:${esc(t.responsavel)}`);
      lines.push(`X-CBM-STATUS:${t.status ?? (t.feito ? "feito" : "nao_iniciado")}`);
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

// ---------- Parser ----------

export interface ParsedIcsEvent {
  uid?: string;
  summary?: string;
  description?: string;
  dtstart?: string; // YYYY-MM-DD
  dtend?: string;   // YYYY-MM-DD (exclusive)
  tzid?: string;
  kind?: "etapa" | "tarefa" | "external";
  etapaId?: string;
  etapaNome?: string;
  responsavel?: string;
  status?: "nao_iniciado" | "em_progresso" | "feito";
}

export interface ParsedIcs {
  calname?: string;
  timezone?: string;
  events: ParsedIcsEvent[];
}

const yyyymmddToIso = (s?: string) => {
  if (!s) return undefined;
  const m = s.match(/^(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
};
const shiftIso = (iso: string, days: number) => {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + days));
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
};

export function parseICS(text: string): ParsedIcs {
  // Unfold RFC5545 continuation lines (CRLF + space/tab).
  const unfolded = String(text).replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const out: ParsedIcs = { events: [] };
  let cur: (ParsedIcsEvent & { _dtendInclusive?: boolean }) | null = null;
  for (const raw of lines) {
    if (!raw) continue;
    if (raw === "BEGIN:VEVENT") { cur = {}; continue; }
    if (raw === "END:VEVENT") {
      if (cur) {
        if (!cur.kind) cur.kind = "external";
        out.events.push(cur);
      }
      cur = null;
      continue;
    }
    const idx = raw.indexOf(":");
    if (idx < 0) continue;
    const head = raw.slice(0, idx);
    const value = raw.slice(idx + 1);
    const [name, ...params] = head.split(";");
    const tzidParam = params.find((p) => p.toUpperCase().startsWith("TZID="));
    const tzid = tzidParam ? tzidParam.split("=")[1] : undefined;
    if (!cur) {
      if (name === "X-WR-CALNAME") out.calname = unesc(value);
      else if (name === "X-WR-TIMEZONE") out.timezone = unesc(value);
      continue;
    }
    switch (name) {
      case "UID": cur.uid = value; break;
      case "SUMMARY": cur.summary = unesc(value); break;
      case "DESCRIPTION": cur.description = unesc(value); break;
      case "DTSTART": cur.dtstart = yyyymmddToIso(value); if (tzid) cur.tzid = tzid; break;
      case "DTEND": cur.dtend = yyyymmddToIso(value); break;
      case "X-CBM-KIND":
        if (value === "etapa" || value === "tarefa") cur.kind = value;
        break;
      case "X-CBM-ETAPA-ID": cur.etapaId = value; break;
      case "X-CBM-ETAPA-NOME": cur.etapaNome = unesc(value); break;
      case "X-CBM-RESPONSAVEL": cur.responsavel = unesc(value); break;
      case "X-CBM-STATUS":
        if (value === "nao_iniciado" || value === "em_progresso" || value === "feito") cur.status = value;
        break;
    }
  }
  return out;
}

export interface ApplyIcsResult {
  etapasCriadas: number;
  etapasAtualizadas: number;
  tarefasCriadas: number;
  tarefasAtualizadas: number;
  ignoradas: number;
}

/**
 * Applies parsed ICS events to a plan, preserving etapa/responsável/status.
 * - Round-trip events (UID matches `etapa-<id>@cbm` / `tarefa-<id>@cbm` or X-CBM-KIND set)
 *   update the matching etapa/tarefa in place.
 * - Unknown events land in an "Importado do calendário" etapa as new tasks.
 */
export function applyIcsToPlano(
  plano: ProducaoPlano,
  parsed: ParsedIcs,
): { plano: ProducaoPlano; result: ApplyIcsResult } {
  const uid = () => Math.random().toString(36).slice(2, 10);
  const result: ApplyIcsResult = {
    etapasCriadas: 0, etapasAtualizadas: 0,
    tarefasCriadas: 0, tarefasAtualizadas: 0, ignoradas: 0,
  };
  const etapas: EtapaProducao[] = plano.etapas.map((e) => ({ ...e, tarefas: e.tarefas.map((t) => ({ ...t })) }));
  const findEtapaById = (id?: string) => (id ? etapas.find((e) => e.id === id) : undefined);
  const findOrCreateEtapaByName = (nome: string) => {
    let e = etapas.find((x) => x.nome.trim().toLowerCase() === nome.trim().toLowerCase());
    if (!e) {
      e = { id: uid(), nome, concluida: false, tarefas: [] };
      etapas.push(e);
      result.etapasCriadas++;
    }
    return e;
  };

  for (const ev of parsed.events) {
    // Derive kind from UID when X- header is missing.
    const uidStr = ev.uid ?? "";
    const etapaUid = uidStr.match(/^etapa-([\w-]+)@cbm/);
    const tarefaUid = uidStr.match(/^tarefa-([\w-]+)@cbm/);
    const kind = ev.kind ?? (etapaUid ? "etapa" : tarefaUid ? "tarefa" : "external");

    if (kind === "etapa") {
      const id = ev.etapaId ?? etapaUid?.[1];
      const et = findEtapaById(id);
      const fim = ev.dtend ? shiftIso(ev.dtend, -1) : undefined;
      if (et) {
        et.inicio = ev.dtstart ?? et.inicio;
        et.fim = fim ?? et.fim;
        if (ev.summary) et.nome = ev.summary.replace(/^\[Etapa\]\s*/i, "") || et.nome;
        result.etapasAtualizadas++;
      } else {
        etapas.push({
          id: id ?? uid(),
          nome: (ev.summary ?? "Etapa").replace(/^\[Etapa\]\s*/i, ""),
          inicio: ev.dtstart, fim,
          concluida: false, tarefas: [],
        });
        result.etapasCriadas++;
      }
      continue;
    }

    if (kind === "tarefa") {
      const tid = tarefaUid?.[1];
      const owningEtapa = findEtapaById(ev.etapaId)
        ?? (ev.etapaNome ? findOrCreateEtapaByName(ev.etapaNome) : findOrCreateEtapaByName("Importado do calendário"));
      const texto = (ev.summary ?? "Tarefa").replace(/\s+—\s+.+$/, "");
      const status = ev.status ?? "nao_iniciado";
      const existing = tid ? owningEtapa.tarefas.find((t) => t.id === tid) : undefined;
      if (existing) {
        existing.texto = texto || existing.texto;
        existing.prazo = ev.dtstart ?? existing.prazo;
        if (ev.responsavel !== undefined) existing.responsavel = ev.responsavel || undefined;
        existing.status = status;
        existing.feito = status === "feito";
        result.tarefasAtualizadas++;
      } else {
        owningEtapa.tarefas.push({
          id: tid ?? uid(),
          texto, prazo: ev.dtstart,
          responsavel: ev.responsavel,
          status, feito: status === "feito",
        });
        result.tarefasCriadas++;
      }
      continue;
    }

    // External VEVENT: create task in bucket etapa.
    if (!ev.dtstart && !ev.summary) { result.ignoradas++; continue; }
    const bucket = findOrCreateEtapaByName("Importado do calendário");
    bucket.tarefas.push({
      id: uid(),
      texto: ev.summary || "Evento importado",
      prazo: ev.dtstart,
      status: "nao_iniciado",
      feito: false,
    });
    result.tarefasCriadas++;
  }

  return { plano: { ...plano, etapas }, result };
}