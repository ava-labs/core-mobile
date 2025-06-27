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
import { humanizeSwapError } from 'errors/swapError'
import { useSelector } from 'react-redux'
import { TokenType } from '@avalabs/vm-module-types'
import { Account, selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { isParaswapQuote, SwapQuote, SwapQuoteUpdate, SwapType } from '../types'
import { useEvmSwap } from '../hooks/useEvmSwap'
import { getTokenAddress } from '../utils/getTokenAddress'
import { LocalTokenWithBalance } from 'store/balance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { transactionSnackbar } from 'new/common/utils/toast'
import { useAllRates, useBestRate, useSelectedSwapRate, useSwapSelectedFromToken, useSwapSelectedToToken } from '../store'

const DEFAULT_DEBOUNCE_MILLISECONDS = 300

// success here just means the transaction was sent, not that it was successful/confirmed
type SwapStatus = 'Idle' | 'Swapping' | 'Success' | 'Fail'

interface SwapContextState {
  fromToken?: LocalTokenWithBalance
  toToken?: LocalTokenWithBalance
  setFromToken: Dispatch<LocalTokenWithBalance | undefined>
  setToToken: Dispatch<LocalTokenWithBalance | undefined>
  swapType: SwapType | undefined
  setSwapType: Dispatch<SwapType | undefined>
  quote: SwapQuote | undefined // legacy
  selectedQuote: SwapQuote | undefined
  bestQuote: SwapQuote | undefined
  allQuotes: SwapQuote[] | undefined
  isFetchingQuote: boolean
  swap(): void
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
  const [swapType, setSwapType] = useState<SwapType>()
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [slippage, setSlippage] = useState<number>(1)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')
  const [amount, setAmount] = useState<bigint>()
  const [isFetchingQuote, setIsFetchingQuote] = useState(false)
  const [quote, setQuote] = useState<SwapQuote | undefined>() // legacy
  const [selectedQuote, setSelectedQuote] = useSelectedSwapRate()
  const [bestQuote, setBestQuote] = useBestRate()
  const [allQuotes, setAllQuotes] = useAllRates()
  const [error, setError] = useState('')
  const cChainNetwork = useCChainNetwork()
  const { getQuote: getEvmQuote, swap: evmSwap } = useEvmSwap()

  // debounce since fetching quotes can take awhile
  const debouncedSetAmount = useDebouncedCallback(
    setAmount,
    DEFAULT_DEBOUNCE_MILLISECONDS
  )

  const getQuote = useCallback(async () => {
    const isValidFromToken = fromToken && 'decimals' in fromToken
    const isValidToToken = toToken && 'decimals' in toToken

    if (
      !activeAccount ||
      !swapType ||
      !amount ||
      amount <= 0n ||
      !isValidFromToken ||
      !isValidToToken
    ) {
      setError('')
      setQuote(undefined)
      setSelectedQuote(undefined)
      setBestQuote(undefined)
      setAllQuotes(undefined)
      return
    }

    try {
      setIsFetchingQuote(true)
      let tempQuote: SwapQuote | undefined

      if (swapType === SwapType.EVM) {
        if (!cChainNetwork) {
          throw new Error('Invalid network')
        }

        tempQuote = await getEvmQuote({
          account: activeAccount,
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
          onUpdate: (update: SwapQuoteUpdate) => {
            setAllQuotes(update.allQuotes)
            setBestQuote(update.bestQuote)
            setSelectedQuote({ ...update.bestQuote, aggregator: { id: 'auto', name: 'Auto' } })
          }
        })
      } else {
        throw new Error(`Unsupported swap type: ${swapType}`)
      }

      if (tempQuote) {
        setError('')
        if (isParaswapQuote(tempQuote)) {
          setQuote(tempQuote)
        }
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
    swapType,
    slippage
  ])

  useEffect(() => {
    //call getQuote every time its params change to get fresh rates
    getQuote()
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const swap = useCallback(() => {
    if (!activeAccount || !fromToken || !toToken || !swapType || (!quote && !selectedQuote)) {
      return
    }

    const quoteToUse = quote || selectedQuote
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

          if (swapType === SwapType.EVM) {
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
              quote: quoteToUse!,
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
  }, [
    activeAccount,
    swapType,
    quote,
    selectedQuote,
    slippage,
    cChainNetwork,
    evmSwap,
    fromToken,
    toToken,
    handleSwapError,
    handleSwapSuccess
  ])

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
    swapType,
    setSwapType,
    error,
    quote,
    selectedQuote,
    bestQuote,
    allQuotes,
    isFetchingQuote
  }

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export function useSwapContext(): SwapContextState {
  return useContext(SwapContext)
}
