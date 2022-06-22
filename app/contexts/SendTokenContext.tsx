import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Image } from 'react-native'
import { bnToBig, stringToBN } from '@avalabs/avalanche-wallet-sdk'
import { mustNumber } from 'utils/JsTools'
import { BN } from 'avalanche'
import { TokenWithBalance } from 'store/balance'
import { selectActiveNetwork, TokenSymbol } from 'store/network'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import sendService from 'services/send/SendService'
import { SendState } from 'services/send/types'
import { bnToEthersBigNumber, bnToLocaleString } from '@avalabs/utils-sdk'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { fetchNetworkFee } from 'store/networkFee'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined
  setSendToken: Dispatch<TokenWithBalance | undefined>
  sendAmount: string
  setSendAmount: Dispatch<string>
  sendAmountInCurrency: number
  fromAccount: Account
  toAccount: Account
  tokenLogo: () => JSX.Element
  fees: Fees
  canSubmit: boolean
  sendStatus: 'Idle' | 'Sending' | 'Success' | 'Fail'
  sendStatusMsg: string
  onSendNow: () => void
  transactionId: string | undefined
  sdkError: string | undefined
  maxAmount: string
}

export const SendTokenContext = createContext<SendTokenContextState>({} as any)

export const SendTokenContextProvider = ({ children }: { children: any }) => {
  const { theme } = useApplicationContext()
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPrice({
    currency: selectedCurrency.toLowerCase() as VsCurrencyType
  })

  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>()
  const [maxAmount, setMaxAmount] = useState('')
  const [sendAmount, setSendAmount] = useState('0')
  const sendAmountBN = useMemo(
    () => stringToBN(sendAmount || '0', sendToken?.decimals ?? 0),
    [sendAmount, sendToken?.decimals]
  )
  const tokenPriceInSelectedCurrency = sendToken?.priceInCurrency ?? 0
  const sendAmountInCurrency = tokenPriceInSelectedCurrency * Number(sendAmount)

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
  const sendFeeInCurrency = Number.parseFloat(sendFeeNative) * nativeTokenPrice
  const [customGasPrice, setCustomGasPrice] = useState(new BN(0))
  const customGasPriceBig = useMemo(
    () => bnToEthersBigNumber(customGasPrice),
    [customGasPrice]
  )

  const balanceAfterTrx = useMemo(
    () =>
      bnToBig(
        sendToken?.balance.sub(sendAmountBN).sub(sendFeeBN) ?? new BN(0),
        sendToken?.decimals
      ).toFixed(4),
    [sendAmountBN, sendFeeBN, sendToken?.balance, sendToken?.decimals]
  )
  const balanceAfterTrxInCurrency = useMemo(
    () =>
      (
        nativeTokenPrice * mustNumber(() => parseFloat(balanceAfterTrx), 0)
      ).toFixed(2),
    [balanceAfterTrx, nativeTokenPrice]
  )

  const [sendStatus, setSendStatus] = useState<
    'Idle' | 'Sending' | 'Success' | 'Fail'
  >('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [transactionId, setTransactionId] = useState<string>()
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    dispatch(fetchNetworkFee)
  }, [dispatch])

  useEffect(validateStateFx, [
    activeAccount,
    activeNetwork,
    customGasPriceBig,
    gasLimit,
    selectedCurrency,
    sendAmountBN,
    sendToAddress,
    sendToken
  ])

  function onSendNow() {
    console.log('onsend now')
    if (!activeAccount) {
      setSendStatus('Fail')
      setSendStatusMsg('No active account')
      return
    }
    setTransactionId(undefined)
    setSendStatus('Sending')

    const sendState = {
      address: sendToAddress,
      amount: sendAmountBN,
      gasPrice: customGasPriceBig,
      token: sendToken
    } as SendState
    sendService
      .send(
        sendState,
        activeNetwork,
        activeAccount,
        selectedCurrency.toLowerCase()
      )
      .then(txId => {
        setTransactionId(txId)
        setSendStatus('Success')
      })
      .catch(reason => {
        setSendStatus('Fail')
        setSendStatusMsg(reason)
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
          amount: sendAmountBN,
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
    toAccount: {
      title: sendToTitle,
      address: sendToAddress,
      setTitle: setSendToTitle,
      setAddress: setSendToAddress
    },
    fees: {
      sendFeeNative,
      sendFeeInCurrency: sendFeeInCurrency,
      customGasPrice,
      setCustomGasPrice,
      gasLimit,
      setGasLimit
    },
    tokenLogo,
    canSubmit: canSubmit ?? false,
    sendStatus,
    sendStatusMsg,
    onSendNow,
    transactionId,
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
  sendFeeInCurrency: number | undefined
  customGasPrice: BN
  setCustomGasPrice: Dispatch<BN>
  gasLimit: number | undefined
  setGasLimit: Dispatch<number>
}
