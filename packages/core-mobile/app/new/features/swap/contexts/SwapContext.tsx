import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
import { useSelector } from 'react-redux'
import { TokenType } from '@avalabs/vm-module-types'
import { Account, selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { LocalTokenWithBalance } from 'store/balance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { transactionSnackbar } from 'new/common/utils/toast'
import useSolanaNetwork from 'hooks/earn/useSolanaNetwork'
import {
  NormalizedSwapQuoteResult,
  NormalizedSwapQuote,
  SwapProviders
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
  const activeAccount = useSelector(selectActiveAccount)
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [slippage, setSlippage] = useState<number>(1)
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

  // debounce since fetching quotes can take awhile
  const debouncedSetAmount = useDebouncedCallback(
    setAmount,
    DEFAULT_DEBOUNCE_MILLISECONDS
  )

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
      chainId
    }: {
      swapTxHash: string | undefined
      chainId: number
    }) => {
      setSwapStatus('Success')
      AnalyticsService.captureWithEncryption('SwapTransactionSucceeded', {
        txHash: swapTxHash ?? '',
        chainId
      })
      audioFeedback(Audios.Send)
    },
    []
  )

  const swap = useCallback(
    (specificProvider?: SwapProviders, specificQuote?: NormalizedSwapQuote) => {
      if (!activeAccount || !fromToken || !toToken || !quotes) {
        return
      }

      const quoteToUse = specificQuote || quotes.selected
      if (!quoteToUse) {
        return
      }

      const quote = quoteToUse.quote
      const swapProviderToUse = specificProvider || quotes.provider

      const fromTokenAddress = getTokenAddress(fromToken)
      const isFromTokenNative = fromToken.type === TokenType.NATIVE
      const toTokenAddress = getTokenAddress(toToken)
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
                fromTokenAddress,
                isFromTokenNative,
                toTokenAddress,
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
                fromTokenAddress,
                isToTokenNative,
                toTokenAddress,
                swapProvider: swapProviderToUse,
                quote,
                slippage
              })
            }

            if (swapTxHash && chainId) {
              handleSwapSuccess({
                swapTxHash: swapTxHash,
                chainId
              })
            }
          } catch (err) {
            setSwapStatus('Fail')
            if (!isUserRejectedError(err) && chainId && activeAccount) {
              // Check if there are more quotes available to try
              if (
                !manuallySelected &&
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
                    swap(swapProvider, nextQuote)
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
      handleSwapSuccess
    ]
  )

  const state: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    slippage,
    setSlippage,
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
