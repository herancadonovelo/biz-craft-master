import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { loadState, saveState, ok, fail } from "./_app-state";

export default defineTool({
  name: "update_todo",
  title: "Update a task",
  description: "Update fields on an existing task (title, priority, deadline, project, reminder, status).",
  inputSchema: {
    id: z.string().min(1),
    title: z.string().optional(),
    priority: z.enum(["baixa", "media", "alta"]).optional(),
    deadline: z.string().optional(),
    project_id: z.string().optional(),
    reminder: z.string().optional(),
    status: z.enum(["por_fazer", "em_progresso", "concluida"]).optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    const res = await loadState(ctx);
    if ("error" in res) return fail(res.error);
    const todos = [...((res.state.todos ?? []) as any[])];
    const idx = todos.findIndex((t) => t.id === input.id);
    if (idx < 0) return fail("Task not found.");
    const patch: any = {};
    if (input.title !== undefined) patch.titulo = input.title;
    if (input.priority !== undefined) patch.prioridade = input.priority;
    if (input.deadline !== undefined) patch.prazo = input.deadline;
    if (input.project_id !== undefined) patch.projetoId = input.project_id;
    if (input.reminder !== undefined) patch.lembrete = input.reminder;
    if (input.status !== undefined) {
      patch.estado = input.status;
      patch.feito = input.status === "concluida";
    }
    todos[idx] = { ...todos[idx], ...patch };
    const err = await saveState(res.supabase, ctx.getUserId()!, { todos }, res.state);
    if (err) return fail(err);
    return ok(todos[idx], "todo");
  },
});