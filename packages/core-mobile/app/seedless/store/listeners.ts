import {
  onAppLocked,
  onAppUnlocked,
  onLogOut,
  onRehydrationComplete
} from 'store/app'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'
import GoogleSigninService from 'services/socialSignIn/google/GoogleSigninService'
import { WalletType } from 'services/wallet/types'
import { Action } from '@reduxjs/toolkit'
import { AppStartListening, AppListenerEffectAPI } from 'store/types'
import { onTokenExpired } from 'seedless/store/slice'
import { selectAccountById, setAccountTitle } from 'store/account/slice'
import { router } from 'expo-router'
import {
  selectActiveWallet,
  selectWalletById,
  setActiveWallet
} from 'store/wallet/slice'
import WalletFactory from 'services/wallet/WalletFactory'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'

const refreshSeedlessToken = async (
  _: Action,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const activeWallet = selectActiveWallet(listenerApi.getState())
  if (activeWallet?.type !== WalletType.SEEDLESS) {
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
  const activeWallet = selectActiveWallet(getState())
  const walletType = activeWallet?.type

  if (walletType !== WalletType.SEEDLESS) return

  SeedlessService.init({
    onSessionExpired: () => dispatch(onTokenExpired)
  })
}

const terminateSeedless = async (): Promise<void> => {
  SeedlessPubKeysStorage.clearCache()
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
  const account = selectAccountById(accountId)(getState())
  if (!account) return
  await SeedlessService.setAccountName(name, account.index)
}

const signOutSocial = async (_: Action): Promise<void> => {
  await GoogleSigninService.signOut()
}

const handleActiveWalletChange = async (
  action: ReturnType<typeof setActiveWallet>,
  listenerApi: AppListenerEffectAPI
): Promise<void> => {
  const { getState } = listenerApi
  const state = getState()
  const activeWalletId = action.payload
  const activeWallet = selectWalletById(activeWalletId)(state)

  if (!activeWallet || activeWallet.type !== WalletType.SEEDLESS) {
    Logger.trace('No Seedless wallet to initialize')
    return
  }

  try {
    Logger.trace('Initializing Seedless wallet after setActiveWallet')

    const wallet = await WalletFactory.createWallet({
      walletId: activeWallet.id,
      walletType: WalletType.SEEDLESS
    })

    if (wallet instanceof SeedlessWallet) {
      await wallet.initialize({ shouldRefreshPublicKeys: true })
      Logger.trace('Seedless wallet initialized successfully')
    }
  } catch (error) {
    Logger.error('Failed to initialize Seedless wallet', error)
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
    actionCreator: onLogOut,
    effect: terminateSeedless
  })

  startListening({
    actionCreator: setAccountTitle,
    effect: async (action, listenerApi) => {
      await handleSetAccountTitle({
        accountId: action.payload.accountId,
        name: action.payload.title,
        walletType: action.payload.walletType,
        listenerApi
      })
    }
  })

  startListening({
    actionCreator: setActiveWallet,
    effect: handleActiveWalletChange
  })
}
