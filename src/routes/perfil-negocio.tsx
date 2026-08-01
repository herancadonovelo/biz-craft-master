import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, Phone, FileText, Brush, Hash, MapPin, Instagram, Globe, Store, ImageIcon, Pencil, Save } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v: string) => /^[+\d][\d\s().-]{5,}$/.test(v);
const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v);
const isNifPT = (v: string) => {
  const s = v.replace(/\s/g, "");
  if (!/^\d{9}$/.test(s)) return false;
  const d = s.split("").map(Number);
  const sum = d.slice(0, 8).reduce((acc, n, i) => acc + n * (9 - i), 0);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return check === d[8];
};

export const Route = createFileRoute("/perfil-negocio")({
  head: () => ({ meta: [{ title: "Perfil Pessoal & Negócio" }] }),
  component: () => {
    const perfil = useStore((s) => s.perfilNegocio);
    const setPerfil = useStore((s) => s.setPerfil);
    const audit = useStore((s) => s.audit);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(perfil);
    useEffect(() => { if (!editing) setDraft(perfil); }, [perfil, editing]);
    const update = (patch: Partial<typeof perfil>) => setDraft((d) => ({ ...d, ...patch }));

    const errors: Record<string, string> = {};
    if (draft.emailPessoal && !isEmail(draft.emailPessoal)) errors.emailPessoal = "E-mail inválido";
    if (draft.email && !isEmail(draft.email)) errors.email = "E-mail inválido";
    if (draft.telefonePessoal && !isPhone(draft.telefonePessoal)) errors.telefonePessoal = "Telemóvel inválido";
    if (draft.telefone && !isPhone(draft.telefone)) errors.telefone = "Telefone inválido";
    if (draft.nif && !isNifPT(draft.nif)) errors.nif = "NIF inválido (9 dígitos)";
    if (draft.website && !isUrl(draft.website)) errors.website = "URL inválido (https://…)";
    if (draft.pinterest && !isUrl(draft.pinterest)) errors.pinterest = "URL inválido (https://…)";
    if (draft.lojaOnline && !isUrl(draft.lojaOnline)) errors.lojaOnline = "URL inválido (https://…)";
    const hasErrors = Object.keys(errors).length > 0;

    const save = () => {
      if (hasErrors) { toast.error("Corrige os campos inválidos antes de guardar"); return; }
      setPerfil(draft);
      audit("atualizou perfil", "perfilNegocio", undefined, draft.nome);
      setEditing(false);
      toast.success("Perfil guardado");
    };
    const cancel = () => { setDraft(perfil); setEditing(false); };

    const Field = ({ icon, label, children, error }: { icon: ReactNode; label: string; children: ReactNode; error?: string }) => (
      <div>
        <Label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{icon}</span>{label}
        </Label>
        <div className="mt-1">{children}</div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    );
    const Actions = () => (
      <div className="flex justify-end gap-2">
        {!editing ? (
          <Button onClick={() => setEditing(true)} variant="outline"><Pencil className="mr-1.5 h-4 w-4" />Editar</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={cancel}>Cancelar</Button>
            <Button onClick={save} disabled={hasErrors}><Save className="mr-1.5 h-4 w-4" />Guardar alterações</Button>
          </>
        )}
      </div>
    );
    const ro = !editing;
    return (
      <div className="space-y-6">
        <PageHeader title="Cartão de Visita: Criadora & Ateliê" description="A artesã por trás da marca e a identidade do atelier." />
        <Tabs defaultValue="pessoal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="pessoal"><User className="mr-1.5 h-4 w-4" />Perfil Pessoal</TabsTrigger>
            <TabsTrigger value="negocio"><Brush className="mr-1.5 h-4 w-4" />Perfil de Negócio</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoal">
            <Card><CardContent className="space-y-5 p-6">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
                <ImagePicker
                  value={draft.fotoPerfil}
                  onChange={(v) => editing && update({ fotoPerfil: v })}
                  shape="round"
                  size="h-28 w-28"
                />
                <p className="text-xs text-muted-foreground">Foto de perfil — visível no cabeçalho e exportações.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<User className="h-4 w-4" />} label="Nome Profissional">
                  <Input readOnly={ro} value={draft.nomeProfissional ?? ""} onChange={(e) => update({ nomeProfissional: e.target.value })} placeholder="Ex: Maria Silva" />
                </Field>
                <Field icon={<Mail className="h-4 w-4" />} label="E-mail" error={errors.emailPessoal}>
                  <Input readOnly={ro} type="email" value={draft.emailPessoal ?? ""} onChange={(e) => update({ emailPessoal: e.target.value })} aria-invalid={!!errors.emailPessoal} />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Telemóvel" error={errors.telefonePessoal}>
                  <Input readOnly={ro} value={draft.telefonePessoal ?? ""} onChange={(e) => update({ telefonePessoal: e.target.value })} aria-invalid={!!errors.telefonePessoal} />
                </Field>
              </div>
              <Field icon={<FileText className="h-4 w-4" />} label="Sobre mim / Biografia">
                <Textarea readOnly={ro} rows={6} value={draft.bio ?? ""} onChange={(e) => update({ bio: e.target.value })} placeholder="Conta a tua história no artesanato…" />
              </Field>
              <Actions />
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="negocio">
            <Card><CardContent className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<Brush className="h-4 w-4" />} label="Nome do Atelier / Marca">
                  <Input readOnly={ro} value={draft.nome ?? ""} onChange={(e) => update({ nome: e.target.value })} placeholder="Ex: Herança do Novelo" />
                </Field>
                <Field icon={<FileText className="h-4 w-4" />} label="Slogan">
                  <Input readOnly={ro} value={draft.slogan ?? ""} onChange={(e) => update({ slogan: e.target.value })} />
                </Field>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 text-sm"><ImageIcon className="h-4 w-4 text-muted-foreground" />Logótipo do Atelier</Label>
                <div className="mt-2 flex items-center gap-4">
                  <ImagePicker value={draft.logo} onChange={(v) => editing && update({ logo: v })} size="h-24 w-24" />
                  <p className="text-xs text-muted-foreground">PNG transparente recomendado. Usado automaticamente como marca de água em todos os editores técnicos.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<Hash className="h-4 w-4" />} label="NIF" error={errors.nif}>
                  <Input readOnly={ro} value={draft.nif ?? ""} onChange={(e) => update({ nif: e.target.value })} aria-invalid={!!errors.nif} inputMode="numeric" maxLength={9} />
                </Field>
                <Field icon={<Mail className="h-4 w-4" />} label="E-mail do negócio" error={errors.email}>
                  <Input readOnly={ro} type="email" value={draft.email ?? ""} onChange={(e) => update({ email: e.target.value })} aria-invalid={!!errors.email} />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Telefone do negócio" error={errors.telefone}>
                  <Input readOnly={ro} value={draft.telefone ?? ""} onChange={(e) => update({ telefone: e.target.value })} aria-invalid={!!errors.telefone} />
                </Field>
                <Field icon={<Hash className="h-4 w-4" />} label="IBAN">
                  <Input readOnly={ro} value={draft.iban ?? ""} onChange={(e) => update({ iban: e.target.value })} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<MapPin className="h-4 w-4" />} label="Morada Fiscal">
                  <Input readOnly={ro} value={draft.morada ?? ""} onChange={(e) => update({ morada: e.target.value })} />
                </Field>
                <Field icon={<MapPin className="h-4 w-4" />} label="Código Postal">
                  <Input readOnly={ro} value={draft.codigoPostal ?? ""} onChange={(e) => update({ codigoPostal: e.target.value })} />
                </Field>
                <Field icon={<MapPin className="h-4 w-4" />} label="Cidade">
                  <Input readOnly={ro} value={draft.cidade ?? ""} onChange={(e) => update({ cidade: e.target.value })} />
                </Field>
                <Field icon={<Globe className="h-4 w-4" />} label="País">
                  <Input readOnly={ro} value={draft.pais ?? ""} onChange={(e) => update({ pais: e.target.value })} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<Globe className="h-4 w-4" />} label="Website" error={errors.website}>
                  <Input readOnly={ro} value={draft.website ?? ""} onChange={(e) => update({ website: e.target.value })} placeholder="https://…" aria-invalid={!!errors.website} />
                </Field>
                <Field icon={<Instagram className="h-4 w-4" />} label="Instagram">
                  <Input readOnly={ro} value={draft.instagram ?? ""} onChange={(e) => update({ instagram: e.target.value })} placeholder="@atelier" />
                </Field>
                <Field icon={<Globe className="h-4 w-4" />} label="Pinterest" error={errors.pinterest}>
                  <Input readOnly={ro} value={draft.pinterest ?? ""} onChange={(e) => update({ pinterest: e.target.value })} placeholder="https://pinterest.com/…" aria-invalid={!!errors.pinterest} />
                </Field>
                <Field icon={<Store className="h-4 w-4" />} label="Loja Online" error={errors.lojaOnline}>
                  <Input readOnly={ro} value={draft.lojaOnline ?? ""} onChange={(e) => update({ lojaOnline: e.target.value })} placeholder="https://…" aria-invalid={!!errors.lojaOnline} />
                </Field>
              </div>

              <Actions />
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
});