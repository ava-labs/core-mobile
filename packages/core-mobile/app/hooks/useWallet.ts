import { encrypt } from 'utils/EncryptionHelper'
import BiometricsSDK from 'utils/BiometricsSDK'
import walletService from 'services/wallet/WalletService'
import AnalyticsService from 'services/analytics/AnalyticsService'
import PerformanceService, {
  PerformanceMilestone
} from 'services/performance/PerformanceService'
import { useDispatch, useSelector } from 'react-redux'
import {
  onAppUnlocked,
  onLogIn,
  selectWalletType,
  setWalletType
} from 'store/app'
import { WalletType } from 'services/wallet/types'
import WalletService from 'services/wallet/WalletService'
import { Dispatch } from '@reduxjs/toolkit'
import Logger from 'utils/Logger'
import { useCallback } from 'react'

type InitWalletServiceAndUnlockProps = {
  mnemonic: string
  isLoggingIn: boolean
  walletType: WalletType
  dispatch: Dispatch
}

export interface UseWallet {
  onPinCreated: (
    mnemonic: string,
    pin: string,
    isResetting: boolean
  ) => Promise<'useBiometry' | 'enterWallet'>
  unlock: ({ mnemonic }: { mnemonic: string }) => Promise<void>
  login: (mnemonic: string, walletType: WalletType) => Promise<void>
  destroyWallet: () => void
}

export async function initWalletServiceAndUnlock({
  dispatch,
  mnemonic,
  walletType,
  isLoggingIn
}: InitWalletServiceAndUnlockProps): Promise<void> {
  await WalletService.init({ mnemonic, walletType, isLoggingIn })
  dispatch(onAppUnlocked())
}

/**
 * This hook handles onboarding process.
 * onPinCreated - use when user sets PIN to encrypt mnemonic and see if
 * user has biometry turned on
 * initWallet - use when ready to enter the wallet
 * destroyWallet - call when user ends session
 */
export function useWallet(): UseWallet {
  const dispatch = useDispatch()
  const cachedWalletType = useSelector(selectWalletType)

  /**
   * Initializes wallet with the specified mnemonic and wallet type
   * and navigates to the unlocked wallet screen
   */
  const unlock = useCallback(
    async ({ mnemonic }: { mnemonic: string }): Promise<void> => {
      await initWalletServiceAndUnlock({
        dispatch,
        mnemonic,
        walletType: cachedWalletType,
        isLoggingIn: false
      })
    },
    [dispatch, cachedWalletType]
  )

  const login = useCallback(
    async (mnemonic: string, walletType: WalletType): Promise<void> => {
      try {
        dispatch(setWalletType(walletType))
        await initWalletServiceAndUnlock({
          dispatch,
          mnemonic,
          walletType,
          isLoggingIn: true
        })

        dispatch(onLogIn())

        AnalyticsService.capture('OnboardingSubmitSucceeded', {
          walletType: walletType
        })
      } catch (e) {
        Logger.error('Unable to create wallet', e)

        AnalyticsService.capture('OnboardingSubmitFailed', {
          walletType: walletType
        })
      }
    },
    [dispatch]
  )

  /**
   * Destroys the wallet instance
   */
  const destroyWallet = useCallback(async () => {
    await walletService.destroy()
  }, [])

  return {
    onPinCreated,
    unlock,
    login,
    destroyWallet
  }
}

async function onPinCreated(
  mnemonic: string,
  pin: string,
  isResetting = false
): Promise<'useBiometry' | 'enterWallet'> {
  const encryptedData = await encrypt(mnemonic, pin)
  const pinSaved = await BiometricsSDK.storeWalletWithPin(
    encryptedData,
    isResetting
  )
  if (pinSaved === false) {
    throw Error('Pin not saved')
  }

  const canUseBiometry = isResetting
    ? false
    : await BiometricsSDK.canUseBiometry()

  if (canUseBiometry) {
    return Promise.resolve('useBiometry')
  } else {
    return Promise.resolve('enterWallet')
  }
}
