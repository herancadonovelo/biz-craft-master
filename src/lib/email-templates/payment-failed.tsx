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
  appUrl?: string
}

export const PaymentFailedEmail = ({
  planoNome = 'Premium',
  appUrl = 'https://craftbusinessmaster.com',
}: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Não conseguimos processar o teu pagamento — o acesso continua ativo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Não conseguimos processar o teu pagamento 💳</Heading>
        <Text style={text}>
          A renovação do teu plano <strong>{planoNome}</strong> não foi concluída. Pode ter sido
          apenas um cartão expirado ou um limite temporário do banco.
        </Text>
        <Text style={text}>
          <strong>O teu acesso continua ativo</strong> enquanto tentamos novamente. Para evitar
          qualquer interrupção, atualiza o método de pagamento na tua área de subscrição.
        </Text>
        <Button style={button} href={`${appUrl}/planos`}>
          Atualizar método de pagamento
        </Button>
        <Text style={footer}>
          Obrigada,
          <br />
          A equipa Art Fusion 🎨
        </Text>
        <EmailBrandingFooter />
      </Container>
    </Body>
  </Html>
)

export default PaymentFailedEmail

export const template = {
  component: PaymentFailedEmail,
  displayName: 'Pagamento falhou',
  subject: 'Não conseguimos processar o teu pagamento 💳',
  previewData: { planoNome: 'Premium', appUrl: 'https://craftbusinessmaster.com' },
} satisfies TemplateEntry
