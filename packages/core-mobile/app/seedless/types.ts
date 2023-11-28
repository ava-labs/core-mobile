export type MFA =
  | {
      type: 'totp'
    }
  | {
      id: string
      name: string
      type: 'fido'
    }
