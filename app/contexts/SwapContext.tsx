import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useState
} from 'react'
import { getSwapRate } from 'swap/getSwapRate'
import { SwapSide } from 'paraswap'
import { performSwap } from 'swap/performSwap'
import { OptimalRate } from 'paraswap-core'
import { TokenWithBalance } from 'store/balance'
import { useActiveNetwork } from 'hooks/useActiveNetwork'
import { useActiveAccount } from 'hooks/useActiveAccount'
import { BigNumber } from 'ethers'
import Logger from 'utils/Logger'

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
    destAmount: any,
    gasLimit: number,
    gasPrice: BigNumber,
    slippage: number
  ): Promise<
    | { error: any; result?: undefined }
    | { result: { swapTxHash: any; approveTxHash: any }; error?: undefined }
  >
  getRate: (
    srcToken?: TokenWithBalance,
    destToken?: TokenWithBalance,
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
      srcToken: fromToken,
      destToken: toToken,
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
      srcToken?: TokenWithBalance,
      destToken?: TokenWithBalance,
      amount?: string,
      swapSide?: SwapSide
    ) => {
      if (!activeAccount || !srcToken || !destToken || !amount || !swapSide) {
        return Promise.reject({
          error: 'no source token on request'
        })
      }

      return getSwapRate({
        srcToken,
        destToken,
        amount,
        swapSide,
        account: activeAccount,
        network: activeNetwork
      })
    },
    [activeNetwork, activeAccount]
  )

  const swap = useCallback(
    (
      srcTokenAddress: string,
      destTokenAddress: string,
      destDecimals: number,
      srcDecimals: number,
      amount: string,
      priceRoute: OptimalRate,
      destAmount,
      gasLimit: number,
      gasPrice: BigNumber,
      slippage: number
    ) => {
      return performSwap({
        srcToken: srcTokenAddress,
        destToken: destTokenAddress,
        srcDecimals,
        destDecimals,
        srcAmount: amount,
        optimalRate: priceRoute,
        destAmount,
        gasLimit,
        gasPrice,
        slippage,
        network: activeNetwork,
        account: activeAccount
      })
    },
    [activeAccount, activeNetwork]
  )

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
    swap,
    getRate
  }

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export function useSwapContext() {
  return useContext(SwapContext)
}
