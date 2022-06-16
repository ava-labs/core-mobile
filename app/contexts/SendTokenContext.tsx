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
import { bnToLocaleString, ethersBigNumberToBN } from '@avalabs/utils-sdk'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { isAddress } from '@ethersproject/address'
import { NetworkVMType } from '@avalabs/chains-sdk'
import { isBech32Address } from '@avalabs/bridge-sdk'
import { fetchNetworkFee, selectSendFee } from 'store/networkFee'
import { selectSelectedCurrency } from 'store/settings/currency'

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined
  setSendToken: Dispatch<TokenWithBalance | undefined>
  sendAmount: string
  setSendAmount: Dispatch<string>
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
}

export const SendTokenContext = createContext<SendTokenContextState>({} as any)

export const SendTokenContextProvider = ({ children }: { children: any }) => {
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const sendFee = useSelector(selectSendFee)

  const { nativeTokenPrice } = useNativeTokenPrice()
  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>(
    undefined
  )

  const [sendAmount, setSendAmount] = useState('0')
  const sendAmountBN = stringToBN(sendAmount || '0', sendToken?.decimals ?? 0)
  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')
  const [sendFromAddress, setSendFromAddress] = useState<string>('')
  const [sendFromTitle, setSendFromTitle] = useState<string>('')
  const sendFeeBN = useMemo(() => ethersBigNumberToBN(sendFee), [sendFee])
  const sendFeeNative = useMemo(
    () => bnToLocaleString(sendFeeBN, activeNetwork.networkToken.decimals),
    [activeNetwork.networkToken.decimals, sendFeeBN]
  )
  const sendFeeUsd = Number.parseFloat(sendFeeNative) * nativeTokenPrice
  const [balanceAfterTrx, setBalanceAfterTrx] = useState<string>('-')
  const [balanceAfterTrxUsd, setBalanceAfterTrxUsd] = useState<string>('-')
  const [customGasPriceNanoAvax, setCustomGasPriceNanoAvax] = useState('0')
  const [sendStatus, setSendStatus] = useState<
    'Idle' | 'Sending' | 'Success' | 'Fail'
  >('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [transactionId, setTransactionId] = useState<string>()
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  useEffect(() => {
    dispatch(fetchNetworkFee)
  }, [dispatch])

  useEffect(validateStateFx, [
    activeNetwork.vmName,
    sendAmountBN,
    sendToAddress
  ])

  useEffect(() => {
    setBalanceAfterTrx(
      bnToBig(
        sendToken?.balance.sub(sendAmountBN).sub(sendFeeBN) ?? new BN(0),
        sendToken?.decimals
      ).toFixed(4)
    )
  }, [sendAmountBN, sendFeeBN, sendToken?.balance, sendToken?.decimals])

  useEffect(() => {
    setBalanceAfterTrxUsd(
      (
        nativeTokenPrice * mustNumber(() => parseFloat(balanceAfterTrx), 0)
      ).toFixed(2)
    )
  }, [balanceAfterTrx, nativeTokenPrice])

  useEffect(() => {
    setSendFromAddress(activeAccount?.address ?? '')
    setSendFromTitle(activeAccount?.title ?? '-')
  }, [activeAccount])

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
      gasPrice: sendFee,
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
      return <AvaLogoSVG size={57} />
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
  }, [sendToken])

  function validateStateFx() {
    if (
      activeNetwork.vmName === NetworkVMType.EVM &&
      !isAddress(sendToAddress)
    ) {
      setCanSubmit(false)
      setError('No address')
      return
    }
    if (
      activeNetwork.vmName === NetworkVMType.BITCOIN &&
      !isBech32Address(sendToAddress)
    ) {
      setCanSubmit(false)
      setError('Not valid address')
      return
    }
    if (sendAmountBN.isZero()) {
      setCanSubmit(false)
      setError('Amount must be greater than zero')
      return
    }
    //TODO: check balance
    setError(undefined)
    setCanSubmit(true)
  }

  const state: SendTokenContextState = {
    sendToken,
    setSendToken,
    sendAmount,
    setSendAmount,
    fromAccount: {
      address: sendFromAddress,
      title: sendFromTitle,
      balanceAfterTrx,
      balanceAfterTrxUsd
    },
    toAccount: {
      title: sendToTitle,
      address: sendToAddress,
      setTitle: setSendToTitle,
      setAddress: setSendToAddress
    },
    fees: {
      sendFeeNative,
      sendFeeUsd,
      customGasPriceNanoAvax,
      setCustomGasPriceNanoAvax,
      gasLimit: 21000 //todo unfix this
    },
    tokenLogo,
    canSubmit: canSubmit ?? false,
    sendStatus,
    sendStatusMsg,
    onSendNow,
    transactionId,
    sdkError: error
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
  balanceAfterTrxUsd?: string
}

export interface Fees {
  sendFeeNative: string | undefined
  sendFeeUsd: number | undefined
  customGasPriceNanoAvax: string
  setCustomGasPriceNanoAvax: Dispatch<string>
  gasLimit: number | undefined
}
