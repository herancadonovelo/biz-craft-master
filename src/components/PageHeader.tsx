import { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { FONTS } from "@/lib/fonts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Type } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const pathname = useLocation({ select: (l) => l.pathname });
  const design = useStore((s) => s.design);
  const setDesign = useStore((s) => s.setDesign);
  const overrideFont = design.fontesPorPagina?.[pathname];
  const fontFamily = overrideFont || "'Playfair Display', Georgia, serif";
  const setFont = (v: string) => {
    const next = { ...(design.fontesPorPagina || {}) };
    if (v) next[pathname] = v; else delete next[pathname];
    setDesign({ fontesPorPagina: next });
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div style={{ fontFamily }}>
        <h1 className="italic font-bold tracking-tight text-foreground text-3xl sm:text-4xl leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 italic text-base sm:text-lg text-foreground/80" style={{ fontFamily }}>
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" title="Tipo de letra desta página">
              <Type className="mr-1 h-4 w-4" />Letra
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 space-y-2">
            <p className="text-xs text-muted-foreground">Tipo de letra desta página</p>
            <select
              className="w-full rounded-md border border-input bg-background p-2 text-sm"
              value={overrideFont || ""}
              onChange={(e) => setFont(e.target.value)}
            >
              <option value="">Predefinido (Playfair Display)</option>
              {FONTS.map((f) => (
                <option key={f.v} value={f.v} style={{ fontFamily: f.v }}>{f.name}</option>
              ))}
            </select>
            {overrideFont && (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => setFont("")}>
                Repor predefinição
              </Button>
            )}
          </PopoverContent>
        </Popover>
        {actions}
      </div>
    </div>
  );
}