import { useDispatch } from 'react-redux'
import { showAlert } from '@avalabs/k2-alpine'
import { onAppUnlocked, onLogIn, setWalletType } from 'store/app'
import { WalletType } from 'services/wallet/types'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useCallback } from 'react'
import { storeWallet } from 'store/wallet/thunks'
import { AppThunkDispatch } from 'store/types'
import BiometricsSDK from 'utils/BiometricsSDK'
import { setActiveWallet } from 'store/wallet/slice'

const warnIfNoSecureHardware = async (): Promise<void> => {
  if (await BiometricsSDK.isSecureHardwareAvailable()) return

  showAlert({
    title: 'Secure hardware unavailable',
    description:
      "This device doesn't have a hardware-backed secure keystore, so your " +
      'wallet is protected with software-based encryption instead. This is ' +
      'less secure than storage on devices with secure hardware.',
    buttons: [{ text: 'I understand' }]
  })
}

interface OnPinCreatedParams {
  walletId: string
  mnemonic: string
  pin: string
  walletType?: WalletType
}

export interface UseWallet {
  onPinCreated: (params: OnPinCreatedParams) => Promise<string>
  unlock: () => Promise<void>
  login: (walletType: WalletType) => Promise<void>
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

  /**
   * Navigates to the unlocked wallet screen
   */
  const unlock = useCallback(async (): Promise<void> => {
    dispatch(onAppUnlocked())
  }, [dispatch])

  const login = useCallback(
    async (walletType: WalletType): Promise<void> => {
      try {
        dispatch(setWalletType(walletType))
        await unlock()
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
    [dispatch, unlock]
  )

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
    walletId,
    mnemonic,
    pin,
    walletType = WalletType.MNEMONIC
  }: OnPinCreatedParams): Promise<string> {
    const encryptionKey = await BiometricsSDK.generateEncryptionKey()
    await BiometricsSDK.storeEncryptionKeyWithPin(encryptionKey, pin)

    try {
      const dispatchStoreWallet = dispatch(
        storeWallet({
          walletId,
          walletSecret: mnemonic,
          type: walletType
        })
      )
      await dispatchStoreWallet.unwrap()
      dispatch(setActiveWallet(walletId))

      // Wallet stored — if it landed in the software keystore (no secure
      // hardware on this device), let the user know their protection is weaker.
      await warnIfNoSecureHardware()

      return Promise.resolve(walletId)
    } catch (error) {
      Logger.error('Failed to store wallet with PIN', error)
      throw Error('Failed to store wallet with PIN')
    }
  }

  return {
    onPinCreated,
    unlock,
    login
  }
}
