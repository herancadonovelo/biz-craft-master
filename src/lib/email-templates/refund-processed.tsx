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
  valor?: string
  appUrl?: string
}

export const RefundProcessedEmail = ({
  valor = '0,00 EUR',
  appUrl = 'https://craftbusinessmaster.com',
}: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>O teu reembolso foi processado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reembolso processado 💜</Heading>
        <Text style={text}>
          Confirmámos o reembolso de <strong>{valor}</strong>. O valor volta para o método de
          pagamento usado na compra e costuma aparecer no extrato em 5 a 10 dias úteis, conforme o
          banco.
        </Text>
        <Text style={text}>
          Se tiveres qualquer dúvida sobre este reembolso, responde a este email — estamos aqui para
          ajudar.
        </Text>
        <Button style={button} href={`${appUrl}/planos`}>
          Ver os meus planos
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

export default RefundProcessedEmail

export const template = {
  component: RefundProcessedEmail,
  displayName: 'Reembolso processado',
  subject: 'O teu reembolso foi processado 💜',
  previewData: { valor: '19,90 EUR', appUrl: 'https://craftbusinessmaster.com' },
} satisfies TemplateEntry