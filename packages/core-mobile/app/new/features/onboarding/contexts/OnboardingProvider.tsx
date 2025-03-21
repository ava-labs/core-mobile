import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'
import { WalletType } from 'services/wallet/types'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

export interface OnboardingContextState {
  walletType: WalletType
  setWalletType: Dispatch<SetStateAction<WalletType>>
  hasWalletName: boolean
}

export const OnboardingContext = createContext<OnboardingContextState>(
  {} as OnboardingContextState
)

export const OnboardingProvider = ({
  children
}: {
  children: ReactNode
}): React.JSX.Element => {
  const [walletType, setWalletType] = useState(WalletType.UNSET)
  const [hasWalletName, setHasWalletName] = useState(false)

  useEffect(() => {
    const checkHasWalletName = async (): Promise<void> => {
      if (walletType === WalletType.SEEDLESS) {
        const walletName = await SeedlessService.getAccountName()
        setHasWalletName(walletName !== undefined ? true : false)
      } else {
        setHasWalletName(false)
      }
    }
    checkHasWalletName().catch(Logger.error)
  }, [walletType])

  const state: OnboardingContextState = {
    walletType,
    setWalletType,
    hasWalletName
  }

  return (
    <OnboardingContext.Provider value={state}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboardingContext(): OnboardingContextState {
  return useContext(OnboardingContext)
}
