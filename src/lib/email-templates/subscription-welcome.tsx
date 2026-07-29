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
  ciclo?: string
  valor?: string
  proximaRenovacao?: string
  appUrl?: string
}

export const SubscriptionWelcomeEmail = ({
  planoNome = 'Premium',
  ciclo = 'mensal',
  valor = '16,99 €',
  proximaRenovacao = '',
  appUrl = 'https://craftbusinessmaster.com',
}: Props) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>O teu plano {planoNome} está ativo 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>O teu plano {planoNome} está ativo! 🎉</Heading>
        <Text style={text}>
          Obrigada por confiares no Craft Business Master. A partir de agora tens acesso completo
          às funcionalidades do plano <strong>{planoNome}</strong>.
        </Text>
        <Text style={text}>
          <strong>Plano:</strong> {planoNome}
          <br />
          <strong>Ciclo:</strong> {ciclo}
          <br />
          <strong>Valor:</strong> {valor}
          {proximaRenovacao ? (
            <>
              <br />
              <strong>Próxima renovação:</strong> {proximaRenovacao}
            </>
          ) : null}
        </Text>
        <Button style={button} href={`${appUrl}/planos`}>
          Ver a minha subscrição
        </Button>
        <Text style={footer}>
          Um abraço,
          <br />
          A equipa Art Fusion 🎨
        </Text>
        <EmailBrandingFooter />
      </Container>
    </Body>
  </Html>
)

export default SubscriptionWelcomeEmail

export const template = {
  component: SubscriptionWelcomeEmail,
  displayName: 'Subscrição ativada',
  subject: (d: Record<string, any>) =>
    `O teu plano ${d?.planoNome ?? 'Premium'} está ativo 🎉`,
  previewData: {
    planoNome: 'Premium',
    ciclo: 'mensal',
    valor: '16,99 €',
    proximaRenovacao: '29/08/2026',
    appUrl: 'https://craftbusinessmaster.com',
  },
} satisfies TemplateEntry
