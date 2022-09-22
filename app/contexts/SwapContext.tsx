import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { resolve } from '@avalabs/utils-sdk'
import { Amount } from 'screens/swap/SwapView'
import { InteractionManager } from 'react-native'

export type SwapStatus = 'Idle' | 'Preparing' | 'Swapping' | 'Success' | 'Fail'

export interface SwapContextState {
  fromToken?: TokenWithBalance
  toToken?: TokenWithBalance
  setFromToken: Dispatch<TokenWithBalance | undefined>
  setToToken: Dispatch<TokenWithBalance | undefined>
  optimalRate?: OptimalRate
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

  gasPrice: BigNumber
  setGasPrice: Dispatch<BigNumber>
  gasLimit: number
  setCustomGasLimit: (limit: number) => void
  slippage: number
  setSlippage: Dispatch<number>
  destination: SwapSide
  setDestination: Dispatch<SwapSide>
  swapStatus: SwapStatus
  setAmount: Dispatch<Amount>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
  isFetchingOptimalRate: boolean
  getOptimalRateForAmount: (
    amnt: Amount | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<{ optimalRate?: OptimalRate; error?: any }>
}

export const SwapContext = createContext<SwapContextState>(
  {} as SwapContextState
)

export const SwapContextProvider = ({ children }: { children: ReactNode }) => {
  const activeAccount = useActiveAccount()
  const activeNetwork = useActiveNetwork()
  const [fromToken, setFromToken] = useState<TokenWithBalance>()
  const [toToken, setToToken] = useState<TokenWithBalance>()
  const [optimalRate, setOptimalRate] = useState<OptimalRate>()
  const [error, setError] = useState('')
  const [gasLimit, setGasLimit] = useState<number>(0)
  const [isCustomGasLimitSet, setIsCustomGasLimitSet] = useState(false)
  // gas price is in nAvax
  const [gasPrice, setGasPrice] = useState<BigNumber>(BigNumber.from(0))
  const [slippage, setSlippage] = useState<number>(1)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')
  const [amount, setAmount] = useState<Amount | undefined>(undefined) //the amount that's gonna be passed to paraswap
  const [isFetchingOptimalRate, setIsFetchingOptimalRate] = useState(false)

  const getOptimalRateForAmount = useCallback(
    (amnt: Amount | undefined) => {
      if (activeAccount && amnt) {
        return getSwapRate({
          fromTokenAddress: getTokenAddress(fromToken),
          toTokenAddress: getTokenAddress(toToken),
          fromTokenDecimals: fromToken?.decimals,
          toTokenDecimals: toToken?.decimals,
          amount: amnt.bn.toString(),
          swapSide: destination,
          network: activeNetwork,
          account: activeAccount
        })
      } else {
        return Promise.reject('invalid data')
      }
    },
    [activeAccount, activeNetwork, destination, fromToken, toToken]
  )

  const getOptimalRate = useCallback(() => {
    if (activeAccount && amount) {
      setIsFetchingOptimalRate(true)
      getOptimalRateForAmount(amount)
        .then(({ optimalRate: opRate, error: err }) => {
          setError(err)
          setOptimalRate(opRate)
          if (!isCustomGasLimitSet) {
            setGasLimit(Number(opRate?.gasCost ?? 0))
          }
        })
        .catch(reason => {
          setOptimalRate(undefined)
          Logger.warn('Error getSwapRate', reason)
        })
        .finally(() => {
          setIsFetchingOptimalRate(false)
        })
    }
  }, [activeAccount, amount, getOptimalRateForAmount, isCustomGasLimitSet])

  useEffect(() => {
    //call getOptimalRate every time its params change to get fresh rates
    getOptimalRate()
  }, [getOptimalRate])

  const refresh = useCallback(() => {
    getOptimalRate()
  }, [getOptimalRate])

  function onSwap(
    srcTokenAddress: string,
    destTokenAddress: string,
    destDecimals: number,
    srcDecimals: number,
    swapAmount: string,
    priceRoute: OptimalRate,
    swapGasLimit: number,
    swapGasPrice: BigNumber,
    swapSlippage: number
  ) {
    setSwapStatus('Preparing')
    setSwapStatus('Swapping')

    showSnackBarCustom({
      component: (
        <TransactionToast
          message={'Swap Pending...'}
          type={TransactionToastType.PENDING}
        />
      ),
      duration: 'short'
    })

    InteractionManager.runAfterInteractions(() => {
      resolve(
        performSwap({
          srcToken: srcTokenAddress,
          destToken: destTokenAddress,
          srcDecimals,
          destDecimals,
          srcAmount: swapAmount,
          optimalRate: priceRoute,
          gasLimit: swapGasLimit,
          gasPrice: swapGasPrice,
          slippage: swapSlippage,
          network: activeNetwork,
          account: activeAccount
        })
      ).then(([result, err]) => {
        if (err || (result && 'error' in result)) {
          setSwapStatus('Fail')
          showSnackBarCustom({
            component: (
              <TransactionToast
                message={'Swap Failed'}
                type={TransactionToastType.ERROR}
              />
            ),
            duration: 'short'
          })
        } else {
          setSwapStatus('Success')
          showSnackBarCustom({
            component: (
              <TransactionToast
                message={'Swap Successful'}
                type={TransactionToastType.SUCCESS}
                txHash={result?.result?.swapTxHash}
              />
            ),
            duration: 'short'
          })
        }
      })
    })
  }

  const setCustomGasLimit = useCallback((limit: number) => {
    setGasLimit(limit)
    setIsCustomGasLimitSet(true)
  }, [])

  const state: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    optimalRate,
    refresh,
    gasPrice,
    setGasPrice,
    gasLimit,
    setCustomGasLimit,
    slippage,
    setSlippage,
    destination,
    setDestination,
    swap: onSwap,
    swapStatus,
    setAmount,
    error,
    isFetchingOptimalRate,
    getOptimalRateForAmount
  }

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export function useSwapContext() {
  return useContext(SwapContext)
}
