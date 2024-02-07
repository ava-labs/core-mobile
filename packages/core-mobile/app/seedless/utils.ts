import { OidcPayload } from 'seedless/types'
import { Result } from 'types/result'
import { RefreshSeedlessTokenFlowErrors, TotpErrors } from 'seedless/errors'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { OidcProviders } from './consts'
import SeedlessSessionManager from './services/SeedlessSessionManager'

export async function startRefreshSeedlessTokenFlow(
  sessionManager: SeedlessSessionManager
): Promise<Result<void, RefreshSeedlessTokenFlowErrors>> {
  const oidcProvider = await SecureStorageService.load(KeySlot.OidcProvider)
  const oidcUserId = await SecureStorageService.load(KeySlot.OidcUserId).catch(
    _ => undefined
  )
  let oidcTokenResult: OidcPayload

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

  const identity = await sessionManager.oidcProveIdentity(
    oidcTokenResult.oidcToken
  )

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
    const loginResult = await sessionManager.requestOidcAuth(
      oidcTokenResult.oidcToken
    )
    const userMfa = await sessionManager.userMfa()
    const usesTotp = userMfa.some(value => value.type === 'totp')
    const usesFido = userMfa.some(value => value.type === 'fido')
    //we prioritize fido over totp
    if (usesFido) {
      return await fidoRefreshFlow(
        oidcTokenResult.oidcToken,
        loginResult.mfaId(),
        sessionManager
      )
    }
    if (usesTotp) {
      return await totpRefreshFlow(
        oidcTokenResult.oidcToken,
        loginResult.mfaId(),
        sessionManager
      )
    }

    return {
      success: true,
      value: undefined
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

async function fidoRefreshFlow(
  oidcToken: string,
  mfaId: string,
  sessionManager: SeedlessSessionManager
): Promise<Result<void, RefreshSeedlessTokenFlowErrors>> {
  try {
    await sessionManager.approveFido(
      oidcToken,
      mfaId,
      false //FIXME: this parameter is not needed, should refactor approveFido to remove it,
    )
    return {
      success: true,
      value: undefined
    }
  } catch (e) {
    return {
      success: false,
      error: new RefreshSeedlessTokenFlowErrors({
        name: e === 'USER_CANCELED' ? e : 'UNEXPECTED_ERROR',
        message: ``
      })
    }
  }
}
async function totpRefreshFlow(
  oidcToken: string,
  mfaId: string,
  sessionManager: SeedlessSessionManager
): Promise<Result<void, RefreshSeedlessTokenFlowErrors>> {
  const onVerifySuccessPromise = new Promise((resolve, reject) => {
    const onVerifyCode = (
      code: string
    ): Promise<Result<undefined, TotpErrors>> => {
      return sessionManager.verifyCode(oidcToken, mfaId, code)
    }
    Navigation.navigate({
      name: AppNavigation.Root.RefreshToken,
      params: {
        screen: AppNavigation.RefreshToken.VerifyCode,
        params: {
          onVerifyCode,
          onVerifySuccess: resolve,
          onBack: () => reject('USER_CANCELED')
        }
      }
    })
  })

  try {
    await onVerifySuccessPromise
    return {
      success: true,
      value: undefined
    }
  } catch (e) {
    return {
      success: false,
      error: new RefreshSeedlessTokenFlowErrors({
        name: e === 'USER_CANCELED' ? e : 'UNEXPECTED_ERROR',
        message: ``
      })
    }
  }
}
