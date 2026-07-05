import { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

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
  const overrideFont = design.fontesPorPagina?.[pathname];
  const fontFamily = overrideFont || design.fonteCabecalho || "'Playfair Display', Georgia, serif";
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
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}