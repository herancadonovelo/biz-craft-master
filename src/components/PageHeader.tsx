import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/80 p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        <h1 className="italic font-bold tracking-tight text-foreground text-3xl sm:text-4xl leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-2 italic text-base sm:text-lg text-foreground/80" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}