import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-state";
import { CloudOff } from "lucide-react";

export function AuthBanner() {
  const { user, loading } = useAuth();
  if (loading || user) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-300/40 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <span className="flex items-center gap-2">
        <CloudOff className="h-3.5 w-3.5" />
        Estás a usar a app em modo local. <strong>Inicia sessão</strong> para guardar e sincronizar os teus dados em qualquer dispositivo.
      </span>
      <Link to="/auth" className="rounded-md bg-amber-900 px-3 py-1 font-medium text-amber-50 hover:bg-amber-800">
        Entrar / Registar
      </Link>
    </div>
  );
}