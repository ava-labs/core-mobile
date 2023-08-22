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
import { OptimalRate } from 'paraswap-core'
import { TokenWithBalance } from 'store/balance'
import Logger from 'utils/Logger'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import { resolve } from '@avalabs/utils-sdk'
import { Amount } from 'screens/swap/SwapView'
import { InteractionManager } from 'react-native'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { humanizeSwapErrors } from 'localization/errors'
import { useAvalancheProvider } from 'hooks/networkProviderHooks'
import { useSelector } from 'react-redux'
import { selectNetworkFee } from 'store/networkFee'
import NetworkService from 'services/network/NetworkService'
import WalletService from 'services/wallet/WalletService'
import { performSwap } from '@avalabs/paraswap-sdk'
import { selectActiveNetwork } from 'store/network'
import { selectActiveAccount } from 'store/account'
import { TransactionRequest } from 'ethers'

export type SwapStatus = 'Idle' | 'Preparing' | 'Swapping' | 'Success' | 'Fail'

export type SwapParams = {
  srcTokenAddress: string
  isSrcTokenNative: boolean
  destTokenAddress: string
  isDestTokenNative: boolean
  priceRoute: OptimalRate
  swapGasLimit: number
  swapGasPrice: bigint
  swapSlippage: number
}

export interface SwapContextState {
  fromToken?: TokenWithBalance
  toToken?: TokenWithBalance
  setFromToken: Dispatch<TokenWithBalance | undefined>
  setToToken: Dispatch<TokenWithBalance | undefined>
  optimalRate?: OptimalRate
  refresh: () => void
  swap(params: SwapParams): void
  gasPrice: bigint
  setGasPrice: Dispatch<bigint>
  gasLimit: number
  setCustomGasLimit: Dispatch<number>
  slippage: number
  setSlippage: Dispatch<number>
  destination: SwapSide
  setDestination: Dispatch<SwapSide>
  swapStatus: SwapStatus
  setAmount: Dispatch<Amount>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
  isFetchingOptimalRate: boolean
  getOptimalRateForAmount: (amnt: Amount | undefined) => Promise<
    [
      {
        optimalRate?: OptimalRate
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error?: any
      },
      { customGasLimit?: number } //needed for calculating maxAmount to swap
    ]
  >
}

export const SwapContext = createContext<SwapContextState>(
  {} as SwapContextState
)

export const SwapContextProvider = ({ children }: { children: ReactNode }) => {
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const avalancheProvider = useAvalancheProvider()
  const networkFee = useSelector(selectNetworkFee)
  const [fromToken, setFromToken] = useState<TokenWithBalance>()
  const [toToken, setToToken] = useState<TokenWithBalance>()
  const [optimalRate, setOptimalRate] = useState<OptimalRate>()
  const [error, setError] = useState('')
  const [gasLimit, setGasLimit] = useState<number>(0)
  const [customGasLimit, setCustomGasLimit] = useState<number | undefined>(
    undefined
  )
  const trueGasLimit = customGasLimit || gasLimit
  const [gasPrice, setGasPrice] = useState<bigint>(0n)
  const [slippage, setSlippage] = useState<number>(1)
  const [destination, setDestination] = useState<SwapSide>(SwapSide.SELL)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('Idle')
  const [amount, setAmount] = useState<Amount | undefined>(undefined) //the amount that's gonna be passed to paraswap
  const [isFetchingOptimalRate, setIsFetchingOptimalRate] = useState(false)

  const getOptimalRateForAmount = useCallback(
    (amnt: Amount | undefined) => {
      if (activeAccount && amnt) {
        const swapRatePromise = getSwapRate({
          fromTokenAddress: getTokenAddress(fromToken),
          toTokenAddress: getTokenAddress(toToken),
          fromTokenDecimals: fromToken?.decimals,
          toTokenDecimals: toToken?.decimals,
          amount: amnt.bn.toString(),
          swapSide: destination,
          network: activeNetwork,
          account: activeAccount
        })
        return Promise.all([
          swapRatePromise,
          Promise.resolve({ customGasLimit })
        ])
      } else {
        return Promise.reject('invalid data')
      }
    },
    [
      activeAccount,
      activeNetwork,
      customGasLimit,
      destination,
      fromToken,
      toToken
    ]
  )

  const getOptimalRate = useCallback(() => {
    if (activeAccount && amount) {
      setIsFetchingOptimalRate(true)
      getOptimalRateForAmount(amount)
        .then(([{ optimalRate: opRate, error: err }]) => {
          setError(err)
          setOptimalRate(opRate)
          setGasLimit(Number(opRate?.gasCost ?? 0))
        })
        .catch(reason => {
          setOptimalRate(undefined)
          Logger.warn('Error getSwapRate', reason)
        })
        .finally(() => {
          setIsFetchingOptimalRate(false)
        })
    }
  }, [activeAccount, amount, getOptimalRateForAmount])

  useEffect(() => {
    //call getOptimalRate every time its params change to get fresh rates
    getOptimalRate()
  }, [getOptimalRate])

  const refresh = useCallback(() => {
    getOptimalRate()
  }, [getOptimalRate])

  function onSwap({
    srcTokenAddress,
    isSrcTokenNative,
    destTokenAddress,
    isDestTokenNative,
    priceRoute,
    swapGasLimit,
    swapGasPrice,
    swapSlippage
  }: SwapParams) {
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

    InteractionManager.runAfterInteractions(async () => {
      const sentryTrx = SentryWrapper.startTransaction('swap')
      if (!avalancheProvider) {
        return
      }
      if (!activeAccount) {
        return
      }

      resolve(
        performSwap({
          srcTokenAddress,
          isSrcTokenNative,
          destTokenAddress,
          isDestTokenNative,
          priceRoute,
          gasLimit: swapGasLimit,
          gasPrice: swapGasPrice,
          slippage: swapSlippage,
          activeNetwork,
          provider: avalancheProvider,
          transactionSend: signedTx =>
            NetworkService.sendTransaction(signedTx, activeNetwork),
          transactionSign: tx =>
            WalletService.sign(
              tx as TransactionRequest,
              activeAccount.index,
              activeNetwork
            ),
          userAddress: activeAccount.address,
          networkGasPrice: networkFee.low
        })
      )
        .then(([result, err]) => {
          if (err || (result && 'error' in result)) {
            setSwapStatus('Fail')
            showSnackBarCustom({
              component: (
                <TransactionToast
                  message={humanizeSwapErrors(err)}
                  type={TransactionToastType.ERROR}
                />
              ),
              duration: 'long'
            })
          } else {
            setSwapStatus('Success')
            showSnackBarCustom({
              component: (
                <TransactionToast
                  message={'Swap Successful'}
                  type={TransactionToastType.SUCCESS}
                  txHash={
                    result?.swapTxHash === null ? undefined : result?.swapTxHash
                  }
                />
              ),
              duration: 'short'
            })
          }
        })
        .finally(() => {
          SentryWrapper.finish(sentryTrx)
        })
    })
  }

  const state: SwapContextState = {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    optimalRate,
    refresh,
    gasPrice,
    setGasPrice,
    gasLimit: trueGasLimit,
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
