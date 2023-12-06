import { AppStartListening } from 'store/middleware/listener'
import { onAppUnlocked } from 'store/app'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { SessionTimeoutParams } from 'seedless/screens/SessionTimeout'
import SeedlessService from 'seedless/services/SeedlessService'
import { VerifyCodeParams } from 'seedless/screens/VerifyCode'
import { OidcPayload } from 'seedless/types'
import {
  CubeSignerResponse,
  SignerSessionData
} from '@cubist-labs/cubesigner-sdk'
import { refreshSeedlessTokenFlow } from 'seedless/utils/refreshSeedlessTokenFlow'

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
          const onVerifySuccessPromise = (
            loginResult: CubeSignerResponse<SignerSessionData>,
            oidcTokenResult: OidcPayload
          ): Promise<void> =>
            new Promise((resolve, reject) => {
              Navigation.navigate({
                name: AppNavigation.Root.RefreshToken,
                params: {
                  screen: AppNavigation.RefreshToken.VerifyCode,
                  params: {
                    oidcToken: oidcTokenResult.oidcToken,
                    mfaId: loginResult.mfaId(),
                    onVerifySuccess: resolve,
                    onBack: () => reject('canceled')
                  } as VerifyCodeParams
                }
              })
            })
          refreshSeedlessTokenFlow(
            onVerifySuccessPromise,
            Navigation.goBack
          ).catch(e => Logger.error('refreshSeedlessTokenFlow', e))
          //dismiss SessionTimeout screen
          Navigation.goBack()
        }
      } as SessionTimeoutParams
    }
  })
}

export const addSeedlessListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: refreshSeedlessToken
  })
}
