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
  ERC20,
  ERC20WithBalance,
  SendHookError,
  useAccountsContext,
  useWalletContext,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Alert, Image } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  bnToAvaxC,
  bnToBig,
  numberToBN,
  stringToBN
} from '@avalabs/avalanche-wallet-sdk'
import { mustNumber, mustValue } from 'utils/JsTools'
import { BN } from 'avalanche'
import { BehaviorSubject, firstValueFrom, of, Subject } from 'rxjs'
import { useSend } from 'screens/send/useSend'
import { TokenWithBalance } from 'store/balance'

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined
  setSendToken: Dispatch<ERC20WithBalance | undefined>
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
  const { theme, repo } = useApplicationContext()
  const { wallet } = useWalletContext()
  const { activeAccount } = useAccountsContext()
  const { avaxPrice, erc20Tokens } = useWalletStateContext()!
  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>(
    undefined
  )

  const customGasPrice$ = useMemo(
    () => new BehaviorSubject({ bn: new BN(0) }),
    []
  )

  const {
    submit,
    setAmount,
    amount,
    setAddress,
    address,
    canSubmit,
    sendFee,
    setTokenBalances,
    gasLimit,
    setGasLimit,
    error
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
    setSendFromAddress(activeAccount!.wallet.getAddressC())
    setSendFromTitle(
      repo.accountsRepo.accounts.get(activeAccount?.index ?? -1)?.title ?? '-'
    )
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
    if (sendToken?.contractType === 'ERC-20') {
      setTokenBalances?.({ [(sendToken as ERC20).address]: sendToken as ERC20 })
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
    setTransactionId(undefined)
    setSendStatus('Sending')

    const balances = erc20Tokens.reduce(
      (acc: { [key: string]: ERC20WithBalance }, tk) => {
        return {
          ...acc,
          [tk.address]: tk
        }
      },
      {}
    )

    submit?.(
      sendToken?.contractType === 'ERC-20' ? (sendToken as ERC20) : undefined,
      Promise.resolve(wallet),
      amount!,
      address!,
      firstValueFrom(customGasPrice$),
      of(balances) as Subject<any>,
      gasLimit
    ).subscribe({
      next: value => {
        if (value === undefined) {
          Alert.alert('Error', 'Undefined error')
        } else {
          if ('txId' in value && value.txId) {
            setTransactionId(value.txId)
            setSendStatus('Success')
            console.log('send success', value.txId)
          }
        }
      },
      error: err => {
        setSendStatus('Fail')
        setSendStatusMsg(err)
        console.log('send err', err)
      }
    })
  }

  const tokenLogo = useCallback(() => {
    if (sendToken?.symbol === 'AVAX') {
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
