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

export interface FIDORegistrationRequest {
  challenge: Buffer
  rp: {
    id: string
    name: string
  }
  user: {
    id: Buffer
    name: string
    displayName: string
  }
  pubKeyCredParams: Array<{
    type: string
    alg: number
  }>
  timeout?: number
  excludeCredentials?: Array<{
    type: string
    id: Buffer
    transports?: Array<string>
  }>
  authenticatorSelection?: {
    authenticatorAttachment?: string
    requireResidentKey?: boolean
    residentKey?: string
    userVerification?: string
  }
  attestation?: string
  extensions?: Record<string, unknown>
}

export interface FIDOAuthenticationRequest {
  challenge: Buffer
  rpId: string
  timeout?: number
  allowCredentials?: Array<{
    type: string
    id: Buffer
    transports?: Array<string>
  }>
  userVerification?: string
  extensions?: Record<string, unknown>
}

export interface FIDORegistrationResult {
  id: string
  rawId: Buffer
  type?: string
  response: {
    clientDataJSON: Buffer
    attestationObject: Buffer
  }
}

export interface FIDOAuthenticationResult {
  id: string
  rawId: Buffer
  type?: string
  response: {
    clientDataJSON: Buffer
    authenticatorData: Buffer
    signature: Buffer
    userHandle: Buffer
  }
}
