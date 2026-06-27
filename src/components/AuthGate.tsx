import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-state";

const PUBLIC_ROUTES = ["/auth"];

export function AuthGate() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (PUBLIC_ROUTES.includes(pathname)) return;
    nav({ to: "/auth" });
  }, [user, loading, pathname, nav]);

  return null;
}