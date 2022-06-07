import React, {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useState
} from 'react'
import { useWalletStateContext } from '@avalabs/wallet-react-components'
import { getSwapRate } from 'swap/getSwapRate'
import BN from 'bn.js'
import {
  Big,
  bigToLocaleString,
  bnToBig,
  numberToBN,
  stringToBN
} from '@avalabs/avalanche-wallet-sdk'
import { SwapSide } from 'paraswap'
import { from } from 'rxjs'
import { map } from 'rxjs/operators'
import { performSwap } from 'swap/performSwap'
import { OptimalRate } from 'paraswap-core'
import moment from 'moment'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/accounts'
import { TokenWithBalance } from 'store/balance'

export interface SwapEntry {
  token: TokenWithBalance | undefined
  setToken: Dispatch<TokenWithBalance>
  amount: number
  setAmount: Dispatch<number>
  usdValue: string
}

export interface TrxDetails {
  rate: string
  slippageTol: number
  setSlippageTol: Dispatch<number>
  networkFee: string
  networkFeeUsd: string
  avaxWalletFee: string
  gasLimit: number
  setGasLimit: Dispatch<number>
  gasPrice: number
  setGasPriceNanoAvax: Dispatch<number>
}

export interface SwapContextState {
  swapFrom: SwapEntry
  swapTo: SwapEntry
  minDestAmount: string
  swapFromTo: () => void
  trxDetails: TrxDetails
  refresh: () => void
  doSwap: () => Promise<{
    swapTxHash: string
    approveTxHash: string
  }>
  error: string | undefined
}

export const SwapContext = createContext<SwapContextState>({} as any)

export const SwapContextProvider = ({ children }: { children: any }) => {
  const activeAccount = useSelector(selectActiveAccount)
  const { avaxPrice } = useWalletStateContext()!
  const [srcToken, setSrcToken] = useState<TokenWithBalance>()
  const [srcAmount, setSrcAmount] = useState<number>(0)
  const [srcUsdAmount, setSrcUsdAmount] = useState<string>('')
  const [destToken, setDestToken] = useState<TokenWithBalance>()
  const [destAmount, setDestAmount] = useState<number>(0)
  const [minAmount, setMinAmount] = useState<string>('0')
  const [minAmountBig, setMinAmountBig] = useState<string>('')
  const [destUsdAmount, setDestUsdAmount] = useState<string>('')
  const [trxRate, setTrxRate] = useState<string>('')
  const [slipTol, setSlipTol] = useState<number>(12)
  const [gasLimit, setGasLimit] = useState<number>(0)
  const [gasPriceNanoAvax, setGasPriceNanoAvax] = useState<number>(0)
  const [networkFee, setNetworkFee] = useState<string>('- AVAX')
  const [networkFeeUsd, setNetworkFeeUsd] = useState<string>('$- USD')
  const [avaxWalletFee, setAvaxWalletFee] = useState<string>('0 AVAX')
  const [swapSide, setSwapSide] = useState<SwapSide>(SwapSide.SELL)
  const [error, setError] = useState<string | undefined>(undefined)
  const [priceRoute, setPriceRoute] = useState<OptimalRate>()
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    const gasPriceBig = new Big(gasPriceNanoAvax).div(Math.pow(10, 9))
    const gasLimitBig = new Big(gasLimit)
    const feeBig = gasPriceBig.mul(gasLimitBig)
    const fee = bigToLocaleString(feeBig, 4)
    const feeUsd = bigToLocaleString(feeBig.mul(avaxPrice), 4)
    setNetworkFee(`${fee}`)
    setNetworkFeeUsd(`${feeUsd}`)
  }, [gasLimit, gasPriceNanoAvax])

  useEffect(() => {
    const token = swapSide === SwapSide.SELL ? srcToken : destToken
    const amount = numberToBN(
      swapSide === SwapSide.SELL ? srcAmount : destAmount,
      token?.decimals ?? 0
    ).toString()

    const subscription = from(
      getSwapRate({
        srcToken: srcToken,
        destToken: destToken,
        amount: amount,
        swapSide
      })
    )
      .pipe(
        map(({ result, error }) => {
          if (error) {
            throw Error(error)
          }
          if (!result) {
            throw Error('No result')
          }

          const destAmount = bnToBig(
            new BN(result.destAmount),
            result.destDecimals
          )
          const srcAmount = bnToBig(
            new BN(result.srcAmount),
            result.srcDecimals
          )
          if (srcAmount.toNumber() === 0) {
            return
          }
          const destAmountBySrcAmount = destAmount
            .div(srcAmount)
            .toFixed(4)
            .toString()

          setPriceRoute(result)
          setSrcAmount(srcAmount.toNumber())
          setDestAmount(destAmount.toNumber())
          setSrcUsdAmount(result.srcUSD)
          setDestUsdAmount(result.destUSD)
          setGasLimit(Number(result.gasCost))
          setAvaxWalletFee(`${result.partnerFee} AVAX`)
          setTrxRate(
            `1 ${srcToken?.symbol} ≈ ${destAmountBySrcAmount} ${destToken?.symbol}`
          )
          const minAmnt = destAmount.times(1 - slipTol / 100).toFixed(8)
          setMinAmount(minAmnt)
          setMinAmountBig(stringToBN(minAmnt, result.destDecimals).toString())
          setError(undefined)
        })
      )
      .subscribe({
        error: err => {
          setPriceRoute(undefined)
          setError(err.message)
          console.error(err)
        }
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [srcToken, destToken, srcAmount, destAmount, refreshCounter])

  const _setSrcAmount = (amount: number) => {
    setSwapSide(SwapSide.SELL)
    setSrcAmount(amount)
  }
  const _setDestAmount = (amount: number) => {
    setSwapSide(SwapSide.BUY)
    setDestAmount(amount)
  }

  const swapFromTo = () => {
    const tempToken = destToken
    setDestToken(srcToken)
    setSrcToken(tempToken)
    const tempAmount = destAmount
    setDestAmount(srcAmount)
    setSrcAmount(tempAmount)
  }

  const doSwap = async () => {
    if (!priceRoute) {
      throw Error('no price route')
    }
    if (!activeAccount) {
      throw Error('wallet not ready')
    }

    const { result, error } = await performSwap(
      {
        priceRoute: priceRoute,
        srcAmount: priceRoute.srcAmount,
        destAmount: minAmountBig,
        gasLimit: priceRoute.gasCost,
        gasPrice: {
          bn: numberToBN(gasPriceNanoAvax, 9),
          value: gasPriceNanoAvax.toString()
        }
      },
      activeAccount.address,
      sendCustomTx //fixme
    )
    if (error) {
      throw Error(error)
    }
    if (!result) {
      throw Error('undefined result')
    }

    return result
  }

  const refresh = () => {
    setRefreshCounter(moment().second())
  }

  const state: SwapContextState = {
    swapFrom: {
      token: srcToken,
      setToken: setSrcToken,
      amount: srcAmount,
      setAmount: _setSrcAmount,
      usdValue: srcUsdAmount
    },
    swapTo: {
      token: destToken,
      setToken: setDestToken,
      amount: destAmount,
      setAmount: _setDestAmount,
      usdValue: destUsdAmount
    },
    minDestAmount: minAmount,
    swapFromTo,
    trxDetails: {
      rate: trxRate,
      slippageTol: slipTol,
      setSlippageTol: setSlipTol,
      networkFee,
      networkFeeUsd,
      avaxWalletFee,
      gasLimit,
      setGasLimit,
      gasPrice: gasPriceNanoAvax,
      setGasPriceNanoAvax
    },
    refresh,
    doSwap,
    error
  }

  return <SwapContext.Provider value={state}>{children}</SwapContext.Provider>
}

export function useSwapContext() {
  return useContext(SwapContext)
}
