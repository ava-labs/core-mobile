import { OidcPayload } from 'seedless/types'
import { Result } from 'types/result'
import { RefreshSeedlessTokenFlowErrors } from 'seedless/errors'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import Logger from 'utils/Logger'
import SeedlessSession from 'seedless/services/SeedlessSession'
import { OidcProviders } from 'seedless/consts'

export async function startRefreshSeedlessTokenFlow(
  session: SeedlessSession
): Promise<
  Result<
    { isMfaRequired: boolean; mfaId: string; oidcToken: string },
    RefreshSeedlessTokenFlowErrors
  >
> {
  const oidcProvider = await SecureStorageService.load(
    KeySlot.OidcProvider
  ).catch(Logger.error)
  const oidcUserId = await SecureStorageService.load(KeySlot.OidcUserId).catch(
    Logger.error
  )
  let oidcTokenResult: OidcPayload

  try {
    switch (oidcProvider) {
      case OidcProviders.GOOGLE:
        oidcTokenResult = await GoogleSigninService.signin()
        break
      case OidcProviders.APPLE:
        oidcTokenResult = await AppleSignInService.signIn()
        break
      default:
        return {
          success: false,
          error: new RefreshSeedlessTokenFlowErrors({
            name: 'UNSUPPORTED_OIDC_PROVIDER',
            message: `${oidcProvider} not supported`
          })
        }
    }
  } catch (e) {
    return {
      success: false,
      error: new RefreshSeedlessTokenFlowErrors({
        name: 'USER_CANCELED',
        message: `Failed to sign in with ${oidcProvider}`
      })
    }
  }

  const identity = await session.oidcProveIdentity(oidcTokenResult.oidcToken)

  if (oidcUserId && oidcUserId !== identity.email) {
    return {
      success: false,
      error: new RefreshSeedlessTokenFlowErrors({
        name: 'USER_ID_MISMATCH',
        message: `Please use same social account as when registering.`
      })
    }
  }

  const result = await CoreSeedlessAPIService.register(identity)

  if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
    const loginResult = await session.requestOidcAuth(oidcTokenResult.oidcToken)
    const mfaId = loginResult.mfaId()

    if (loginResult.requiresMfa() && mfaId) {
      return {
        success: true,
        value: {
          isMfaRequired: true,
          mfaId,
          oidcToken: oidcTokenResult.oidcToken
        }
      }
    } else {
      return {
        success: true,
        value: {
          isMfaRequired: false,
          mfaId: '',
          oidcToken: oidcTokenResult.oidcToken
        }
      }
    }
  }

  return {
    success: false,
    error: new RefreshSeedlessTokenFlowErrors({
      name: 'NOT_REGISTERED',
      message: `Please sign in again.`
    })
  }
}
