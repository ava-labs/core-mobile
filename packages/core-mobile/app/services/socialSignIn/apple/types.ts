import { OidcPayload } from 'seedless/types'

export interface AppleSigninServiceInterface {
  isSupported(): boolean
  signIn(): Promise<OidcPayload>
}
