import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { listImportBatches, undoImportBatch, type CsvImportBatch } from "@/lib/csv-import-history";

function fmt(ts: number): string {
  return new Date(ts).toLocaleString();
}

export function CsvImportHistoryDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CsvImportBatch[]>([]);
  useEffect(() => { if (open) setItems(listImportBatches()); }, [open]);

  const rollback = (id: string) => {
    const r = undoImportBatch(id);
    toast.success(`Anulada: ${r.removidos} removidos · ${r.restaurados} restaurados${r.fornecedoresRemovidos ? ` · ${r.fornecedoresRemovidos} fornecedores removidos` : ""}`);
    setItems(listImportBatches());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="ghost" size="sm"><History className="mr-1 h-4 w-4" />Histórico</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="csv-history-dialog">
        <DialogHeader><DialogTitle>Histórico de importações CSV</DialogTitle></DialogHeader>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ainda não há importações registadas.</p>
        ) : (
          <ul className="space-y-2 max-h-[60vh] overflow-auto">
            {items.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 rounded border p-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{b.file ?? "colado no diálogo"}</div>
                  <div className="text-xs text-muted-foreground">{fmt(b.ts)}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge>{b.totals.novos} novos</Badge>
                    <Badge variant="secondary">{b.totals.updates} atualizados</Badge>
                    {b.totals.ignorados ? <Badge variant="destructive">{b.totals.ignorados} ignorados</Badge> : null}
                    {b.fornecedoresCriados.length ? <Badge variant="outline">{b.fornecedoresCriados.length} fornecedores</Badge> : null}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => rollback(b.id)} title="Anular importação">
                  <Undo2 className="mr-1 h-3 w-3" />Anular
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}