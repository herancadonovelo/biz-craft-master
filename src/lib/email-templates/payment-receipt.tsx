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
  numeroRecibo?: string
  valor?: string
  data?: string
  descricao?: string
  appUrl?: string
}

export const PaymentReceiptEmail = ({
  numeroRecibo = 'REC-0000',
  valor = '0,00 EUR',
  data = '',
  descricao = 'Subscrição Craft Business Master',
  appUrl = 'https://craftbusinessmaster.com',
}: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Recibo {numeroRecibo} — pagamento confirmado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Recibo de pagamento 🧾</Heading>
        <Text style={text}>
          Obrigado! Recebemos o teu pagamento de <strong>{valor}</strong>
          {data ? ` em ${data}` : ''}.
        </Text>
        <Text style={text}>
          <strong>Recibo:</strong> {numeroRecibo}
          <br />
          <strong>Descrição:</strong> {descricao}
          <br />
          <strong>Valor pago:</strong> {valor}
          {data ? (
            <>
              <br />
              <strong>Data:</strong> {data}
            </>
          ) : null}
        </Text>
        <Text style={text}>
          Podes consultar e imprimir o comprovativo a qualquer momento na tua área de utilizador.
        </Text>
        <Button style={button} href={`${appUrl}/recibos`}>
          Ver os meus recibos
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

export default PaymentReceiptEmail

export const template = {
  component: PaymentReceiptEmail,
  displayName: 'Recibo de pagamento',
  subject: (d: Record<string, any>) =>
    `Recibo ${d?.numeroRecibo ?? ''} — pagamento confirmado 🧾`.replace('  ', ' '),
  previewData: {
    numeroRecibo: 'REC-2026-A1B2C3D4',
    valor: '19,90 EUR',
    data: '29/07/2026',
    descricao: 'Plano Premium (mensal)',
    appUrl: 'https://craftbusinessmaster.com',
  },
} satisfies TemplateEntry