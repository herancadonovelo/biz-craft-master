# Plano de implementação

---

## Backlog Editor Tricotin/i-cord (a implementar por fases)

Feito nesta iteração: **Lettering — Auto-script + Kerning + Text on Path** (linha reta, arco, círculo) com guia visual e exportação PNG/A4.

### Fila (por ordem sugerida de entrega)
1. **Vetorização + Exportação SVG/DXF + E2E**
   - Ferramenta Trace (imagem → linha única via Ramer-Douglas-Peucker + skeletonization).
   - Exportação SVG/DXF garantindo `polyline` única contínua.
   - Testes Playwright: upload imagem, verificar 1 único path exportado, validar comprimento.
2. **Webhook Twilio de entregas**
   - `/api/public/webhooks/twilio-status` com verificação de assinatura X-Twilio-Signature.
   - Persistir em `webhook_events` com provider="twilio".
   - `/auth/verify-2fa` faz poll de estado (queued/sent/delivered/failed) e mostra badge.
3. **Desenho: Single Line + Smoothing + Medial Axis**
   - Caneta contínua, suavização automática, esqueleto de formas fechadas.
4. **Simulação de volume**
   - Diâmetro do cordão (8/10/12mm), textura de lã (bump), Ghost View (linha central), Offset de margem.
5. **Guias de produção**
   - Setas de direção numeradas, cruzamentos over/under, alerta de ângulos críticos, marcadores início/fim.
6. **Cálculos automáticos**
   - Estimador de lã, redimensionamento proporcional, calculadora de custo material.
7. **Camadas + Snap + Mirror**
   - Layers, snap-to-object, duplicação simétrica.
8. **Impressão avançada**
   - Tiling A4, escala 1:1 auditada, modo economia de tinta.
9. **Vetorial avançado**
   - Boolean fusão, Mesh Warp, offset dinâmico, tangência automática, parametrização de curvas.
10. **Simulação física**
    - Análise de tensão (efeito mola), centro de gravidade, renderização foto, mapeamento textura curvilínea.
11. **Exportação industrial**
    - G-Code para CNC, nesting otimizado, metadados de rastreabilidade, perfis CMYK têxtil.
12. **Nuvem**
    - Catálogo de templates partilhados, paletas de marcas reais.

Cada fase entrega: código + testes E2E + docs mínimas no editor.

---

## Plano original abaixo


Duas frentes independentes, entregues na mesma vaga. Cada uma tem testes E2E próprios.

---

## Parte A — 2FA obrigatório (Supabase Phone Auth nativo)

Fluxo: email/password → se `profiles.phone_verified = false` → força enrolamento de telemóvel → envia OTP SMS → valida → cria sessão "2FA-completa". Utilizadores existentes ficam bloqueados no próximo login até associarem telemóvel.

### Schema (migração)
- `profiles`: adicionar `phone TEXT`, `phone_verified BOOLEAN DEFAULT false`, `phone_verified_at TIMESTAMPTZ`, `last_2fa_at TIMESTAMPTZ`.
- Tabela `auth_otp_attempts` (rate-limit / lockout): `user_id`, `kind` (login|enroll), `attempted_at`, `success`. RLS: só o próprio user lê; INSERT via server fn.
- RPC `mark_phone_verified(_phone text)` SECURITY DEFINER: grava telemóvel + `phone_verified=true` no profile do `auth.uid()`.
- Trigger em `auth.users` — NÃO tocamos (schema auth é intocável). Em vez disso, `AuthGate` faz o check pós-login.

### Server functions (`src/lib/auth-2fa.functions.ts` — thin wrapper)
- `sendLoginOtpFn({ phone? })` — usa `supabaseAdmin.auth.admin` para enviar OTP SMS via Supabase Phone Auth. Rate-limit: máx 3 envios / 10min por user (consulta `auth_otp_attempts`).
- `verifyLoginOtpFn({ token })` — chama `supabase.auth.verifyOtp({ type: 'sms' })`, marca `last_2fa_at`, retorna sessão.
- `sendPhoneEnrollOtpFn({ phone })` — para enrolamento inicial ou troca de número. Validação E.164.
- `confirmPhoneEnrollFn({ phone, token })` — verifica OTP e chama `mark_phone_verified`.

Erros amigáveis mapeados: `invalid_otp`, `expired_otp`, `rate_limited`, `sms_provider_offline`, `phone_invalid_format`, `phone_already_taken`. Helper `mapOtpError(e)` em `src/lib/auth-2fa.server.ts`.

### UI
- **`/auth/verify-2fa`** (rota pública): input 6 dígitos (auto-advance + paste), contador de reenvio 60s, botão "Reenviar código", link "Trocar de número" (só se `phone_verified=false`). Bloqueia navegação para outras rotas até verificar.
- **`AuthGate`**: após login, se `phone_verified=false` → `/auth/verify-2fa?enroll=1` (mostra input de telemóvel primeiro). Se `phone_verified=true` mas sem `last_2fa_at` na sessão atual → mesma rota sem `enroll`.
- **`/configuracoes` → Segurança & Conta**: novo bloco "Número de telemóvel (WhatsApp / 2FA)" com input + botão "Enviar código" + input OTP + "Confirmar". Mostra número atual mascarado (`+351 •• •• 406`).

### Config
- Documentar em chat que o user precisa activar Phone provider no Supabase Auth (dashboard interno da Cloud) e configurar Twilio/MessageBird lá — sem código.

### Testes E2E
- `e2e/2fa-enroll-forced.spec.ts`: user existente sem telemóvel → é redirecionado para enrolamento após login; não consegue chegar a `/dashboard` até verificar.
- `e2e/2fa-otp-resend-lockout.spec.ts`: reenviar antes do contador → bloqueado; 5 tentativas erradas → mensagem de lockout.
- `e2e/2fa-happy-path.spec.ts`: user com telemóvel → recebe OTP mock → verifica → chega ao dashboard. (Usa hook de dev que expõe OTP no header em ambiente de teste.)

---

## Parte B — Hardening do i18n (erro serverFn 500-char)

### B1. Erro detalhado no runtime
- `translateBatch` retorna, quando falha validação, `{ ok: false, error: 'string_too_long', offending: [{ index, length, preview }] }` em vez de crashar.
- Cliente (`src/lib/i18n.ts` — `translateStrings`) captura e loga: `[i18n] String too long — key="quem-somos.paragrafo3", ns="page", file="src/routes/quem-somos.tsx", length=1247, limit=5000`. Toast dev-only.
- Para isto, o wrapper `t()` que chama `translateStrings` passa metadata `{ key, ns, source }` num Map paralelo aos strings enviados.

### B2. Split automático transparente
- Novo helper `splitLongString(s, limit=4800)` corta em chunks respeitando limites de frase (`. `, `\n\n`, `\n`, espaço).
- `translateStrings` deteta strings > limit, envia como N entradas numeradas `key__part_1`, `key__part_2`… e recombina no cache com `.join(' ')` antes de devolver.
- Transparente para os componentes — recebem uma única string traduzida.

### B3. Validação build-time
- Script `scripts/i18n-length-check.mjs`: percorre `src/lib/i18n.ts` dicionário PT/EN + strings literais em `<Trans>` / `t()` + conteúdos JSX longos em rotas listadas. Falha com exit 1 se algum string > 5000 chars, imprimindo `key`, `file:line`, comprimento.
- `package.json`: `"i18n:check": "node scripts/i18n-length-check.mjs"`.
- `.github/workflows/i18n-audit.yml`: adicionar step `bun run i18n:check` ao job existente.

### B4. E2E fresh-account
- `e2e/i18n-no-serverfn-errors.spec.ts`: cria conta descartável → percorre `/quem-somos`, `/planos`, `/configuracoes`, `/dashboard` em PT e EN → afirma zero requests para `/_serverFn/*` com status 400/500 → afirma zero `console.error` matching `too_big|String must contain`.

---

## Detalhes técnicos

**Ficheiros novos**
```
src/lib/auth-2fa.functions.ts
src/lib/auth-2fa.server.ts
src/routes/auth.verify-2fa.tsx
scripts/i18n-length-check.mjs
e2e/2fa-enroll-forced.spec.ts
e2e/2fa-otp-resend-lockout.spec.ts
e2e/2fa-happy-path.spec.ts
e2e/i18n-no-serverfn-errors.spec.ts
```

**Ficheiros editados**
```
src/lib/translate.functions.ts   (error shape rico)
src/lib/i18n.ts                  (split, metadata, log detalhado)
src/components/AuthGate.tsx      (gate 2FA)
src/routes/configuracoes.tsx     (bloco telemóvel + OTP)
src/routes/auth.tsx              (banner "verifica telemóvel")
package.json                     (i18n:check script)
.github/workflows/i18n-audit.yml (step novo)
```

**Migração SQL** (schema-only; RLS + GRANTs em cada tabela nova).

**Não incluído** (fora do pedido explícito):
- Recovery codes para 2FA (posso adicionar depois se pedires).
- TOTP/Authenticator app — só SMS conforme decisão.

---

Confirmas para eu implementar? Assim que aprovares, entrego tudo numa passagem.
