import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function chat(body: any) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { ok: false as const, error: "LOVABLE_API_KEY em falta." };
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429) return { ok: false as const, error: "Demasiados pedidos. Tenta novamente daqui a um minuto." };
  if (res.status === 402) return { ok: false as const, error: "Créditos IA esgotados." };
  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway", res.status, t);
    return { ok: false as const, error: "Erro a contactar o modelo IA." };
  }
  const json: any = await res.json();
  return { ok: true as const, json };
}

/** Sugestão de tema: paleta, fundo, elementos decorativos. */
export const sugerirTemaMoodboard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ tema: z.string().min(1).max(300) }).parse)
  .handler(async ({ data }) => {
    const r = await chat({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "És assistente de design de moodboards artesanais (tricotin, crochê, amigurumi). Respondes APENAS em JSON válido, sem markdown. Schema: {\"paleta\":[\"#hex\",\"#hex\",\"#hex\"],\"fundoSugerido\":\"nome curto (ex: Papel Kraft)\",\"fontes\":[\"Amatic SC\",\"Playfair Display\"],\"elementos\":[\"folhas secas\",\"fita laranja\",\"alfinete\"],\"descricao\":\"frase curta inspiradora\"}",
        },
        { role: "user", content: `Tema: ${data.tema}` },
      ],
    });
    if (!r.ok) return r;
    const content: string = r.json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      return { ok: true as const, sugestao: JSON.parse(clean) };
    } catch {
      return { ok: false as const, error: "Resposta inválida da IA." };
    }
  });

/** Gera 3 opções de texto criativo. */
export const gerarTextosMoodboard = createServerFn({ method: "POST" })
  .inputValidator(z.object({ topico: z.string().min(1).max(200) }).parse)
  .handler(async ({ data }) => {
    const r = await chat({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "És copywriter para moodboards artesanais em português de Portugal. Devolves APENAS JSON: {\"opcoes\":[\"...\",\"...\",\"...\"]} com 3 títulos curtos (máx 6 palavras) e criativos.",
        },
        { role: "user", content: data.topico },
      ],
    });
    if (!r.ok) return r;
    const content: string = r.json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const clean = content.replace(/```json|```/g, "").trim();
      const j = JSON.parse(clean);
      return { ok: true as const, opcoes: (j.opcoes || []).slice(0, 3) as string[] };
    } catch {
      return { ok: false as const, error: "Resposta inválida da IA." };
    }
  });

/** Crítica de composição. */
export const criticarComposicao = createServerFn({ method: "POST" })
  .inputValidator(z.object({ resumo: z.string().min(1).max(2000) }).parse)
  .handler(async ({ data }) => {
    const r = await chat({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "És diretor de arte. Em português de Portugal, dás feedback construtivo e breve (máx 5 bullets) sobre equilíbrio visual, paleta, tipografia e hierarquia de um moodboard. Sem floreados.",
        },
        { role: "user", content: `Composição atual:\n${data.resumo}` },
      ],
    });
    if (!r.ok) return r;
    return { ok: true as const, feedback: r.json?.choices?.[0]?.message?.content ?? "" };
  });

/** Sugestão contextual a partir do que está na tela. */
export const sugestaoContextual = createServerFn({ method: "POST" })
  .inputValidator(z.object({ resumo: z.string().min(1).max(2000) }).parse)
  .handler(async ({ data }) => {
    const r = await chat({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Sugere 3 melhorias curtas e acionáveis (1 linha cada) para um moodboard artesanal, em português de Portugal. Devolve só uma lista numerada simples 1. 2. 3.",
        },
        { role: "user", content: data.resumo },
      ],
    });
    if (!r.ok) return r;
    return { ok: true as const, sugestoes: r.json?.choices?.[0]?.message?.content ?? "" };
  });

/** Remove fundo de uma imagem usando Gemini image. Recebe dataURL, devolve dataURL PNG. */
export const removerFundoImagem = createServerFn({ method: "POST" })
  .inputValidator(z.object({ imagem: z.string().min(20).max(8_000_000) }).parse)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false as const, error: "LOVABLE_API_KEY em falta." };
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Remove o fundo desta imagem. Devolve apenas o sujeito principal isolado, com fundo totalmente transparente. Sem texto adicional." },
              { type: "image_url", image_url: { url: data.imagem } },
            ],
          },
        ],
      }),
    });
    if (res.status === 429) return { ok: false as const, error: "Demasiados pedidos." };
    if (res.status === 402) return { ok: false as const, error: "Créditos IA esgotados." };
    if (!res.ok) {
      const t = await res.text();
      console.error("BG remove err", res.status, t);
      return { ok: false as const, error: "Falha ao remover fundo." };
    }
    const json: any = await res.json();
    const images: any[] = json?.choices?.[0]?.message?.images || [];
    const url: string | undefined = images?.[0]?.image_url?.url;
    if (!url) return { ok: false as const, error: "Sem imagem na resposta." };
    return { ok: true as const, imagem: url };
  });