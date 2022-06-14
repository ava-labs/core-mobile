import React, {
  createContext,
  Dispatch,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  SendHookError,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Image } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  bnToAvaxC,
  bnToBig,
  numberToBN,
  stringToBN
} from '@avalabs/avalanche-wallet-sdk'
import { mustNumber, mustValue } from 'utils/JsTools'
import { BN } from 'avalanche'
import { BehaviorSubject } from 'rxjs'
import { useSend } from 'screens/send/useSend'
import { TokenType, TokenWithBalance } from 'store/balance'
import { selectActiveNetwork, TokenSymbol } from 'store/network'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import sendService from 'services/send/SendService'
import { SendState } from 'services/send/types'
import { BigNumber } from 'ethers'
import { bnToEthersBigNumber } from '@avalabs/utils-sdk'
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
  sdkError: SendHookError | undefined
}

export const SendTokenContext = createContext<SendTokenContextState>({} as any)

export const SendTokenContextProvider = ({ children }: { children: any }) => {
  const { theme } = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const { avaxPrice } = useWalletStateContext()!
  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>(
    undefined
  )

  const customGasPrice$ = useMemo(
    () => new BehaviorSubject({ bn: new BN(0) }),
    []
  )

  const {
    setAmount,
    amount,
    setAddress,
    address,
    canSubmit,
    sendFee,
    setTokenBalances,
    gasLimit,
    setGasLimit,
    error,
    gasPrice
  } = useSend(sendToken, customGasPrice$)

  const [sendAmount, setSendAmount] = useState('0')
  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')
  const [sendFromAddress, setSendFromAddress] = useState<string>('')
  const [sendFromTitle, setSendFromTitle] = useState<string>('')
  const [sendFeeAvax, setSendFeeAvax] = useState<string | undefined>()
  const [sendFeeUsd, setSendFeeUsd] = useState<number | undefined>()
  const [balanceAfterTrx, setBalanceAfterTrx] = useState<string>('-')
  const [balanceAfterTrxUsd, setBalanceAfterTrxUsd] = useState<string>('-')
  const [customGasPriceNanoAvax, setCustomGasPriceNanoAvax] = useState('0')
  const [sendStatus, setSendStatus] = useState<
    'Idle' | 'Sending' | 'Success' | 'Fail'
  >('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [transactionId, setTransactionId] = useState<string>()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  useEffect(() => {
    setBalanceAfterTrx(
      bnToBig(
        sendToken?.balance.sub(amount ?? new BN(0)).sub(sendFee ?? new BN(0)) ??
          new BN(0),
        sendToken?.decimals
      ).toFixed(4)
    )
  }, [sendFee, amount])

  useEffect(() => {
    setBalanceAfterTrxUsd(
      (avaxPrice * mustNumber(() => parseFloat(balanceAfterTrx), 0)).toFixed(2)
    )
  }, [balanceAfterTrx])

  useEffect(() => {
    setSendFromAddress(activeAccount?.address ?? '')
    setSendFromTitle(activeAccount?.title ?? '-')
  }, [activeAccount])

  useEffect(() => {
    setSendFeeAvax(sendFee ? bnToAvaxC(sendFee) : undefined)
  }, [sendFee])

  useEffect(() => {
    setSendFeeUsd(
      sendFeeAvax ? Number.parseFloat(sendFeeAvax) * avaxPrice : undefined
    )
  }, [sendFeeAvax, avaxPrice])

  useEffect(() => {
    customGasPrice$.next(
      mustValue(
        () => {
          return {
            bn: numberToBN(
              mustNumber(() => parseFloat(customGasPriceNanoAvax), 0),
              9
            )
          }
        },
        { bn: new BN(0) }
      )
    )
  }, [customGasPriceNanoAvax])

  useEffect(() => {
    if (sendToken?.type === TokenType.ERC20 && sendToken.address) {
      setTokenBalances?.({ [sendToken.address]: sendToken })
    }
  }, [sendToken])

  useEffect(() => {
    setAmount(
      mustValue(
        () => stringToBN(sendAmount, sendToken?.decimals ?? 0),
        new BN(0)
      )
    )
  }, [sendAmount, sendToken])

  useEffect(() => {
    setAddress(sendToAddress)
  }, [sendToAddress, sendToken])

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
      address,
      amount,
      gasPrice: gasPrice ? bnToEthersBigNumber(gasPrice) : BigNumber.from(0),
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
  }, [sendToken, theme])

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
      sendFeeAvax,
      sendFeeUsd,
      customGasPriceNanoAvax,
      setCustomGasPriceNanoAvax,
      gasLimit,
      setGasLimit
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
  sendFeeAvax: string | undefined
  sendFeeUsd: number | undefined
  customGasPriceNanoAvax: string
  setCustomGasPriceNanoAvax: Dispatch<string>
  gasLimit: number | undefined
  setGasLimit: Dispatch<number>
}
