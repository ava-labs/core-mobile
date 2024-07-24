import { MFA, OidcPayload } from 'seedless/types'
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
import Logger from 'utils/Logger'
import { OidcProviders } from '../consts'
import SeedlessSessionManager from '../services/SeedlessSessionManager'

export async function startRefreshSeedlessTokenFlow(
  sessionManager: SeedlessSessionManager
): Promise<Result<void, RefreshSeedlessTokenFlowErrors>> {
  const oidcProvider = await SecureStorageService.load(
    KeySlot.OidcProvider
  ).catch(Logger.error)
  const oidcUserId = await SecureStorageService.load(KeySlot.OidcUserId).catch(
    Logger.error
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

    if (loginResult.requiresMfa()) {
      return await verifyUserWithMFA(
        oidcTokenResult.oidcToken,
        loginResult.mfaId(),
        sessionManager
      )
    } else {
      return {
        success: true,
        value: undefined
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

const verifyUserWithMFA = async (
  oidcToken: string,
  mfaId: string,
  sessionManager: SeedlessSessionManager
): Promise<Result<void, RefreshSeedlessTokenFlowErrors>> => {
  const mfaMethods = await sessionManager.userMfa()

  if (mfaMethods.length === 0) {
    return {
      success: true,
      value: undefined
    }
  } else if (mfaMethods.length === 1) {
    if (mfaMethods[0]) {
      return await handleMfa({
        mfa: mfaMethods[0],
        oidcToken,
        mfaId,
        sessionManager
      })
    } else {
      throw new Error('No MFA methods available')
    }
  } else {
    const onSelectMFAPromise = (): Promise<MFA> =>
      new Promise<MFA>((resolve, reject) => {
        Navigation.navigate({
          name: AppNavigation.Root.SelectRecoveryMethods,
          params: {
            mfaMethods,
            onMFASelected: mfa => {
              resolve(mfa)
            },
            onBack: () => reject('USER_CANCELED')
          }
        })
      })

    try {
      const mfa = await onSelectMFAPromise()

      return await handleMfa({ mfa, oidcToken, mfaId, sessionManager })
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
  const onVerifySuccessPromise = (): Promise<void> =>
    new Promise((resolve, reject) => {
      const onVerifyCode = (
        code: string
      ): Promise<Result<undefined, TotpErrors>> => {
        return sessionManager.verifyCode(oidcToken, mfaId, code)
      }
      Navigation.navigate({
        name: AppNavigation.Root.VerifyTotpCode,
        params: {
          onVerifyCode,
          onVerifySuccess: () => resolve(),
          onBack: () => {
            reject('USER_CANCELED')
          }
        }
      })
    })

  try {
    await onVerifySuccessPromise()
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

const handleMfa = async ({
  mfa,
  oidcToken,
  mfaId,
  sessionManager
}: {
  mfa: MFA
  oidcToken: string
  mfaId: string
  sessionManager: SeedlessSessionManager
}): Promise<Result<void, RefreshSeedlessTokenFlowErrors>> => {
  if (mfa.type === 'totp') {
    return await totpRefreshFlow(oidcToken, mfaId, sessionManager)
  } else if (mfa.type === 'fido') {
    return await fidoRefreshFlow(oidcToken, mfaId, sessionManager)
  }

  throw new Error('Unsupported MFA type')
}
