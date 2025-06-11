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
import { uuid } from 'utils/uuid'
import { storeWallet } from 'store/wallet/thunks'
import { AppThunkDispatch } from 'store/types'
import BiometricsSDK from 'utils/BiometricsSDK'

type InitWalletServiceAndUnlockProps = {
  mnemonic: string
  isLoggingIn: boolean
  walletType: WalletType
  dispatch: Dispatch
}

interface OnPinCreatedParams {
  mnemonic: string
  pin: string
  walletType?: WalletType
}

export interface UseWallet {
  onPinCreated: (params: OnPinCreatedParams) => Promise<string>
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
  const dispatch = useDispatch<AppThunkDispatch>()
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
   * Generates an encryption key, stores it with the PIN, and creates a new wallet.
   * The wallet's secret is stored in the secure storage and its metadata is added to the Redux store.
   *
   * @param params - The parameters for creating the wallet
   * @param params.mnemonic - The wallet's mnemonic phrase or secret
   * @param params.pin - The PIN to encrypt the wallet with
   * @param params.walletType - The type of wallet being created (defaults to MNEMONIC)
   * @returns Promise resolving to the created walletId
   * @throws Error if generating encryption key, storing it with PIN, or storing the wallet fails
   */
  async function onPinCreated({
    mnemonic,
    pin,
    walletType = WalletType.MNEMONIC
  }: OnPinCreatedParams): Promise<string> {
    const encryptionKey = await BiometricsSDK.generateEncryptionKey()
    await BiometricsSDK.storeEncryptionKeyWithPin(encryptionKey, pin)
    const walletId = uuid()

    try {
      const dispatchStoreWallet = dispatch(
        storeWallet({
          walletId,
          walletSecret: mnemonic,
          type: walletType
        })
      )
      await dispatchStoreWallet.unwrap()

      return Promise.resolve(walletId)
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
