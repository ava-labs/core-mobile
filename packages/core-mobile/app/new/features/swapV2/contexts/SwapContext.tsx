import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
  useMemo
} from 'react'
import { SwapSide } from '@paraswap/sdk'
import { LocalTokenWithBalance } from 'store/balance'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { transactionSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import { selectMarkrSwapMaxRetries } from 'store/posthog'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { swapCompleted } from 'store/nestEgg'
import type { Quote, Transfer } from '../types'
import {
  useSwapSelectedFromToken,
  useSwapSelectedToToken,
  useBestQuote,
  useUserSelectedQuote,
  useAllQuotes,
  useFusionTransfers
} from '../hooks/useZustandStore'
import { useQuoteStreaming } from '../hooks/useQuoteStreaming'
import FusionService from '../services/FusionService'
import {
  isUserRejectionError,
  shouldRetryWithNextQuote,
  getSwapErrorMessage
} from '../utils/swapErrors'

const DEFAULT_SLIPPAGE = 0.2

export enum SwapStatus {
  Idle = 'Idle',
  Swapping = 'Swapping',
  Success = 'Success',
  Fail = 'Fail'
}

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
  const dispatch = useDispatch()
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE)
  const [autoSlippage, setAutoSlippage] = useState<boolean>(true)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>(SwapStatus.Idle)
  const isSwappingRef = useRef(false)
  const [amount, setAmount] = useState<bigint>()

  // Get quotes
  const [bestQuote] = useBestQuote()
  const [selectedQuote, setSelectedQuote] = useUserSelectedQuote()
  const [allQuotes] = useAllQuotes()

  // Transfer storage
  const [, setTransfers] = useFusionTransfers()

  // Derive the actual selected quote from allQuotes with fallback matching
  // Strategy:
  // 1. Try to match by exact quoteId (preferred - same quote after refresh)
  // 2. Fallback to serviceType + aggregatorId (same provider after refresh)
  // This ensures quote selection persists across quote updates (slippage/expiry)
  const userQuote = useMemo(() => {
    if (!selectedQuote) return null

    // Try exact match first
    const exactMatch = allQuotes.find(q => q.id === selectedQuote.quoteId)
    if (exactMatch) return exactMatch

    // Fallback: match by serviceType + aggregatorId
    const fallbackMatch = allQuotes.find(
      q =>
        q.serviceType === selectedQuote.serviceType &&
        q.aggregator.id === selectedQuote.aggregatorId
    )

    return fallbackMatch ?? null
  }, [selectedQuote, allQuotes])

  // Get account and networks
  const activeAccount = useSelector(selectActiveAccount)
  const maxRetries = useSelector(selectMarkrSwapMaxRetries)
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
        // Clear selection (Auto mode)
        setSelectedQuote(null)
        return
      }

      // Find the quote to extract serviceType and aggregatorId
      const quote = allQuotes.find(q => q.id === quoteId)
      if (!quote) {
        setSelectedQuote(null)
        return
      }

      // Store all identifiers for fallback matching
      setSelectedQuote({
        quoteId: quote.id,
        serviceType: quote.serviceType,
        aggregatorId: quote.aggregator.id
      })
    },
    [allQuotes, setSelectedQuote]
  )

  // Handle swap success: logging, storage, and analytics
  const handleSwapSuccess = useCallback(
    (params: {
      transfer: Transfer
      quote: Quote
      address: string
      fromTokenData: LocalTokenWithBalance
      toTokenData: LocalTokenWithBalance
    }) => {
      const { transfer, quote, address, fromTokenData, toTokenData } = params
      audioFeedback(Audios.Send)
      AnalyticsService.captureWithEncryption('SwapConfirmed', {
        address,
        chainId: quote.sourceChain.chainId,
        txHash: transfer.id
      })

      Logger.info('[SwapContext] transfer executed', {
        transfer
      })

      // Store transfer in Zustand for tracking
      setTransfers(prev => ({
        ...prev,
        [transfer.id]: {
          transfer,
          fromToken: {
            localId: fromTokenData.localId,
            internalId: fromTokenData.internalId,
            logoUri: fromTokenData.logoUri
          },
          toToken: {
            localId: toTokenData.localId,
            internalId: toTokenData.internalId,
            logoUri: toTokenData.logoUri
          },
          timestamp: Date.now()
        }
      }))

      setSwapStatus(SwapStatus.Success)

      // Dispatch swapCompleted for Nest Egg qualification tracking
      const swapTxHash = transfer.source?.txHash
      if (
        swapTxHash &&
        transfer.amountIn &&
        fromTokenData.priceInCurrency &&
        'decimals' in fromTokenData
      ) {
        // Calculate USD amount from the quote for Nest Egg tracking
        // amountIn is the swap amount in token units (as string)

        // Convert amount from token units to decimal value
        const amountDecimal =
          Number(transfer.amountIn) / Math.pow(10, fromTokenData.decimals)
        const fromAmountUsd = amountDecimal * fromTokenData.priceInCurrency

        dispatch(
          swapCompleted({
            txHash: swapTxHash,
            chainId: Number(quote.sourceChain.chainId.split(':')[1]),
            fromTokenSymbol: fromTokenData.symbol,
            toTokenSymbol: toTokenData.symbol,
            fromAmountUsd,
            toAmountUsd: fromAmountUsd
          })
        )
      }
    },
    [dispatch, setTransfers]
  )

  // Handle swap error: logging, toast, and analytics
  const handleSwapError = useCallback(
    (error: unknown, quote: Quote, address: string) => {
      setSwapStatus(SwapStatus.Fail)

      // Show error toast (only for non-transaction errors)
      transactionSnackbar.error({
        message: 'Swap failed',
        error: getSwapErrorMessage(error)
      })

      AnalyticsService.captureWithEncryption('SwapFailed', {
        address,
        chainId: quote.sourceChain.chainId
      })

      Logger.error('Swap execution failed', error)
    },
    []
  )

  // Swap execution with retry logic
  const swap = useCallback(
    // eslint-disable-next-line sonarjs/cognitive-complexity
    async (retryQuote?: Quote, retries = 0) => {
      // Guard against concurrent swap executions (ref is synchronous, unlike state)
      if (isSwappingRef.current) return
      if (retries === 0) isSwappingRef.current = true

      // Determine which quote to use (retry or normal flow)
      const quoteToUse = retryQuote ?? userQuote ?? bestQuote

      if (!quoteToUse) {
        throw new Error('No quote available')
      }

      if (!fromToken || !toToken) {
        throw new Error('Tokens not selected')
      }

      if (!fromAddress || !toAddress) {
        throw new Error('Addresses not specified')
      }

      setSwapStatus(SwapStatus.Swapping)

      try {
        const transfer = await FusionService.transferAsset(quoteToUse)

        if (transfer.status === 'failed') {
          const reason =
            transfer.errorReason ?? transfer.errorCode ?? 'Unknown reason'
          throw new Error(`Transfer failed: ${reason}`)
        }

        isSwappingRef.current = false
        handleSwapSuccess({
          transfer,
          quote: quoteToUse,
          address: fromAddress,
          fromTokenData: fromToken,
          toTokenData: toToken
        })
      } catch (error) {
        // Handle user rejection - silent exit, no error shown
        if (isUserRejectionError(error)) {
          isSwappingRef.current = false
          setSwapStatus(SwapStatus.Idle)
          return
        }

        Logger.info('[SwapContext] error occurred during swap', error)

        // Auto-retry with next quote (only if using auto mode and under retry limit)
        if (
          !userQuote &&
          retries < maxRetries &&
          allQuotes.length > 1 &&
          shouldRetryWithNextQuote(error)
        ) {
          const currentIndex = allQuotes.findIndex(q => q.id === quoteToUse.id)
          const nextQuote = allQuotes[currentIndex + 1]

          if (nextQuote) {
            Logger.info('[SwapContext] retrying with next quote:', {
              failed: quoteToUse.aggregator.name,
              retrying: nextQuote.aggregator.name,
              attempt: retries + 1,
              maxRetries
            })
            // Recursive retry
            return swap(nextQuote, retries + 1)
          }
        }

        // All retries exhausted or non-retryable error
        isSwappingRef.current = false
        handleSwapError(error, quoteToUse, fromAddress)
      }
    },
    [
      fromToken,
      toToken,
      fromAddress,
      toAddress,
      userQuote,
      bestQuote,
      allQuotes,
      maxRetries,
      handleSwapSuccess,
      handleSwapError
    ]
  )

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
