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
import GoogleSigninService from 'seedless/services/GoogleSigninService'
import { VerifyCodeParams } from 'seedless/screens/VerifyCode'

const refreshSeedlessToken = async (): Promise<void> => {
  const refreshTokenResult = await SeedlessService.refreshToken()
  if (refreshTokenResult.success) {
    Logger.trace('Refresh token success')
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
      case OidcProviders.Google:
        oidcTokenResult = await GoogleSigninService.signin()
        break
      case OidcProviders.Apple:
      default:
        throw new Error('Unsupported oidcProvider')
    }

    const identity = await SeedlessService.oidcProveIdentity(oidcTokenResult)
    const result = await CoreSeedlessAPIService.register(identity)
    if (result === SeedlessUserRegistrationResult.ALREADY_REGISTERED) {
      const loginResult = await SeedlessService.login(oidcTokenResult)
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
