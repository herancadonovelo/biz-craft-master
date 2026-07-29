import type { ReactNode } from "react";

/** Moldura minimalista em tons pastel usada nas páginas legais públicas. */
export function LegalPage({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-[hsl(30_40%_98%)] p-6 text-foreground/90 shadow-sm ring-1 ring-[hsl(30_30%_92%)] sm:p-10">
      {children}
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}