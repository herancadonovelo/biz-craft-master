import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import fotoSaraAvo from "@/assets/quem-somos-sara-avo.png.asset.json";

export const Route = createFileRoute("/quem-somos")({
  head: () => ({
    meta: [
      { title: "Quem Somos — Craft Business Master" },
      { name: "description", content: "A história por trás do Craft Business Master, criada por Sara Afonso — uma herança de amor pelo artesanato." },
      { property: "og:title", content: "Quem Somos — Craft Business Master" },
      { property: "og:description", content: "A história por trás do Craft Business Master, uma herança de amor pelo artesanato." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuemSomos,
});

function QuemSomos() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quem Somos"
        description="A herança e o futuro do nosso artesanato."
      />
      <article className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-[hsl(30_40%_98%)] p-6 sm:p-10 shadow-sm ring-1 ring-[hsl(30_30%_92%)]">
        <h2 className="font-display text-2xl leading-snug text-foreground">
          Quem Somos: A Herança e o Futuro do Nosso Artesanato
        </h2>

        <p className="leading-relaxed text-foreground/90">
          Sou a <strong>Sara Afonso</strong>, e para mim, cada fio que se
          entrelaça conta uma história. A minha jornada não começou hoje;
          ela é, de facto, uma herança. Cresci a ver a magia nascer das
          mãos atentas e dedicadas da minha avó e da minha bisavó, ambas
          costureiras. Foi ao lado delas que aprendi que o artesanato é
          amor materializado. Hoje, entre as laçadas do tricotin, a magia
          do amigurumi, o detalhe do croché e da costura, e no meio das
          rotinas e dos abraços das minhas duas filhas, continuo a tecer
          essa história através da minha marca, a{" "}
          <em>Herança do Novelo</em>.
        </p>

        <p className="leading-relaxed text-foreground/90">
          Mas quem vive do artesanato sabe que a paixão da criação choca,
          muitas vezes, com a dura e complexa realidade da gestão. Durante
          muito tempo, senti na pele a angústia e a frustração que tantas
          de nós partilham. Olhava para o mercado em busca de soluções e
          deparava-me com um cenário desanimador: para termos todas as
          ferramentas necessárias para organizar a nossa vida, éramos
          obrigadas a pagar várias subscrições em simultâneo, esgotando o
          nosso orçamento.
        </p>

        <p className="leading-relaxed text-foreground/90">
          E o mais triste? Todos esses programas eram sistemas frios e
          genéricos, pensados para o comércio tradicional. Nenhum deles
          compreendia verdadeiramente a alma e as necessidades de quem
          cria com as próprias mãos.
        </p>

        <p className="leading-relaxed text-foreground/90">
          Foi dessa frustração e de uma vontade profunda de cuidar da
          nossa comunidade que nasceu o{" "}
          <strong>Craft Business Master</strong>.
        </p>

        <p className="leading-relaxed text-foreground/90">
          Esta não é apenas mais uma aplicação. Tenho um orgulho imenso
          em dizer que é a <strong>primeira plataforma de gestão de negócio criada e focada exclusivamente na nossa área de trabalho</strong>. O meu objetivo foi ir muito
          mais além, desenvolvendo opções e ferramentas que simplesmente
          não existem em nenhum outro software do mercado.
        </p>

        <p className="leading-relaxed text-foreground/90">
          O Craft Business Master foi desenhado para abraçar todas as
          dimensões do teu dia a dia:
        </p>

        <ul className="space-y-3 pl-1">
          <li className="rounded-xl bg-[hsl(340_50%_96%)] p-4 leading-relaxed">
            <strong>A Gestão Descomplicada:</strong> Fim da dispersão.
            Centraliza fornecedores, custos exatos e orçamentos sem
            precisares de múltiplas ferramentas pagas.
          </li>
          <li className="rounded-xl bg-[hsl(150_35%_94%)] p-4 leading-relaxed">
            <strong>O Apoio à Criação:</strong> Não é só sobre números.
            É um espaço onde podes organizar os teus projetos, desde a
            primeira centelha de inspiração até à peça finalizada.
          </li>
          <li className="rounded-xl bg-[hsl(45_60%_94%)] p-4 leading-relaxed">
            <strong>Um Ecossistema Completo:</strong> Funcionalidades
            pensadas para usos que vão muito além de gerir e criar,
            adaptando-se a tudo o que o teu estúdio exige.
          </li>
        </ul>

        <p className="leading-relaxed text-foreground/90">
          Criei este espaço para que nunca mais te sintas perdida entre
          dezenas de papéis ou refém de sistemas que não te entendem.
          Quero devolver-te o tempo e a tranquilidade que mereces, para
          que possas focar-te naquilo que te faz verdadeiramente feliz:
          <strong> a tua arte</strong>.
        </p>

        <p className="pt-2 text-center font-display text-xl text-[hsl(340_45%_45%)]">
          Bem-vinda ao teu novo atelier digital.
        </p>

        <figure className="mx-auto flex flex-col items-center gap-3 pt-6">
          <img
            src={fotoSaraAvo.url}
            alt="Sara Afonso em criança ao lado da avó."
            loading="lazy"
            className="w-full max-w-sm rounded-2xl shadow-md ring-1 ring-black/5"
          />
          <figcaption className="text-sm italic text-muted-foreground text-center max-w-sm">
            Eu e a minha avó na altura que comecei a seguir as pizadas dela e da minha bisa avó.
          </figcaption>
        </figure>
      </article>
    </div>
  );
}