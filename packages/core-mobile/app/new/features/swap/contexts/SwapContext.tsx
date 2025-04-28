import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef
} from 'react'
import { JsonRpcError } from '@metamask/rpc-errors'
import { getSwapRate, getTokenAddress } from 'swap/getSwapRate'
import { SwapSide, OptimalRate } from '@paraswap/sdk'
import Logger from 'utils/Logger'
import { resolve } from '@avalabs/core-utils-sdk'
import { InteractionManager } from 'react-native'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { humanizeSwapError } from 'errors/swapError'
import { useAvalancheProvider } from 'hooks/networks/networkProviderHooks'
import { useSelector } from 'react-redux'
import { Account, selectActiveAccount } from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { getEvmCaip2ChainId } from 'utils/caip2ChainIds'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { RpcMethod } from '@avalabs/vm-module-types'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { useDebounce } from 'hooks/useDebounce'
import { humanizeParaswapRateError } from 'errors/swapError'
import { selectIsSwapFeesBlocked } from 'store/posthog'
import { performSwap } from 'contexts/SwapContext/performSwap/performSwap'
import { LocalTokenWithBalance } from 'store/balance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { transactionSnackbar } from 'new/common/utils/toast'
import { useSwapSelectedFromToken, useSwapSelectedToToken } from '../store'

const DEFAULT_DEBOUNCE_MILLISECONDS = 150

// success here just means the transaction was sent, not that it was successful/confirmed
export type SwapStatus = 'Idle' | 'Swapping' | 'Success' | 'Fail'

export type SwapParams = {
  srcTokenAddress: string
  isSrcTokenNative: boolean
  destTokenAddress: string
  isDestTokenNative: boolean
  priceRoute: OptimalRate
  swapSlippage: number
}

export interface SwapContextState {
  fromToken?: LocalTokenWithBalance
  toToken?: LocalTokenWithBalance
  setFromToken: Dispatch<LocalTokenWithBalance | undefined>
  setToToken: Dispatch<LocalTokenWithBalance | undefined>
  optimalRate?: OptimalRate
  setOptimalRate: Dispatch<OptimalRate | undefined>
  refresh: () => void
  swap(params: SwapParams): void
  slippage: number
  setSlippage: Dispatch<number>
  destination: SwapSide
  setDestination: Dispatch<SwapSide>
  swapStatus: SwapStatus
  setAmount: Dispatch<bigint | undefined>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
  isFetchingOptimalRate: boolean
}

export const SwapContext = createContext<SwapContextState>(
  {} as SwapContextState
)

export const SwapContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const abortControllerRef = useRef<AbortController | null>(null)
  const { request } = useInAppRequest()
  const cChainNetwork = useCChainNetwork()
  const activeAccount = useSelector(selectActiveAccount)
  const avalancheProvider = useAvalancheProvider()
  const [fromToken, setFromToken] = useSwapSelectedFromToken()
  const [toToken, setToToken] = useSwapSelectedToToken()
  const [optimalRate, setOptimalRate] = useState<OptimalRate>()
  const [error, setError] = useState('')
  const [slippage, setSlippage] = useState<number>(1)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')
  const [amount, setAmount] = useState<bigint>() //the amount that's gonna be passed to paraswap
  const [isFetchingOptimalRate, setIsFetchingOptimalRate] = useState(false)
  const { debounced: debouncedAmount } = useDebounce(
    amount,
    DEFAULT_DEBOUNCE_MILLISECONDS
  ) // debounce since fetching rates via paraswaps can take awhile
  const isSwapFeesBlocked = useSelector(selectIsSwapFeesBlocked)

  const getOptimalRateForAmount = useCallback(
    (account: Account, amnt: bigint) => {
      if (!cChainNetwork) {
        return Promise.reject('Invalid from network')
      }
      if (!fromToken || !('decimals' in fromToken))
        return Promise.reject('Invalid from token')

      if (!toToken || !('decimals' in toToken))
        return Promise.reject('Invalid to token')

      // abort previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // create new AbortController
      const controller = new AbortController()
      abortControllerRef.current = controller

      return getSwapRate({
        fromTokenAddress: getTokenAddress(fromToken),
        toTokenAddress: getTokenAddress(toToken),
        fromTokenDecimals: fromToken.decimals,
        toTokenDecimals: toToken.decimals,
        amount: amnt.toString(),
        swapSide: destination,
        network: cChainNetwork,
        account,
        abortSignal: controller.signal
      })
    },
    [cChainNetwork, destination, fromToken, toToken]
  )

  const getOptimalRate = useCallback(() => {
    if (activeAccount && debouncedAmount && debouncedAmount > 0n) {
      setIsFetchingOptimalRate(true)
      getOptimalRateForAmount(activeAccount, debouncedAmount)
        .then(({ optimalRate: opRate }) => {
          setError('')
          setOptimalRate(opRate)
        })
        .catch(reason => {
          if (reason.message !== 'Aborted') {
            setError(humanizeParaswapRateError(reason.message))
            setOptimalRate(undefined)
            Logger.error('failed to getSwapRate', reason)
          }
        })
        .finally(() => {
          setIsFetchingOptimalRate(false)
        })
    } else {
      setError('')
      setOptimalRate(undefined)
    }
  }, [activeAccount, debouncedAmount, getOptimalRateForAmount])

  useEffect(() => {
    //call getOptimalRate every time its params change to get fresh rates
    getOptimalRate()
  }, [getOptimalRate])

  const refresh = useCallback(() => {
    getOptimalRate()
  }, [getOptimalRate])

  const handleSwapError = useCallback(
    (account: Account, err: unknown) => {
      if (!cChainNetwork) {
        return
      }

      AnalyticsService.captureWithEncryption('SwapTransactionFailed', {
        address: account.addressC,
        chainId: cChainNetwork.chainId
      })

      const readableErrorMessage = humanizeSwapError(err)
      const originalError =
        err instanceof JsonRpcError ? err.data.cause : undefined

      transactionSnackbar.error({ message: readableErrorMessage })
      Logger.error(readableErrorMessage, originalError)
    },
    [cChainNetwork]
  )

  const handleSwapSuccess = useCallback(
    (swapTxHash: string | undefined) => {
      if (!cChainNetwork) {
        return
      }

      setSwapStatus('Success')
      AnalyticsService.captureWithEncryption('SwapTransactionSucceeded', {
        txHash: swapTxHash ?? '',
        chainId: cChainNetwork.chainId
      })
      audioFeedback(Audios.Send)
    },
    [cChainNetwork]
  )

  // eslint-disable-next-line sonarjs/cognitive-complexity
  function onSwap({
    srcTokenAddress,
    isSrcTokenNative,
    destTokenAddress,
    isDestTokenNative,
    priceRoute,
    swapSlippage
  }: SwapParams): void {
    setSwapStatus('Swapping')

    InteractionManager.runAfterInteractions(async () => {
      SentryWrapper.startSpan({ name: 'swap' }, async span => {
        if (!avalancheProvider || !activeAccount || !cChainNetwork) {
          return
        }

        resolve(
          performSwap({
            srcTokenAddress,
            isSrcTokenNative,
            destTokenAddress,
            isDestTokenNative,
            priceRoute,
            slippage: swapSlippage,
            activeNetwork: cChainNetwork,
            provider: avalancheProvider,
            signAndSend: txParams =>
              request({
                method: RpcMethod.ETH_SEND_TRANSACTION,
                params: txParams,
                chainId: getEvmCaip2ChainId(cChainNetwork.chainId)
              }),
            userAddress: activeAccount.addressC,
            isSwapFeesEnabled: !isSwapFeesBlocked
          })
        )
          .then(([result, err]) => {
            if (err || (result && 'error' in result)) {
              setSwapStatus('Fail')
              if (!isUserRejectedError(err)) {
                handleSwapError(activeAccount, err)
              }
            } else {
              handleSwapSuccess(result?.swapTxHash)
            }
          })
          .catch(Logger.error)
          .finally(() => {
            span?.end()
          })
      })
    })
  }

  const state: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    optimalRate,
    setOptimalRate,
    refresh,
    slippage,
    setSlippage,
    destination,
    setDestination,
    swap: onSwap,
    swapStatus,
    setAmount,
    error,
    isFetchingOptimalRate
  }

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export function useSwapContext(): SwapContextState {
  return useContext(SwapContext)
}
