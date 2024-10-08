export type MFA =
  | {
      /** type for authenticator */
      type: 'totp'
    }
  | {
      /** A unique credential id */
      id: string
      /** A human-readable name given to the key */
      name: string
      /** type for fido(i.e. passkey, yubikey) */
      type: 'fido'
    }

export type OidcPayload = {
  oidcToken: string
}
