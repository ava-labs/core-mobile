import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useState,
  useMemo
} from 'react'
import { SwapSide } from '@paraswap/sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import type { Quote } from '../types'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken,
  useBestQuote,
  useUserQuote,
  useAllQuotes
} from '../hooks/useZustandStore'
import { useQuoteStreaming } from '../hooks/useQuoteStreaming'

const DEFAULT_SLIPPAGE = 0.2

// success here just means the transaction was sent, not that it was successful/confirmed
type SwapStatus = 'Idle' | 'Swapping' | 'Success' | 'Fail'

interface SwapContextState {
  fromToken?: LocalTokenWithBalance
  toToken?: LocalTokenWithBalance
  setFromToken: Dispatch<LocalTokenWithBalance | undefined>
  setToToken: Dispatch<LocalTokenWithBalance | undefined>
  bestQuote: Quote | null
  userQuote: Quote | null
  allQuotes: Quote[]
  isQuoteLoading: boolean
  quoteError: Error | null
  selectQuoteById: (quoteId: string | null) => void
  swap(): Promise<void>
  slippage: number
  setSlippage: Dispatch<number>
  autoSlippage: boolean
  setAutoSlippage: Dispatch<boolean>
  destination: SwapSide
  setDestination: Dispatch<SwapSide>
  swapStatus: SwapStatus
  setAmount: Dispatch<bigint | undefined>
}

export const SwapContext = createContext<SwapContextState>(
  {} as SwapContextState
)

export const SwapContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE)
  const [autoSlippage, setAutoSlippage] = useState<boolean>(true)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')
  const [amount, setAmount] = useState<bigint>()

  // Get quotes
  const [bestQuote] = useBestQuote()
  const [userQuote, setUserQuote] = useUserQuote()
  const [allQuotes] = useAllQuotes()

  // Get account and networks
  const activeAccount = useSelector(selectActiveAccount)
  const { getNetwork } = useNetworks()
  const fromNetwork = useMemo(
    () => (fromToken ? getNetwork(fromToken.networkChainId) : undefined),
    [fromToken, getNetwork]
  )
  const toNetwork = useMemo(
    () => (toToken ? getNetwork(toToken.networkChainId) : undefined),
    [toToken, getNetwork]
  )

  // Get appropriate addresses for the networks (EVM uses addressC, SVM uses addressSVM, etc.)
  const fromAddress = useMemo(() => {
    if (!activeAccount || !fromNetwork) return undefined
    return getAddressByNetwork(activeAccount, fromNetwork)
  }, [activeAccount, fromNetwork])

  const toAddress = useMemo(() => {
    if (!activeAccount || !toNetwork) return undefined
    return getAddressByNetwork(activeAccount, toNetwork)
  }, [activeAccount, toNetwork])

  // Subscribe to quote stream
  const { isLoading: isQuoteLoading, error: quoteError } = useQuoteStreaming({
    fromToken,
    fromNetwork,
    toToken,
    toNetwork,
    fromAmount: amount,
    fromAddress,
    toAddress,
    // When auto slippage is enabled, pass undefined to let SDK determine optimal slippage
    // When manual, use the user's specified slippage value
    slippageBps: autoSlippage ? undefined : slippage * 100
  })

  // Method to select a specific quote or auto mode
  const selectQuoteById = useCallback(
    (quoteId: string | null) => {
      if (quoteId === null) {
        // User selected "Auto" - use SDK's bestQuote
        setUserQuote(null)
      } else {
        // User manually selected specific aggregator
        const selectedQuote = allQuotes.find(q => q.id === quoteId)
        setUserQuote(selectedQuote ?? null)
      }
    },
    [allQuotes, setUserQuote]
  )

  // Stub swap function - will be implemented in next phase
  const swap = useCallback(async () => {
    // userQuote takes precedence over bestQuote
    const selectedQuote = userQuote ?? bestQuote

    if (!selectedQuote) {
      throw new Error('No quote available')
    }

    // eslint-disable-next-line no-console
    console.log('Swap execution not yet implemented - coming in next phase')
    // eslint-disable-next-line no-console
    console.log({
      fromToken,
      toToken,
      amount,
      slippage,
      selectedQuote
    })

    setSwapStatus('Idle')
  }, [fromToken, toToken, amount, slippage, userQuote, bestQuote])

  const value: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    bestQuote,
    userQuote,
    allQuotes,
    isQuoteLoading,
    quoteError,
    selectQuoteById,
    swap,
    slippage,
    setSlippage,
    autoSlippage,
    setAutoSlippage,
    destination,
    setDestination,
    swapStatus,
    setAmount
  }

  return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>
}

export const useSwapContext = (): SwapContextState => {
  const context = useContext(SwapContext)
  if (context === undefined) {
    throw new Error('useSwapContext must be used within a SwapContextProvider')
  }
  return context
}
