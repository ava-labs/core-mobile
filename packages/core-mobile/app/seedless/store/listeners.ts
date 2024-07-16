import { AppStartListening } from 'store/middleware/listener'
import {
  onAppLocked,
  onAppUnlocked,
  onLogOut,
  onRehydrationComplete,
  selectWalletState,
  WalletState
} from 'store/app'
import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import Logger from 'utils/Logger'
import { SessionTimeoutParams } from 'seedless/screens/SessionTimeout'
import { SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'
import SeedlessService from 'seedless/services/SeedlessService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { Action } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import { onTokenExpired } from 'seedless/store/slice'
import { ErrResponse, GlobalEvents } from '@cubist-labs/cubesigner-sdk'
import { initWalletServiceAndUnlock } from 'hooks/useWallet'
import { startRefreshSeedlessTokenFlow } from 'seedless/utils/startRefreshSeedlessTokenFlow'
import { setAccountTitle } from 'store/account'

const refreshSeedlessToken = async (): Promise<void> => {
  if (WalletService.walletType !== WalletType.SEEDLESS) {
    return
  }
  //refreshToken will trigger onSessionExpired if fails for that reason
  const refreshTokenResult = await SeedlessService.sessionManager.refreshToken()
  if (refreshTokenResult.success) {
    Logger.trace('Refresh token success')
    return
  }
  Logger.error('refresh failed', refreshTokenResult.error)
}

const invalidateSeedlessToken = async (): Promise<void> => {
  SeedlessService.sessionManager.setIsTokenValid(false)
}

const registerSeedlessErrorHandler = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch } = listenerApi

  const onErrorHandler = async (e: ErrResponse): Promise<void> => {
    // log error
    // note:
    // we are removing the url to avoid leaking user's address
    // an example url https://prod.signer.cubist.dev/v1/org/Org%23db7f2cac-7bd0-4e5f-b7c2-b5881a4bb4e7/eth1/sign/0xD0E99cEa490Cdb54ba555922bf325952F0DE38bd
    Logger.error('seedless error', JSON.stringify({ ...e, url: '' }))

    // handle re-auth for expired token
    if (e.isSessionExpiredError()) {
      dispatch(onTokenExpired)
    }
  }
  GlobalEvents.onError(onErrorHandler)
}

const handleTokenExpired = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
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

const handleSetAccountTitle = async ({
  accountIndex,
  name,
  walletType = WalletType.UNSET
}: {
  accountIndex: number
  name: string
  walletType?: WalletType
}): Promise<void> => {
  if (walletType !== WalletType.SEEDLESS) return
  SeedlessService.setAcountName(name, accountIndex)
}

function handleRetry(listenerApi: AppListenerEffectAPI): void {
  const { dispatch } = listenerApi
  //dismiss previous modal screen
  Navigation.goBack()
  Navigation.navigate({
    name: AppNavigation.Root.RefreshToken,
    params: {
      screen: AppNavigation.RefreshToken.OwlLoader
    }
  })
  startRefreshSeedlessTokenFlow(SeedlessService.sessionManager)
    .then(result => {
      if (result.success) {
        //dismiss Loader screen
        Navigation.goBack()

        const state = listenerApi.getState()
        if (selectWalletState(state) === WalletState.INACTIVE) {
          initWalletServiceAndUnlock({
            dispatch,
            mnemonic: SEEDLESS_MNEMONIC_STUB,
            walletType: WalletType.SEEDLESS,
            isLoggingIn: true
          }).catch(Logger.error)
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
      dispatch(onLogOut)
    })
}

const signOutSocial = async (_: Action): Promise<void> => {
  await GoogleSigninService.signOut()
}

export const addSeedlessListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: onAppUnlocked,
    effect: refreshSeedlessToken
  })
  startListening({
    actionCreator: onAppLocked,
    effect: invalidateSeedlessToken
  })
  startListening({
    actionCreator: onTokenExpired,
    effect: handleTokenExpired
  })
  startListening({
    actionCreator: onRehydrationComplete,
    effect: registerSeedlessErrorHandler
  })
  startListening({
    actionCreator: onLogOut,
    effect: signOutSocial
  })

  startListening({
    actionCreator: setAccountTitle,
    effect: async action => {
      handleSetAccountTitle({
        accountIndex: action.payload.accountIndex,
        name: action.payload.title,
        walletType: action.payload.walletType
      })
    }
  })
}
