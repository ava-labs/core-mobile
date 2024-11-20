import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import { Amount } from 'types'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { TokenWithBalance } from '@avalabs/vm-module-types'

interface SendContextState {
  token: TokenWithBalance | undefined
  setToken: Dispatch<TokenWithBalance | undefined>
  amount: Amount | undefined
  setAmount: Dispatch<Amount | undefined>
  toAddress: string | undefined
  setToAddress: Dispatch<string | undefined>
  maxAmount: Amount | undefined
  setMaxAmount: Dispatch<Amount>
  maxFee: bigint
  error: string | undefined
  setError: Dispatch<string | undefined>
  isSending: boolean
  setIsSending: Dispatch<boolean>
  canValidate: boolean
  setCanValidate: Dispatch<boolean>
  isValid: boolean
}

export const SendContext = createContext<SendContextState>(
  {} as SendContextState
)

export const SendContextProvider = ({
  initialToken,
  children
}: {
  initialToken?: TokenWithBalance
  children: ReactNode
}): JSX.Element => {
  const { activeNetwork } = useNetworks()

  const [token, setToken] = useState<TokenWithBalance | undefined>(initialToken)
  const [maxAmount, setMaxAmount] = useState<Amount>()
  const [amount, setAmount] = useState<Amount>()

  const [toAddress, setToAddress] = useState<string>()

  const { data: networkFee } = useNetworkFee(activeNetwork)
  const [error, setError] = useState<string | undefined>(NOT_TOUCHED_ERROR)
  const [isSending, setIsSending] = useState(false)
  const [canValidate, setCanValidate] = useState(false)

  const [defaultMaxFeePerGas, setDefaultMaxFeePerGas] = useState<bigint>(0n)

  // setting maxFeePerGas to lowest network fee to calculate max amount in Send screen
  useEffect(() => {
    if (!networkFee) return
    setDefaultMaxFeePerGas(networkFee.low.maxFeePerGas)
  }, [networkFee])

  const setTokenAndResetAmount = useCallback(
    (newToken: TokenWithBalance | undefined) => {
      setToken(newToken)
      if (newToken?.symbol !== token?.symbol) {
        setAmount(undefined)
        setMaxAmount(undefined)
      }
    },
    [token]
  )

  const state: SendContextState = {
    token,
    setToken: setTokenAndResetAmount,
    amount,
    setAmount,
    toAddress,
    setToAddress,
    maxAmount,
    setMaxAmount,
    maxFee: defaultMaxFeePerGas,
    error,
    setError,
    isSending,
    setIsSending,
    canValidate,
    setCanValidate,
    isValid: error === undefined
  }
  return <SendContext.Provider value={state}>{children}</SendContext.Provider>
}

export function useSendContext(): SendContextState {
  return useContext(SendContext)
}

const NOT_TOUCHED_ERROR = ''
