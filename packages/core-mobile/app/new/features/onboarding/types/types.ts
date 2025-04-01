export type OidcAuth = {
  oidcToken: string
  mfaId: string
}

export type MfaType = 'totp' | 'fido'
