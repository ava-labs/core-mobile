import {
  onAppLocked,
  onAppUnlocked,
  onLogOut,
  onRehydrationComplete,
  selectWalletType
} from 'store/app'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { Action } from '@reduxjs/toolkit'
import { AppStartListening, AppListenerEffectAPI } from 'store/types'
import { onTokenExpired } from 'seedless/store/slice'
import { selectAccountByUuid, setAccountTitle } from 'store/account/slice'
import { router } from 'expo-router'
import { getAccountIndex } from 'store/account/utils'

const refreshSeedlessToken = async (): Promise<void> => {
  if (WalletService.walletType !== WalletType.SEEDLESS) {
    return
  }

  const refreshTokenResult = await SeedlessService.session.refreshToken()

  if (refreshTokenResult.success) {
    Logger.trace('Refresh token success')
    return
  }

  Logger.error('refresh failed', refreshTokenResult.error)
}

const invalidateSeedlessToken = async (): Promise<void> => {
  SeedlessService.session.setIsTokenValid(false)
}

const initSeedless = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { dispatch, getState } = listenerApi

  const walletType = selectWalletType(getState())

  if (walletType === WalletType.MNEMONIC) return

  SeedlessService.init({
    onSessionExpired: () => dispatch(onTokenExpired)
  })
}

const handleTokenExpired = async (): Promise<void> => {
  // @ts-ignore - absolute path to session expired screen
  router.navigate('/sessionExpired')
}

const handleSetAccountTitle = async ({
  accountId,
  name,
  walletType = WalletType.UNSET,
  listenerApi
}: {
  accountId: string
  name: string
  walletType?: WalletType
  listenerApi: AppListenerEffectAPI
}): Promise<void> => {
  const { getState } = listenerApi
  if (walletType !== WalletType.SEEDLESS) return
  const account = selectAccountByUuid(accountId)(getState())
  if (!account) return
  SeedlessService.setAcountName(name, getAccountIndex(account))
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
    effect: initSeedless
  })
  startListening({
    actionCreator: onLogOut,
    effect: signOutSocial
  })

  startListening({
    actionCreator: setAccountTitle,
    effect: async (action, listenerApi) => {
      handleSetAccountTitle({
        accountId: action.payload.accountId,
        name: action.payload.title,
        walletType: action.payload.walletType,
        listenerApi
      })
    }
  })
}
