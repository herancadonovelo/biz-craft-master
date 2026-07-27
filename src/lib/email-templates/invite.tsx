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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
  recipient?: string
}

export const InviteEmail = ({
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt" dir="ltr">
    <Head />
    <Preview>📩 Convite: Simplifica a gestão do teu negócio no Craft Business Master 🧶 🌸 🧵</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Olá artesão/artesã,</Heading>
        <Text style={text}>
          Foste convidado(a) a criar conta no Craft Business Master. 🧶 🌸 🧵
        </Text>
        <Text style={text}>
          A plataforma desenhada 📕📍especificamente para ajudar criadores e
          artesãos a organizar, gerir e escalar os seus negócios. ✅💰📈
        </Text>
        <Text style={text}>
          Com a nossa aplicação, vais poder centralizar as tuas despesas, gerir
          os teus projetos e ter uma visão clara das tuas vendas, tudo no mesmo
          lugar. ✨📦
        </Text>
        <Text style={text}>
          Para aceitares o convite e criares o teu perfil gratuito 🥳, basta
          clicares na hiperligação abaixo: 📩📎
        </Text>
        <Button style={button} href={confirmationUrl}>
          Aceitar Convite e Criar Conta
        </Button>
        <Text style={altLink}>
          Se a hiperligação não funcionar ❎🔗✅, copia e cola o seguinte endereço
          no teu navegador: 💡💾{' '}
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
        </Text>
        <Text style={text}>
          Estamos ansiosos por ver o teu negócio crescer conosco. 💪🏻💫🏆
        </Text>
        <Text style={footer}>
          Com os melhores cumprimentos,
          <br />A equipa Art Fusion 🧶 🌸 🧵
        </Text>
        <EmailBrandingFooter />
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

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
const altLink = {
  fontSize: '12px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '15px 0 25px',
  wordBreak: 'break-all' as const,
}
