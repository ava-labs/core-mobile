import { WalletType } from 'services/wallet/types'
import { useDispatch } from 'react-redux'
import { onLogIn } from 'store/app'
import Logger from 'utils/Logger'
import { useWallet } from './useWallet'
import { usePostCapture } from './usePosthogCapture'

interface SignupWallet {
  signupWallet: (mnemonic: string, walletType: WalletType) => Promise<void>
}

export function useSignupWallet(): SignupWallet {
  const { initWallet } = useWallet()
  const dispatch = useDispatch()
  const { capture } = usePostCapture()

  const signupWallet = async (
    mnemonic: string,
    walletType: WalletType
  ): Promise<void> => {
    try {
      await initWallet(mnemonic, walletType)

      dispatch(onLogIn())

      capture('OnboardingSubmitSucceeded', { walletType })
    } catch (e) {
      Logger.error('Unable to create wallet', e)

      capture('OnboardingSubmitFailed', { walletType })
    }
  }

  return {
    signupWallet
  }
}
