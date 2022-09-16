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
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Image } from 'react-native'
import { mustNumber } from 'utils/JsTools'
import { BN } from 'avalanche'
import { TokenWithBalance } from 'store/balance'
import { selectActiveNetwork, TokenSymbol } from 'store/network'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import sendService from 'services/send/SendService'
import { SendState } from 'services/send/types'
import {
  bnToBig,
  bnToEthersBigNumber,
  bnToLocaleString
} from '@avalabs/utils-sdk'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { usePosthogContext } from 'contexts/PosthogContext'
import { FeePreset } from 'components/NetworkFeeSelector'
import { Amount } from 'screens/swap/SwapView'
import { showSnackBarCustom, updateSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined
  setSendToken: Dispatch<TokenWithBalance | undefined>
  sendAmount: Amount
  setSendAmount: Dispatch<Amount>
  sendAmountInCurrency: number
  fromAccount: Account
  toAccount: Account
  tokenLogo: () => JSX.Element
  fees: Fees
  canSubmit: boolean
  sendStatus: SendStatus
  sendStatusMsg: string
  onSendNow: () => void
  sdkError: string | undefined
  maxAmount: string
}

export type SendStatus = 'Idle' | 'Preparing' | 'Sending' | 'Success' | 'Fail'

export const SendTokenContext = createContext<SendTokenContextState>(
  {} as SendTokenContextState
)

export const SendTokenContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const { theme } = useApplicationContext()
  const { capture } = usePosthogContext()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPrice(
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>()
  const [maxAmount, setMaxAmount] = useState('')
  const [sendAmount, setSendAmount] = useState<Amount>({
    bn: new BN(0),
    amount: '0'
  })

  const tokenPriceInSelectedCurrency = sendToken?.priceInCurrency ?? 0
  const sendAmountInCurrency =
    tokenPriceInSelectedCurrency * Number(sendAmount.amount)

  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')
  const sendFromAddress = activeAccount?.address ?? ''
  const sendFromTitle = activeAccount?.title ?? '-'

  const [gasLimit, setGasLimit] = useState(0)
  const [sendFeeBN, setSendFeeBN] = useState(new BN(0))
  const sendFeeNative = bnToLocaleString(
    sendFeeBN,
    activeNetwork.networkToken.decimals
  )
  const sendFeeInCurrency = (
    Number.parseFloat(sendFeeNative) * nativeTokenPrice
  ).toFixed(2)
  const [selectedFeePreset, setSelectedFeePreset] = useState<FeePreset>(
    FeePreset.Normal
  )
  const [customGasPrice, setCustomGasPrice] = useState(new BN(0))
  const customGasPriceBig = useMemo(
    () => bnToEthersBigNumber(customGasPrice),
    [customGasPrice]
  )

  const balanceAfterTrx = useMemo(() => {
    //since fee is paid in native token only, for non-native tokens we should not subtract
    //fee

    const balanceAfterTxnBn = sendToken?.balance.sub(sendAmount.bn)
    if (
      sendToken?.symbol?.toLowerCase() ===
      activeNetwork.networkToken.symbol.toLowerCase()
    ) {
      balanceAfterTxnBn?.sub(sendFeeBN)
    }

    return bnToBig(balanceAfterTxnBn ?? new BN(0), sendToken?.decimals).toFixed(
      4
    )
  }, [
    activeNetwork.networkToken.symbol,
    sendAmount.bn,
    sendFeeBN,
    sendToken?.balance,
    sendToken?.decimals,
    sendToken?.symbol
  ])
  const balanceAfterTrxInCurrency = useMemo(
    () =>
      (
        nativeTokenPrice * mustNumber(() => parseFloat(balanceAfterTrx), 0)
      ).toFixed(2),
    [balanceAfterTrx, nativeTokenPrice]
  )

  const [sendStatus, setSendStatus] = useState<SendStatus>('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(validateStateFx, [
    activeAccount,
    activeNetwork,
    customGasPriceBig,
    gasLimit,
    selectedCurrency,
    sendAmount,
    sendToAddress,
    sendToken
  ])

  function onSendNow() {
    if (!activeAccount) {
      setSendStatus('Fail')
      setSendStatusMsg('No active account')
      return
    }

    capture('SendApproved', { selectedGasFee: selectedFeePreset.toUpperCase() })

    const toastId = Math.random().toString()

    const sendState = {
      address: sendToAddress,
      amount: sendAmount.bn,
      gasPrice: customGasPriceBig,
      gasLimit,
      token: sendToken
    } as SendState

    setSendStatus('Preparing')
    sendService
      .send(
        sendState,
        activeNetwork,
        activeAccount,
        selectedCurrency.toLowerCase(),
        () => {
          setSendStatus('Sending')
          showSnackBarCustom({
            component: (
              <TransactionToast
                toastId={toastId}
                message={'Send pending'}
                type={TransactionToastType.PENDING}
              />
            ),
            id: toastId,
            duration: 'infinite'
          })
        }
      )
      .then(txId => {
        setSendStatus('Success')
        updateSnackBarCustom(
          toastId,
          <TransactionToast
            message={'Send successful'}
            type={TransactionToastType.SUCCESS}
            txHash={txId}
            toastId={toastId}
          />,
          true
        )
      })
      .catch(reason => {
        const transactionHash =
          reason?.transactionHash ?? reason?.error?.transactionHash
        updateSnackBarCustom(
          toastId,
          <TransactionToast
            message={'Send failed'}
            type={TransactionToastType.ERROR}
            toastId={toastId}
            txHash={transactionHash ?? 'failed'}
          />
        )
      })
  }

  const tokenLogo = useCallback(() => {
    if (sendToken?.symbol === TokenSymbol.AVAX) {
      return (
        <AvaLogoSVG
          backgroundColor={theme.tokenLogoBg}
          logoColor={theme.tokenLogoColor}
          size={57}
        />
      )
    } else {
      return (
        <Image
          style={{ width: 57, height: 57 }}
          source={{
            uri: sendToken?.logoUri
          }}
        />
      )
    }
  }, [sendToken, theme])

  function validateStateFx() {
    if (!activeAccount) {
      setError('Account not set')
      setCanSubmit(false)
      return
    }
    sendService
      .validateStateAndCalculateFees(
        {
          token: sendToken,
          amount: sendAmount.bn,
          address: sendToAddress,
          gasPrice: customGasPriceBig,
          gasLimit
        } as SendState,
        activeNetwork,
        activeAccount,
        selectedCurrency
      )
      .then(state => {
        setGasLimit(state.gasLimit ?? 0)
        setMaxAmount(
          state.maxAmount
            ? bnToLocaleString(state.maxAmount, sendToken?.decimals)
            : ''
        )
        setSendFeeBN(state.sendFee ?? new BN(0))
        setError(state.error ? state.error.message : undefined)
        setCanSubmit(state.canSubmit ?? false)
      })
  }

  const state: SendTokenContextState = {
    sendToken,
    setSendToken,
    sendAmount,
    setSendAmount,
    sendAmountInCurrency,
    fromAccount: {
      address: sendFromAddress,
      title: sendFromTitle,
      balanceAfterTrx,
      balanceAfterTrxInCurrency
    },
    toAccount: useMemo(() => {
      return {
        title: sendToTitle,
        address: sendToAddress,
        setTitle: setSendToTitle,
        setAddress: setSendToAddress
      }
    }, [sendToAddress, sendToTitle]),
    fees: {
      sendFeeNative,
      sendFeeInCurrency: sendFeeInCurrency,
      customGasPrice,
      setCustomGasPrice,
      gasLimit,
      setGasLimit,
      setSelectedFeePreset
    },
    tokenLogo,
    canSubmit,
    sendStatus,
    sendStatusMsg,
    onSendNow,
    sdkError: error,
    maxAmount
  }
  return (
    <SendTokenContext.Provider value={state}>
      {children}
    </SendTokenContext.Provider>
  )
}

export function useSendTokenContext() {
  return useContext(SendTokenContext)
}

export interface Account {
  title: string
  setTitle?: Dispatch<string>
  address: string
  setAddress?: Dispatch<string>
  balanceAfterTrx?: string
  balanceAfterTrxInCurrency?: string
}

export interface Fees {
  sendFeeNative: string | undefined
  sendFeeInCurrency: string | undefined
  customGasPrice: BN
  setCustomGasPrice: Dispatch<BN>
  gasLimit: number | undefined
  setGasLimit: Dispatch<number>
  setSelectedFeePreset: Dispatch<FeePreset>
}
