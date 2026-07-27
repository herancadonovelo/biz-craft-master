import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import { EmailBrandingFooter } from './_footer'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Bem-vindo(a) ao Craft Business Master 🎉 Confirma o teu acesso</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo(a) ao Craft Business Master 🎉</Heading>
        <Text style={text}>Olá!</Text>
        <Text style={text}>
          Que bom ver-te por aqui. Estás a um pequeno passo de simplificar toda a gestão
          das tuas criações, despesas e vendas.
        </Text>
        <Text style={text}>
          Para entrares oficialmente na plataforma, clica no botão abaixo para validar a
          tua conta de email:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Validar Conta e Começar
        </Button>
        <Text style={{ ...text, fontSize: '12px', color: '#888' }}>
          Link alternativo:{' '}
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={text}>
          Mal podemos esperar para ver o teu negócio crescer de forma organizada.
        </Text>
        <Text style={footer}>
          Um abraço,
          <br />
          A equipa Art Fusion
        </Text>
        <EmailBrandingFooter />
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
