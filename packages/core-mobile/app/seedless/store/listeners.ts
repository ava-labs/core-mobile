import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked } from 'store/app'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { SessionTimeoutParams } from 'seedless/screens/SessionTimeout'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { OidcProviders } from 'seedless/consts'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import { VerifyCodeParams } from 'seedless/screens/VerifyCode'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'

const refreshSeedlessToken = async (): Promise<void> => {
  const refreshTokenResult = await SeedlessService.refreshToken()
  if (refreshTokenResult.success) {
    Logger.trace('Refresh token success')
    return
  }
  if (refreshTokenResult.error.name === 'RefreshFailed') {
    Logger.error('refresh failed', refreshTokenResult.error)
    return
  }

  Navigation.navigate({
    name: AppNavigation.Root.RefreshToken,
    params: {
      screen: AppNavigation.RefreshToken.OwlLoader
    }
  })
  Navigation.navigate({
    name: AppNavigation.Root.RefreshToken,
    params: {
      screen: AppNavigation.RefreshToken.SessionTimeout,
      params: {
        onRetry: () => {
          refreshSeedlessTokenFlow().catch(e =>
            Logger.error('refreshSeedlessTokenFlow', e)
          )
          //dismiss SessionTimeout screen
          Navigation.goBack()
        }
      } as SessionTimeoutParams
    }
  })
}

async function refreshSeedlessTokenFlow(): Promise<void> {
  try {
    const oidcProvider = await SecureStorageService.load(KeySlot.OidcProvider)
    let oidcTokenResult = ''
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

    const identity = await SeedlessService.oidcProveIdentity(oidcTokenResult)
    const result = await CoreSeedlessAPIService.register(identity)
    if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      const loginResult = await SeedlessService.requestOidcAuth(oidcTokenResult)
      const userMfa = await SeedlessService.userMfa()
      const usesTotp = userMfa.some(value => value.type === 'totp')
      if (usesTotp) {
        const onVerifySuccessPromise = new Promise((resolve, reject) => {
          Navigation.navigate({
            name: AppNavigation.Root.RefreshToken,
            params: {
              screen: AppNavigation.RefreshToken.VerifyCode,
              params: {
                oidcToken: oidcTokenResult,
                mfaId: loginResult.mfaId(),
                onVerifySuccess: resolve,
                onBack: () => reject('canceled')
              } as VerifyCodeParams
            }
          })
        })

        await onVerifySuccessPromise
      }
    }
    //TODO: handle other cases
  } catch (e) {
    Logger.error('refreshSeedlessTokenFlow', e)
    //TODO: sign out user
  } finally {
    //remove loader screen
    Navigation.goBack()
  }
}

export const addSeedlessListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: refreshSeedlessToken
  })
}
