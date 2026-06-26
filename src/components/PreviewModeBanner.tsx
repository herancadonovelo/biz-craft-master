import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";
import { exitPreviewMode, usePreviewMode } from "@/lib/preview-mode";
import { toast } from "sonner";

export function PreviewModeBanner() {
  const active = usePreviewMode();
  if (!active) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="font-medium">Modo Preview ativo</span>
        <span className="hidden text-amber-800/80 dark:text-amber-200/80 sm:inline">
          · estás a ver dados de demonstração. Nada é guardado na tua conta nem na nuvem.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-amber-500/60 bg-background/60"
        onClick={() => {
          exitPreviewMode();
          toast.success("Modo Preview desativado — os teus dados reais foram restaurados");
        }}
      >
        <X className="mr-1 h-3.5 w-3.5" /> Sair do Preview
      </Button>
    </div>
  );
}