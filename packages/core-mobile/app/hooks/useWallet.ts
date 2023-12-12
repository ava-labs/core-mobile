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
import { useAnalytics } from './useAnalytics'

export interface UseWallet {
  onPinCreated: (
    mnemonic: string,
    pin: string,
    isResetting: boolean
  ) => Promise<'useBiometry' | 'enterWallet'>
  initWallet: (mnemonic: string, walletType?: WalletType) => Promise<void>
  initAndLoginWallet: (
    mnemonic: string,
    walletType: WalletType
  ) => Promise<void>
  destroyWallet: () => void
}

export async function initWalletServiceAndUnlock(
  dispatch: Dispatch,
  mnemonic: string,
  walletType: WalletType
): Promise<void> {
  await WalletService.init(mnemonic, walletType)
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
  const { track } = useAnalytics()

  /**
   * Initializes wallet with the specified mnemonic and wallet type
   * and navigates to the unlocked wallet screen
   */
  const initWallet = async (
    mnemonic: string,
    walletType?: WalletType
  ): Promise<void> => {
    if (walletType) {
      dispatch(setWalletType(walletType))
    }

    await initWalletServiceAndUnlock(
      dispatch,
      mnemonic,
      walletType || cachedWalletType
    )
  }

  const initAndLoginWallet = async (
    mnemonic: string,
    walletType: WalletType
  ): Promise<void> => {
    try {
      await initWallet(mnemonic, walletType)

      dispatch(onLogIn())

      track('OnboardingSubmitSucceeded', { walletType: walletType })
    } catch (e) {
      Logger.error('Unable to create wallet', e)

      track('OnboardingSubmitFailed', { walletType: walletType })
    }
  }

  /**
   * Destroys the wallet instance
   */
  async function destroyWallet(): Promise<void> {
    await walletService.destroy()
  }

  return {
    onPinCreated,
    initWallet,
    initAndLoginWallet,
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
