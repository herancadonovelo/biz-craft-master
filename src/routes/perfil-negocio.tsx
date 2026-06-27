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
import { User, Mail, Phone, FileText, Brush, Hash, MapPin, Instagram, Globe, Store, ImageIcon } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/perfil-negocio")({
  head: () => ({ meta: [{ title: "Perfil Pessoal & Negócio" }] }),
  component: () => {
    const perfil = useStore((s) => s.perfilNegocio);
    const setPerfil = useStore((s) => s.setPerfil);
    const audit = useStore((s) => s.audit);
    const save = () => {
      audit("atualizou perfil", "perfilNegocio", undefined, perfil.nome);
      toast.success("Perfil guardado");
    };
    const Field = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
      <div>
        <Label className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{icon}</span>{label}
        </Label>
        <div className="mt-1">{children}</div>
      </div>
    );
    return (
      <div className="space-y-6">
        <PageHeader title="Perfil Pessoal & Negócio" description="A artesã por trás da marca e a identidade do atelier." />
        <Tabs defaultValue="pessoal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="pessoal"><User className="mr-1.5 h-4 w-4" />Perfil Pessoal</TabsTrigger>
            <TabsTrigger value="negocio"><Brush className="mr-1.5 h-4 w-4" />Perfil de Negócio</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoal">
            <Card><CardContent className="space-y-5 p-6">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
                <ImagePicker
                  value={perfil.fotoPerfil}
                  onChange={(v) => setPerfil({ fotoPerfil: v })}
                  shape="round"
                  size="h-28 w-28"
                />
                <p className="text-xs text-muted-foreground">Foto de perfil — visível no cabeçalho e exportações.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<User className="h-4 w-4" />} label="Nome Profissional">
                  <Input value={perfil.nomeProfissional ?? ""} onChange={(e) => setPerfil({ nomeProfissional: e.target.value })} placeholder="Ex: Maria Silva" />
                </Field>
                <Field icon={<Mail className="h-4 w-4" />} label="E-mail">
                  <Input type="email" value={perfil.emailPessoal ?? ""} onChange={(e) => setPerfil({ emailPessoal: e.target.value })} />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Telemóvel">
                  <Input value={perfil.telefonePessoal ?? ""} onChange={(e) => setPerfil({ telefonePessoal: e.target.value })} />
                </Field>
              </div>
              <Field icon={<FileText className="h-4 w-4" />} label="Sobre mim / Biografia">
                <Textarea rows={6} value={perfil.bio ?? ""} onChange={(e) => setPerfil({ bio: e.target.value })} placeholder="Conta a tua história no artesanato…" />
              </Field>
              <div className="flex justify-end">
                <Button onClick={save}>Guardar alterações</Button>
              </div>
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="negocio">
            <Card><CardContent className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<Brush className="h-4 w-4" />} label="Nome do Atelier / Marca">
                  <Input value={perfil.nome ?? ""} onChange={(e) => setPerfil({ nome: e.target.value })} placeholder="Ex: Herança do Novelo" />
                </Field>
                <Field icon={<FileText className="h-4 w-4" />} label="Slogan">
                  <Input value={perfil.slogan ?? ""} onChange={(e) => setPerfil({ slogan: e.target.value })} />
                </Field>
              </div>

              <div>
                <Label className="flex items-center gap-1.5 text-sm"><ImageIcon className="h-4 w-4 text-muted-foreground" />Logótipo do Atelier</Label>
                <div className="mt-2 flex items-center gap-4">
                  <ImagePicker value={perfil.logo} onChange={(v) => setPerfil({ logo: v })} size="h-24 w-24" />
                  <p className="text-xs text-muted-foreground">PNG transparente recomendado. Usado automaticamente como marca de água em todos os editores técnicos.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<Hash className="h-4 w-4" />} label="NIF">
                  <Input value={perfil.nif ?? ""} onChange={(e) => setPerfil({ nif: e.target.value })} />
                </Field>
                <Field icon={<Mail className="h-4 w-4" />} label="E-mail do negócio">
                  <Input type="email" value={perfil.email ?? ""} onChange={(e) => setPerfil({ email: e.target.value })} />
                </Field>
                <Field icon={<Phone className="h-4 w-4" />} label="Telefone do negócio">
                  <Input value={perfil.telefone ?? ""} onChange={(e) => setPerfil({ telefone: e.target.value })} />
                </Field>
                <Field icon={<Hash className="h-4 w-4" />} label="IBAN">
                  <Input value={perfil.iban ?? ""} onChange={(e) => setPerfil({ iban: e.target.value })} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<MapPin className="h-4 w-4" />} label="Morada Fiscal">
                  <Input value={perfil.morada ?? ""} onChange={(e) => setPerfil({ morada: e.target.value })} />
                </Field>
                <Field icon={<MapPin className="h-4 w-4" />} label="Código Postal">
                  <Input value={perfil.codigoPostal ?? ""} onChange={(e) => setPerfil({ codigoPostal: e.target.value })} />
                </Field>
                <Field icon={<MapPin className="h-4 w-4" />} label="Cidade">
                  <Input value={perfil.cidade ?? ""} onChange={(e) => setPerfil({ cidade: e.target.value })} />
                </Field>
                <Field icon={<Globe className="h-4 w-4" />} label="País">
                  <Input value={perfil.pais ?? ""} onChange={(e) => setPerfil({ pais: e.target.value })} />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field icon={<Globe className="h-4 w-4" />} label="Website">
                  <Input value={perfil.website ?? ""} onChange={(e) => setPerfil({ website: e.target.value })} placeholder="https://…" />
                </Field>
                <Field icon={<Instagram className="h-4 w-4" />} label="Instagram">
                  <Input value={perfil.instagram ?? ""} onChange={(e) => setPerfil({ instagram: e.target.value })} placeholder="@atelier" />
                </Field>
                <Field icon={<Globe className="h-4 w-4" />} label="Pinterest">
                  <Input value={perfil.pinterest ?? ""} onChange={(e) => setPerfil({ pinterest: e.target.value })} placeholder="https://pinterest.com/…" />
                </Field>
                <Field icon={<Store className="h-4 w-4" />} label="Loja Online">
                  <Input value={perfil.lojaOnline ?? ""} onChange={(e) => setPerfil({ lojaOnline: e.target.value })} placeholder="https://…" />
                </Field>
              </div>

              <div className="flex justify-end">
                <Button onClick={save}>Guardar alterações</Button>
              </div>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
});