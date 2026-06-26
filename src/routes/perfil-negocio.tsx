import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImagePicker } from "@/components/ImagePicker";

export const Route = createFileRoute("/perfil-negocio")({
  head: () => ({ meta: [{ title: "Perfil do negócio" }] }),
  component: () => {
    const perfil = useStore((s) => s.perfilNegocio);
    const setPerfil = useStore((s) => s.setPerfil);
    const audit = useStore((s) => s.audit);
    const fields: { k: keyof typeof perfil; label: string }[] = [
      { k: "nome", label: "Nome do negócio" },
      { k: "slogan", label: "Slogan" },
      { k: "nif", label: "NIF" },
      { k: "morada", label: "Morada" },
      { k: "codigoPostal", label: "Código Postal" },
      { k: "cidade", label: "Cidade" },
      { k: "pais", label: "País" },
      { k: "email", label: "E-mail" },
      { k: "telefone", label: "Telefone" },
      { k: "website", label: "Website" },
      { k: "instagram", label: "Instagram" },
      { k: "iban", label: "IBAN" },
    ];
    return (
      <div className="space-y-6">
        <PageHeader title="Perfil do negócio" description="Dados que aparecem em faturas, etiquetas e exportações." />
        <Card><CardContent className="grid gap-4 p-6 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.k}>
              <Label>{f.label}</Label>
              <Input value={(perfil as any)[f.k] ?? ""} onChange={(e) => setPerfil({ [f.k]: e.target.value } as any)} />
            </div>
          ))}
          <div className="md:col-span-2">
            <Label>Logo</Label>
            <div className="mt-1"><ImagePicker value={perfil.logo} onChange={(v) => setPerfil({ logo: v })} size="h-24 w-24" /></div>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={() => { audit("atualizou perfil", "perfilNegocio", undefined, perfil.nome); toast.success("Perfil guardado"); }}>Guardar alterações</Button>
          </div>
        </CardContent></Card>
      </div>
    );
  },
});