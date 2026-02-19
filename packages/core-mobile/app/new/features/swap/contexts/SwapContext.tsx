import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { JsonRpcError } from '@metamask/rpc-errors'
import { SwapSide } from '@paraswap/sdk'
import { useDebouncedCallback } from 'use-debounce'
import Logger from 'utils/Logger'
import { InteractionManager } from 'react-native'
import SentryWrapper from 'services/sentry/SentryWrapper'
import {
  humanizeSwapError,
  isGasEstimationError,
  isSwapTxBuildError
} from 'errors/swapError'
import { useDispatch, useSelector } from 'react-redux'
import { TokenType } from '@avalabs/vm-module-types'
import { Account, selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { LocalTokenWithBalance } from 'store/balance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { transactionSnackbar } from 'new/common/utils/toast'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import { selectMarkrSwapMaxRetries } from 'store/posthog'
import { swapCompleted } from 'store/nestEgg'
import {
  NormalizedSwapQuoteResult,
  NormalizedSwapQuote,
  SwapProviders,
  isMarkrQuote
} from '../types'
import { useEvmSwap } from '../hooks/useEvmSwap'
import { getTokenAddress } from '../utils/getTokenAddress'
import {
  useManuallySelected,
  useQuotes,
  useSwapSelectedFromToken,
  useSwapSelectedToToken
} from '../store'
import { SWAP_REFRESH_INTERVAL } from '../consts'
import { isEvmSwapQuote, isSvmSwapQuote } from '../types'
import { useSolanaSwap } from '../hooks/useSolanaSwap'

const DEFAULT_DEBOUNCE_MILLISECONDS = 300
const DEFAULT_SLIPPAGE = 0.2

// success here just means the transaction was sent, not that it was successful/confirmed
type SwapStatus = 'Idle' | 'Swapping' | 'Success' | 'Fail'

interface SwapContextState {
  fromToken?: LocalTokenWithBalance
  toToken?: LocalTokenWithBalance
  setFromToken: Dispatch<LocalTokenWithBalance | undefined>
  setToToken: Dispatch<LocalTokenWithBalance | undefined>
  quotes: NormalizedSwapQuoteResult | undefined
  isFetchingQuote: boolean
  swap(
    specificProvider?: SwapProviders,
    specificQuote?: NormalizedSwapQuote
  ): void
  slippage: number
  setSlippage: Dispatch<number>
  autoSlippage: boolean
  setAutoSlippage: Dispatch<boolean>
  destination: SwapSide
  setDestination: Dispatch<SwapSide>
  swapStatus: SwapStatus
  setAmount: Dispatch<bigint | undefined>
  error: string
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
  const activeAccount = useSelector(selectActiveAccount)
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE)
  const [autoSlippage, setAutoSlippage] = useState<boolean>(true)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')
  const [amount, setAmount] = useState<bigint>()
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [quotes, setQuotes] = useQuotes()
  const [manuallySelected, setManuallySelected] = useManuallySelected()
  const [error, setError] = useState('')
  const cChainNetwork = useCChainNetwork()
  const { getQuote: getEvmQuote, swap: evmSwap } = useEvmSwap()
  const solanaNetwork = useSolanaNetwork()
  const { getQuote: getSvmQuote, swap: svmSwap } = useSolanaSwap()
  const maxRetries = useSelector(selectMarkrSwapMaxRetries)

  // debounce since fetching quotes can take awhile
  const debouncedSetAmount = useDebouncedCallback(
    setAmount,
    DEFAULT_DEBOUNCE_MILLISECONDS
  )

  // Get token addresses for dependency tracking
  const fromTokenAddress = fromToken ? getTokenAddress(fromToken) : undefined
  const toTokenAddress = toToken ? getTokenAddress(toToken) : undefined

  // Reset slippage to default when either token changes
  useEffect(() => {
    setSlippage(DEFAULT_SLIPPAGE)
    setAutoSlippage(true)
  }, [fromTokenAddress, toTokenAddress])

  // Extract recommendedSlippage value to use as dependency
  const recommendedSlippage = useMemo(() => {
    const quote = quotes?.selected?.quote
    if (quote && isMarkrQuote(quote)) {
      return quote.recommendedSlippage
    }
    return undefined
  }, [quotes])

  // Auto-update slippage when auto mode is enabled
  useEffect(() => {
    if (!autoSlippage) return

    // Don't do anything if quotes are undefined (during fetching)
    if (!quotes) return

    // Try to use recommendedSlippage from quote
    if (recommendedSlippage) {
      // Convert bps to percentage: 200 bps → 2%
      const recommendedPercentage = recommendedSlippage / 100
      // Only use if valid (greater than 0) AND different from current
      if (recommendedPercentage > 0 && slippage !== recommendedPercentage) {
        setSlippage(recommendedPercentage)
      }
      return
    }

    // Fallback to default when auto is enabled but no valid recommendedSlippage
    if (slippage !== DEFAULT_SLIPPAGE) {
      setSlippage(DEFAULT_SLIPPAGE)
    }
  }, [autoSlippage, recommendedSlippage, slippage, quotes])

  const getQuote = useCallback(async () => {
    const isValidFromToken = fromToken && 'decimals' in fromToken
    const isValidToToken = toToken && 'decimals' in toToken

    if (
      !cChainNetwork ||
      !solanaNetwork ||
      !activeAccount ||
      !amount ||
      amount <= 0n ||
      !isValidFromToken ||
      !isValidToToken ||
      fromToken.networkChainId !== toToken.networkChainId
    ) {
      setError('')
      setQuotes(undefined)
      return
    }

    try {
      setIsFetchingQuote(true)
      let tempQuote: NormalizedSwapQuoteResult | undefined

      setQuotes(undefined)

      if (fromToken.networkChainId === cChainNetwork.chainId) {
        tempQuote = await getEvmQuote({
          address: activeAccount.addressC,
          network: cChainNetwork,
          amount,
          fromTokenAddress: getTokenAddress(fromToken),
          fromTokenDecimals: fromToken.decimals,
          isFromTokenNative: fromToken.type === TokenType.NATIVE,
          toTokenAddress: getTokenAddress(toToken),
          toTokenDecimals: toToken.decimals,
          isToTokenNative: toToken.type === TokenType.NATIVE,
          destination,
          slippage,
          onUpdate: (update: NormalizedSwapQuoteResult) => {
            setManuallySelected(false)
            setQuotes(update)
          }
        })
      } else if (fromToken.networkChainId === solanaNetwork.chainId) {
        tempQuote = await getSvmQuote({
          amount,
          fromTokenAddress: getTokenAddress(fromToken),
          fromTokenDecimals: fromToken.decimals,
          fromTokenBalance: fromToken.balance,
          toTokenAddress: getTokenAddress(toToken),
          toTokenDecimals: toToken.decimals,
          destination,
          network: solanaNetwork,
          slippage
        })
      }

      if (tempQuote) {
        setError('')
        setManuallySelected(false)
        setQuotes(tempQuote)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      Logger.error('Failed to fetch quote', err)
    } finally {
      setIsFetchingQuote(false)
    }
  }, [
    activeAccount,
    cChainNetwork,
    amount,
    destination,
    fromToken,
    toToken,
    getEvmQuote,
    slippage,
    setManuallySelected,
    setQuotes,
    getSvmQuote,
    solanaNetwork
  ])

  useEffect(() => {
    //call getQuote every time its params change to get fresh rates
    getQuote()

    // Auto-refresh quotes every 30 seconds
    const intervalId = setInterval(() => {
      getQuote()
    }, SWAP_REFRESH_INTERVAL)

    return () => {
      clearInterval(intervalId)
    }
  }, [getQuote])

  const handleSwapError = useCallback(
    ({
      account,
      chainId,
      err
    }: {
      account: Account
      chainId: number
      err: unknown
    }) => {
      if (!cChainNetwork) {
        return
      }

      AnalyticsService.captureWithEncryption('SwapTransactionFailed', {
        address: account.addressC,
        chainId
      })

      const readableErrorMessage = humanizeSwapError(err)
      const originalError =
        err instanceof JsonRpcError ? err.data.cause : undefined

      transactionSnackbar.error({ error: readableErrorMessage })
      Logger.error(readableErrorMessage, originalError)
    },
    [cChainNetwork]
  )

  const handleSwapSuccess = useCallback(
    ({
      swapTxHash,
      chainId,
      fromTokenInfo,
      toTokenInfo,
      fromAmountUsd,
      toAmountUsd
    }: {
      swapTxHash: string | undefined
      chainId: number
      fromTokenInfo?: { symbol: string }
      toTokenInfo?: { symbol: string }
      fromAmountUsd?: number
      toAmountUsd?: number
    }) => {
      setSwapStatus('Success')
      AnalyticsService.captureWithEncryption('SwapTransactionSucceeded', {
        txHash: swapTxHash ?? '',
        chainId
      })
      audioFeedback(Audios.Send)

      // Dispatch swapCompleted for Nest Egg qualification tracking
      if (
        swapTxHash &&
        fromTokenInfo &&
        toTokenInfo &&
        fromAmountUsd !== undefined
      ) {
        dispatch(
          swapCompleted({
            txHash: swapTxHash,
            chainId,
            fromTokenSymbol: fromTokenInfo.symbol,
            toTokenSymbol: toTokenInfo.symbol,
            fromAmountUsd,
            toAmountUsd: toAmountUsd ?? 0
          })
        )
      }
    },
    [dispatch]
  )

  const swap = useCallback(
    (
      specificProvider?: SwapProviders,
      specificQuote?: NormalizedSwapQuote,
      retries = 0
      // eslint-disable-next-line sonarjs/cognitive-complexity
    ) => {
      if (!activeAccount || !fromToken || !toToken || !quotes) {
        return
      }

      const quoteToUse = specificQuote || quotes.selected
      if (!quoteToUse) {
        return
      }

      const quote = quoteToUse.quote
      const swapProviderToUse = specificProvider || quotes.provider

      const from = getTokenAddress(fromToken)
      const isFromTokenNative = fromToken.type === TokenType.NATIVE
      const to = getTokenAddress(toToken)
      const isToTokenNative = toToken.type === TokenType.NATIVE

      InteractionManager.runAfterInteractions(async () => {
        let chainId: number | undefined

        SentryWrapper.startSpan({ name: 'swap' }, async span => {
          try {
            setSwapStatus('Swapping')

            let swapTxHash: string | undefined

            if (isEvmSwapQuote(quote)) {
              if (!cChainNetwork) {
                throw new Error('Invalid network')
              }

              chainId = cChainNetwork.chainId

              swapTxHash = await evmSwap({
                account: activeAccount,
                network: cChainNetwork,
                fromTokenAddress: from,
                isFromTokenNative,
                toTokenAddress: to,
                isToTokenNative,
                swapProvider: swapProviderToUse,
                quote,
                slippage
              })
            } else if (isSvmSwapQuote(quote)) {
              if (!solanaNetwork) {
                throw new Error('Invalid network')
              }

              chainId = solanaNetwork.chainId

              swapTxHash = await svmSwap({
                account: activeAccount,
                network: solanaNetwork,
                isFromTokenNative,
                fromTokenAddress: from,
                isToTokenNative,
                toTokenAddress: to,
                swapProvider: swapProviderToUse,
                quote,
                slippage
              })
            }

            if (swapTxHash && chainId) {
              // Calculate USD amount from the quote for Nest Egg tracking
              // amountIn is the swap amount in token units (as string)
              const amountIn = quoteToUse.metadata.amountIn
              let fromAmountUsd = 0

              if (
                amountIn &&
                fromToken.priceInCurrency &&
                'decimals' in fromToken
              ) {
                // Convert amount from token units to decimal value
                const amountDecimal =
                  Number(amountIn) / Math.pow(10, fromToken.decimals)
                fromAmountUsd = amountDecimal * fromToken.priceInCurrency
              }

              handleSwapSuccess({
                swapTxHash: swapTxHash,
                chainId,
                fromTokenInfo: { symbol: fromToken.symbol },
                toTokenInfo: { symbol: toToken.symbol },
                fromAmountUsd,
                toAmountUsd: fromAmountUsd
              })
            }
          } catch (err) {
            setSwapStatus('Fail')
            if (!isUserRejectedError(err) && chainId && activeAccount) {
              // Check if there are more quotes available to try
              if (
                !manuallySelected &&
                quotes.provider === SwapProviders.MARKR &&
                retries < maxRetries &&
                (isSwapTxBuildError(err) || isGasEstimationError(err)) &&
                quotes.quotes.length > 1
              ) {
                const currentQuoteIndex = quotes.quotes.findIndex(
                  q => q === quoteToUse
                )
                const nextQuoteIndex = currentQuoteIndex + 1

                if (nextQuoteIndex < quotes.quotes.length) {
                  // Try the next quote automatically
                  const nextQuote = quotes.quotes[nextQuoteIndex]
                  const swapProvider = quotes.provider
                  if (nextQuote) {
                    setQuotes({
                      ...quotes,
                      selected: nextQuote
                    })

                    // Retry swap with next quote without showing error
                    swap(swapProvider, nextQuote, retries + 1)
                    return // Don't handle error since we're retrying
                  }
                }
              }

              // No more quotes to try, handle the error
              handleSwapError({
                account: activeAccount,
                chainId,
                err
              })
            }
          } finally {
            span?.end()
          }
        })
      })
    },
    [
      activeAccount,
      quotes,
      setQuotes,
      slippage,
      cChainNetwork,
      solanaNetwork,
      evmSwap,
      svmSwap,
      fromToken,
      toToken,
      handleSwapError,
      handleSwapSuccess,
      manuallySelected,
      maxRetries
    ]
  )

  const state: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    slippage,
    setSlippage,
    autoSlippage,
    setAutoSlippage,
    destination,
    setDestination,
    swap,
    swapStatus,
    setAmount: debouncedSetAmount,
    error,
    quotes,
    isFetchingQuote
  }

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export function useSwapContext(): SwapContextState {
  return useContext(SwapContext)
}
