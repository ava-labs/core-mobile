import { encrypt } from 'utils/EncryptionHelper'
import BiometricsSDK from 'utils/BiometricsSDK'
import walletService from 'services/wallet/WalletService'
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
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useCallback } from 'react'
import { storeWalletWithPin } from 'store/wallet/thunks'
import { uuid } from 'utils/uuid'

type InitWalletServiceAndUnlockProps = {
  mnemonic: string
  isLoggingIn: boolean
  walletType: WalletType
  dispatch: Dispatch
}

interface OnPinCreatedParams {
  mnemonic: string
  pin: string
  isResetting?: boolean
  walletType?: WalletType
}

export interface UseWallet {
  onPinCreated: (
    params: OnPinCreatedParams
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

  /**
   * Creates a new wallet with the provided PIN and mnemonic.
   * Encrypts the mnemonic with the PIN and stores it.
   * If not resetting an existing wallet, checks if biometry can be used.
   *
   * @param mnemonic - The wallet's mnemonic phrase
   * @param pin - The PIN to encrypt the mnemonic with
   * @param isResetting - Whether this is resetting an existing wallet
   * @param walletType - The type of wallet being created (defaults to MNEMONIC)
   * @returns Promise resolving to 'useBiometry' if biometry available, 'enterWallet' otherwise
   * @throws Error if storing the wallet fails
   */
  async function onPinCreated({
    mnemonic,
    pin,
    isResetting = false,
    walletType = WalletType.MNEMONIC
  }: OnPinCreatedParams): Promise<'useBiometry' | 'enterWallet'> {
    const walletId = uuid()
    const walletSecret = await encrypt(mnemonic, pin)

    try {
      const dispatchStoreWalletWithPin = dispatch(
        storeWalletWithPin({
          walletId,
          walletSecret,
          isResetting,
          type: walletType
        })
      )
      // @ts-ignore
      await dispatchStoreWalletWithPin.unwrap()

      const canUseBiometry = isResetting
        ? false
        : await BiometricsSDK.canUseBiometry()

      if (canUseBiometry) {
        return Promise.resolve('useBiometry')
      } else {
        return Promise.resolve('enterWallet')
      }
    } catch (error) {
      throw Error('Failed to store wallet with PIN')
    }
  }

  return {
    onPinCreated,
    unlock,
    login,
    destroyWallet
  }
}
