import * as React from 'react'
import { Hr, Img, Section, Text } from '@react-email/components'

// Absolute URLs required for email clients (relative asset URLs won't load).
const ROOT = 'https://craftbusinessmaster.com'
const CBM_LOGO_URL = `${ROOT}/__l5e/assets-v1/7bcfeb2f-c651-4409-99b0-da4e0c16df58/cbm-logo-email.jpeg`
const ART_FUSION_LOGO_URL = `${ROOT}/__l5e/assets-v1/2a440894-1854-4964-9b60-9a9e3547fbf0/art-fusion-logo-email.jpeg`

export const EmailBrandingFooter = () => (
  <Section style={wrapper}>
    <Hr style={divider} />
    <Img
      src={CBM_LOGO_URL}
      alt="Craft Business Master"
      width="220"
      style={logo}
    />
    <Img
      src={ART_FUSION_LOGO_URL}
      alt="Art Fusion"
      width="220"
      style={logo}
    />
    <Text style={copyright}>
      © 2026 Craft Business Master. Todos os direitos reservados a Art Fusion.
    </Text>
  </Section>
)

const wrapper = { textAlign: 'center' as const, marginTop: '32px' }
const divider = { borderColor: '#eeeeee', margin: '24px 0' }
const logo = {
  display: 'block',
  margin: '12px auto',
  maxWidth: '220px',
  height: 'auto' as const,
}
const copyright = {
  fontSize: '11px',
  color: '#888888',
  margin: '16px 0 0',
  textAlign: 'center' as const,
}