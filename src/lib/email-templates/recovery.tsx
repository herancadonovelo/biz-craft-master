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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>Esqueceste-te da palavra-passe? Nós ajudamos! 🔐</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Olá!</Heading>
        <Text style={text}>
          Acontece aos melhores! Recebemos um pedido para alterar a
          palavra-passe da tua conta no Craft Business Master.
        </Text>
        <Text style={text}>
          Para voltares rapidamente à gestão do teu negócio e dos teus
          projetos, clica no botão abaixo para escolheres uma nova
          palavra-passe:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Criar Nova Palavra-passe
        </Button>
        <Text style={altLink}>
          Link alternativo:{' '}
          <a href={confirmationUrl} style={link}>
            {confirmationUrl}
          </a>
        </Text>
        <Text style={text}>
          Se não solicitaste esta alteração, ignora simplesmente este email.
          A tua palavra-passe atual continuará a funcionar normalmente.
        </Text>
        <Text style={footer}>Um abraço, A equipa Art Fusion. 🧶 🌸 🧵</Text>
        <EmailBrandingFooter />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const altLink = {
  fontSize: '12px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '15px 0 25px',
  wordBreak: 'break-all' as const,
}
const link = { color: '#000000', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
