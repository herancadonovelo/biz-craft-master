import { useEffect } from "react";
import { useStore, type Todo } from "@/lib/store";

const NOTIFIED_KEY = "todo-notified-v1";

const loadNotified = (): Record<string, number> => {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "{}"); } catch { return {}; }
};
const saveNotified = (v: Record<string, number>) => {
  try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify(v)); } catch {}
};

export async function requestTodoNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  if (Notification.permission === "denied") return "denied" as const;
  try { return await Notification.requestPermission(); } catch { return "denied" as const; }
}

const notify = (title: string, body: string) => {
  try {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  } catch {}
};

const estadoDe = (t: Todo) =>
  t.estado ?? (t.feito ? "concluida" : "por_fazer");

function checkAll(todos: Todo[]) {
  const now = Date.now();
  const rec = loadNotified();
  let changed = false;
  todos.forEach((t) => {
    if (estadoDe(t) === "concluida") return;
    // Reminder
    if (t.lembrete) {
      const key = `${t.id}:lembrete:${t.lembrete}`;
      const time = new Date(t.lembrete).getTime();
      if (!isNaN(time) && time <= now && !rec[key]) {
        notify("Lembrete de tarefa", t.titulo);
        rec[key] = now; changed = true;
      }
    }
    // Due date (once per day of prazo)
    if (t.prazo) {
      const key = `${t.id}:prazo:${t.prazo}`;
      const time = new Date(t.prazo + "T09:00:00").getTime();
      if (!isNaN(time) && time <= now && !rec[key]) {
        notify("Tarefa a vencer", t.titulo);
        rec[key] = now; changed = true;
      }
    }
  });
  if (changed) saveNotified(rec);
}

export function useTodoNotifications() {
  const todos = useStore((s) => s.todos);
  useEffect(() => {
    checkAll(todos);
    const id = setInterval(() => checkAll(todos), 60_000);
    return () => clearInterval(id);
  }, [todos]);
}