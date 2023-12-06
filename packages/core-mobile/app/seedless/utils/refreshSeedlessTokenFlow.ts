import {
  CubeSignerResponse,
  SignerSessionData
} from '@cubist-labs/cubesigner-sdk'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { OidcProviders } from 'seedless/consts'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import { OidcPayload } from 'seedless/types'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import Logger from 'utils/Logger'

export async function refreshSeedlessTokenFlow(
  onVerifySuccessPromise: (
    loginResult: CubeSignerResponse<SignerSessionData>,
    oidcTokenResult: OidcPayload
  ) => Promise<void>,
  hideLoader: () => void
): Promise<void> {
  try {
    const oidcProvider = await SecureStorageService.load(KeySlot.OidcProvider)
    let oidcTokenResult: OidcPayload
    switch (oidcProvider) {
      case OidcProviders.GOOGLE:
        oidcTokenResult = await GoogleSigninService.signin()
        break
      case OidcProviders.APPLE:
        oidcTokenResult = await AppleSignInService.signIn()
        break
      default:
        throw new Error('Unsupported oidcProvider')
    }

    const identity = await SeedlessService.oidcProveIdentity(
      oidcTokenResult.oidcToken
    )
    const result = await CoreSeedlessAPIService.register(identity)
    if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      const loginResult = await SeedlessService.requestOidcAuth(
        oidcTokenResult.oidcToken
      )
      const userMfa = await SeedlessService.userMfa()
      const usesTotp = userMfa.some(value => value.type === 'totp')
      if (usesTotp) {
        await onVerifySuccessPromise(loginResult, oidcTokenResult)
      }
    }
    //TODO: handle other cases
  } catch (e) {
    Logger.error('refreshSeedlessTokenFlow', e)
    //TODO: sign out user
  } finally {
    //remove loader screen
    hideLoader()
  }
}
