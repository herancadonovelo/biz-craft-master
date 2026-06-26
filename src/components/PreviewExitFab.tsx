import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { exitPreviewMode, usePreviewMode } from "@/lib/preview-mode";
import { toast } from "sonner";

export function PreviewExitFab() {
  const active = usePreviewMode();
  if (!active) return null;
  return (
    <Button
      onClick={() => {
        exitPreviewMode();
        toast.success("Modo Preview desativado — os teus dados reais foram restaurados");
      }}
      className="fixed bottom-16 right-3 z-50 h-11 rounded-full bg-amber-500 px-4 text-white shadow-lg hover:bg-amber-600"
      size="sm"
    >
      <LogOut className="mr-1.5 h-4 w-4" />
      Sair do Preview
    </Button>
  );
}