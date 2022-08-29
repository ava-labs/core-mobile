import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useState
} from 'react'
import { getSwapRate, getTokenAddress } from 'swap/getSwapRate'
import { SwapSide } from 'paraswap'
import { performSwap } from 'swap/performSwap'
import { OptimalRate } from 'paraswap-core'
import { TokenWithBalance } from 'store/balance'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { BigNumber } from 'ethers'
import Logger from 'utils/Logger'
import { showSnackBarCustom, updateSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { resolve } from '@avalabs/utils-sdk'

export type SwapStatus = 'Idle' | 'Preparing' | 'Swapping' | 'Success' | 'Fail'

export interface SwapContextState {
  fromToken?: TokenWithBalance
  toToken?: TokenWithBalance
  setFromToken: Dispatch<TokenWithBalance | undefined>
  setToToken: Dispatch<TokenWithBalance | undefined>
  optimalRate?: OptimalRate
  setOptimalRate: Dispatch<OptimalRate | undefined>
  refresh: () => void
  swap(
    srcTokenAddr: string,
    destTokenAddress: string,
    destDecimals: number,
    srcDecimals: number,
    amount: string,
    priceRoute: OptimalRate,
    gasLimit: number,
    gasPrice: BigNumber,
    slippage: number
  ): void
  getRate: (
    fromTokenAddress?: string,
    toTokenAddress?: string,
    fromTokenDecimals?: number,
    toTokenDecimals?: number,
    amount?: string,
    swapSide?: SwapSide
  ) => Promise<
    | { error: any; optimalRate?: undefined; destAmount?: undefined }
    | { optimalRate: OptimalRate; destAmount: any; error?: undefined }
  >
  gasPrice: BigNumber
  setGasPrice: Dispatch<BigNumber>
  gasLimit: number
  setGasLimit: Dispatch<number>
  rate: number
  setRate: Dispatch<number>
  slippage: number
  setSlippage: Dispatch<number>
  destination: 'from' | 'to'
  setDestination: Dispatch<'from' | 'to'>
  swapStatus: SwapStatus
}

export const SwapContext = createContext<SwapContextState>({} as any)

export const SwapContextProvider = ({ children }: { children: any }) => {
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const [fromToken, setFromToken] = useState<TokenWithBalance>()
  const [toToken, setToToken] = useState<TokenWithBalance>()
  const [optimalRate, setOptimalRate] = useState<OptimalRate>()
  const [gasLimit, setGasLimit] = useState<number>(0)
  // gas price is in nAvax
  const [gasPrice, setGasPrice] = useState<BigNumber>(BigNumber.from(0))
  const [rate, setRate] = useState<number>(0)
  const [slippage, setSlippage] = useState<number>(1)
  const [destination, setDestination] = useState<'from' | 'to'>('from')
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')

  const refresh = () => {
    if (
      !activeAccount ||
      !fromToken ||
      !toToken ||
      !optimalRate ||
      !destination
    ) {
      return
    }

    getSwapRate({
      fromTokenAddress: getTokenAddress(fromToken),
      toTokenAddress: getTokenAddress(toToken),
      fromTokenDecimals: fromToken?.decimals,
      toTokenDecimals: toToken?.decimals,
      amount: optimalRate?.srcAmount,
      swapSide: destination === 'to' ? SwapSide.SELL : SwapSide.BUY,
      network: activeNetwork,
      account: activeAccount
    })
      .then(({ optimalRate }) => {
        if (optimalRate) {
          setOptimalRate(optimalRate)
        }
      })
      .catch(reason => {
        Logger.warn('Error refreshing swap rate', reason)
      })
  }

  const getRate = useCallback(
    (
      fromTokenAddress?: string,
      toTokenAddress?: string,
      fromTokenDecimals?: number,
      toTokenDecimals?: number,
      amount?: string,
      swapSide?: SwapSide
    ) => {
      if (
        !activeAccount ||
        !fromTokenAddress ||
        !toTokenAddress ||
        !amount ||
        !swapSide
      ) {
        return Promise.reject({
          error: 'no source token on request'
        })
      }

      return getSwapRate({
        fromTokenAddress,
        toTokenAddress,
        fromTokenDecimals,
        toTokenDecimals,
        amount,
        swapSide,
        account: activeAccount,
        network: activeNetwork
      })
    },
    [activeNetwork, activeAccount]
  )

  function onSwap(
    srcTokenAddress: string,
    destTokenAddress: string,
    destDecimals: number,
    srcDecimals: number,
    amount: string,
    priceRoute: OptimalRate,
    gasLimit: number,
    gasPrice: BigNumber,
    slippage: number
  ) {
    setSwapStatus('Preparing')

    const toastId = Math.random().toString()
    setSwapStatus('Swapping')

    showSnackBarCustom({
      component: (
        <TransactionToast
          message={'Swap in progress...'}
          type={TransactionToastType.PENDING}
          toastId={toastId}
        />
      ),
      duration: 'infinite',
      id: toastId
    })

    resolve(
      performSwap({
        srcToken: srcTokenAddress,
        destToken: destTokenAddress,
        srcDecimals,
        destDecimals,
        srcAmount: amount,
        optimalRate: priceRoute,
        gasLimit,
        gasPrice,
        slippage,
        network: activeNetwork,
        account: activeAccount
      })
    ).then(([result, error]) => {
      if (error || (result && 'error' in result)) {
        setSwapStatus('Fail')
        updateSnackBarCustom(
          toastId,
          <TransactionToast
            message={'Swap failed'}
            type={TransactionToastType.ERROR}
            toastId={toastId}
          />
        )
      } else {
        setSwapStatus('Success')
        updateSnackBarCustom(
          toastId,
          <TransactionToast
            message={'Swap success'}
            type={TransactionToastType.SUCCESS}
            txHash={result?.result?.swapTxHash}
            toastId={toastId}
          />
        )
      }
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
    rate,
    setRate,
    gasPrice,
    setGasPrice,
    gasLimit,
    setGasLimit,
    slippage,
    setSlippage,
    destination,
    setDestination,
    swap: onSwap,
    getRate,
    swapStatus
  }

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export function useSwapContext() {
  return useContext(SwapContext)
}
