import { AppStartListening } from 'store/middleware/listener'
import {
  immediateAppLock,
  onAppUnlocked,
  onRehydrationComplete,
  selectWalletState,
  WalletState
} from 'store/app'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { SessionTimeoutParams } from 'seedless/screens/SessionTimeout'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { OidcProviders, SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'
import CoreSeedlessAPIService, {
  SeedlessUserRegistrationResult
} from 'seedless/services/CoreSeedlessAPIService'
import SeedlessService from 'seedless/services/SeedlessService'
import { VerifyCodeParams } from 'seedless/screens/VerifyCode'
import AppleSignInService from 'services/socialSignIn/apple/AppleSignInService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { OidcPayload } from 'seedless/types'
import { Result } from 'types/result'
import { RefreshSeedlessTokenFlowErrors } from 'seedless/errors'
import { Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import { onTokenExpired } from 'seedless/store/slice'
import { GlobalEvents } from '@cubist-labs/cubesigner-sdk'
import { initWalletServiceAndUnlock } from 'hooks/useWallet'

const refreshSeedlessToken = async (): Promise<void> => {
  if (WalletService.walletType !== WalletType.SEEDLESS) {
    return
  }
  //refreshToken will trigger onSessionExpired if fails for that reason
  const refreshTokenResult = await SeedlessService.refreshToken()
  if (refreshTokenResult.success) {
    Logger.trace('Refresh token success')
    return
  }
  Logger.error('refresh failed', refreshTokenResult.error)
}

const registerTokenExpireHandler = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch } = listenerApi
  const onSessionExpiredHandler = async (): Promise<void> => {
    dispatch(onTokenExpired)
  }
  GlobalEvents.onSessionExpired(onSessionExpiredHandler)
}

const handleTokenExpired = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
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
        onRetry: () => handleRetry(listenerApi)
      } as SessionTimeoutParams
    }
  })
}

function handleRetry(listenerApi: AppListenerEffectAPI): void {
  const { dispatch } = listenerApi
  //dismiss previous modal screen
  Navigation.goBack()
  startRefreshSeedlessTokenFlow()
    .then(result => {
      if (result.success) {
        //dismiss Loader screen
        Navigation.goBack()

        const state = listenerApi.getState()
        if (selectWalletState(state) === WalletState.INACTIVE) {
          initWalletServiceAndUnlock(
            dispatch,
            SEEDLESS_MNEMONIC_STUB,
            WalletType.SEEDLESS
          ).catch(Logger.error)
        }
        return
      }
      switch (result.error.name) {
        case 'USER_ID_MISMATCH':
          Navigation.navigate({
            name: AppNavigation.Root.RefreshToken,
            params: {
              screen: AppNavigation.RefreshToken.WrongSocialAccount,
              params: {
                onRetry: () => handleRetry(listenerApi)
              } as SessionTimeoutParams
            }
          })
          break
        case 'USER_CANCELED':
        case 'UNSUPPORTED_OIDC_PROVIDER':
        case 'NOT_REGISTERED':
        case 'UNEXPECTED_ERROR':
          throw new Error(result.error.name)
      }
    })
    .catch(e => {
      Logger.error('startRefreshSeedlessTokenFlow error', e)
      //dismiss Loader screen
      Navigation.goBack()
      dispatch(immediateAppLock)
    })
}

async function startRefreshSeedlessTokenFlow(): Promise<
  Result<void, RefreshSeedlessTokenFlowErrors>
> {
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

  if (oidcUserId && oidcUserId !== oidcTokenResult.userId) {
    return {
      success: false,
      error: new RefreshSeedlessTokenFlowErrors({
        name: 'USER_ID_MISMATCH',
        message: `Please use same social account as when registering.`
      })
    }
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
      const onVerifySuccessPromise = new Promise((resolve, reject) => {
        Navigation.navigate({
          name: AppNavigation.Root.RefreshToken,
          params: {
            screen: AppNavigation.RefreshToken.VerifyCode,
            params: {
              oidcToken: oidcTokenResult.oidcToken,
              mfaId: loginResult.mfaId(),
              onVerifySuccess: resolve,
              onBack: () => reject('USER_CANCELED')
            } as VerifyCodeParams
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

export const addSeedlessListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: refreshSeedlessToken
  })
  startListening({
    actionCreator: onTokenExpired,
    effect: handleTokenExpired
  })
  startListening({
    actionCreator: onRehydrationComplete,
    effect: registerTokenExpireHandler
  })
}
