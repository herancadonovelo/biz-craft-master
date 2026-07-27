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
  recipient,
}: SignupEmailProps) => {
  const firstName = (recipient || '').split('@')[0] || ''
  const saudacao = firstName ? `Olá ${firstName},` : 'Olá,'
  return (
    <Html lang="pt" dir="ltr">
      <Head />
      <Preview>Bem-vindo(a) à tua nova casa criativa 🧵✨</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Bem-vindo(a) à tua nova casa criativa! 🧵✨</Heading>
          <Text style={text}>{saudacao}</Text>
          <Text style={text}>
            Oficialmente, bem-vindo(a) ao Craft Business Master! 🧶 🌸 🧵
          </Text>
          <Text style={text}>
            Sabemos que o trabalho manual é feito com o coração, mas que a parte de trás do palco —
            os orçamentos, as faturas e o inventário — pode ser uma verdadeira dor de cabeça. 😵‍💫💰⚖️
          </Text>
          <Text style={text}>
            Foi exatamente por isso que construímos este espaço. A partir de hoje, podes deixar a
            Gestão de Números & Fios e o Arquivo de Faturas & Recibos conosco, num ambiente limpo,
            organizado e pensado exclusivamente para quem cria com as próprias mãos. 🙌🏻🛠️
          </Text>
          <Text style={text}>
            O teu foco principal deve estar na arte; nós ajudamos-te a cuidar do negócio. 🥰🌈
          </Text>
          <Button style={button} href={confirmationUrl}>
            Explorar o Craft Business Master
          </Button>
          <Text style={{ ...text, fontSize: '12px', color: '#888' }}>
            Link alternativo:{' '}
            <Link href={confirmationUrl} style={link}>
              {confirmationUrl}
            </Link>
          </Text>
          <Text style={text}>
            Mal podemos esperar para ver os laços que vais criar com a tua Rede de Clientes do
            Ateliê. Sente-te em casa! 📝💞🏠
          </Text>
          <Text style={footer}>
            Um abraço caloroso,
            <br />
            Sara Afonso
            <br />
            Fundadora da Art Fusion 🎨✨
          </Text>
          <EmailBrandingFooter />
        </Container>
      </Body>
    </Html>
  )
}

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
