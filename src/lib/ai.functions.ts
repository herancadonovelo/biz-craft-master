import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z.array(MessageSchema).min(1).max(40),
      contexto: z.string().max(20000),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "LOVABLE_API_KEY em falta." };
    }

    const system = `És o assistente pessoal IA do Atelier Tricotin, um negócio artesanal de tricotin, crochê e amigurumi.
Falas sempre em português de Portugal, de forma direta, prática e com tom amigável.
Usas APENAS os dados de negócio fornecidos abaixo para responder. Quando não tens dados suficientes, dizes-o e sugeres o que registar.
Quando o utilizador pede "ordens para hoje" ou "o que fazer", devolves uma lista numerada curta e acionável baseada nos dados.
Apresentas valores monetários em euros (€) com 2 casas decimais.

DADOS DE NEGÓCIO ATUAIS:
${data.contexto}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...data.messages],
        }),
      });

      if (res.status === 429) return { ok: false as const, error: "Demasiados pedidos. Tenta novamente daqui a um minuto." };
      if (res.status === 402) return { ok: false as const, error: "Créditos IA esgotados. Adiciona créditos na tua workspace Lovable." };
      if (!res.ok) {
        const t = await res.text();
        console.error("AI gateway error", res.status, t);
        return { ok: false as const, error: "Erro a contactar o modelo IA." };
      }
      const json: any = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      return { ok: true as const, content };
    } catch (e) {
      console.error(e);
      return { ok: false as const, error: "Falha de rede ao contactar a IA." };
    }
  });