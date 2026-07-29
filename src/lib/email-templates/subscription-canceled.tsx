import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { EmailBrandingFooter } from './_footer'
import type { TemplateEntry } from './registry'
import { main, container, h1, text, button, footer } from './_billing-styles'

interface Props {
  planoNome?: string
  fimAcesso?: string
  appUrl?: string
}

export const SubscriptionCanceledEmail = ({
  planoNome = 'Premium',
  fimAcesso = '',
  appUrl = 'https://craftbusinessmaster.com',
}: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>A tua subscrição foi cancelada — o acesso continua até ao fim do período</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Vamos sentir a tua falta 🧶</Heading>
        <Text style={text}>
          Cancelaste o plano <strong>{planoNome}</strong>. Fica descansada: não perdes nada agora —
          {fimAcesso
            ? ` mantens acesso completo até ${fimAcesso}.`
            : ' mantens acesso completo até ao fim do período já pago.'}
        </Text>
        <Text style={text}>
          Se cancelaste por engano, ou se houve algo que não correspondeu ao que esperavas,
          adorávamos saber. Podes reativar o teu plano a qualquer momento e continuar exatamente
          onde ficaste — os teus projetos, moldes e clientes ficam guardados.
        </Text>
        <Button style={button} href={`${appUrl}/planos`}>
          Reativar a minha subscrição
        </Button>
        <Text style={footer}>
          Com carinho,
          <br />
          A equipa Art Fusion 🎨
        </Text>
        <EmailBrandingFooter />
      </Container>
    </Body>
  </Html>
)

export default SubscriptionCanceledEmail

export const template = {
  component: SubscriptionCanceledEmail,
  displayName: 'Subscrição cancelada (retenção)',
  subject: 'A tua subscrição foi cancelada — ainda tens acesso 🧶',
  previewData: {
    planoNome: 'Premium',
    fimAcesso: '29/08/2026',
    appUrl: 'https://craftbusinessmaster.com',
  },
} satisfies TemplateEntry
