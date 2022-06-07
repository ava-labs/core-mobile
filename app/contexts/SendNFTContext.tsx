import React, {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react'
import {
  checkAndValidateSendNft,
  SendHookError,
  sendNftSubmit,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { bnToAvaxC, numberToBN } from '@avalabs/avalanche-wallet-sdk'
import { mustNumber, mustValue } from 'utils/JsTools'
import { BN } from 'avalanche'
import { BehaviorSubject, firstValueFrom, of } from 'rxjs'
import { NFTItemData } from 'screens/nft/NftCollection'
import { Alert } from 'react-native'
import { walletServiceInstance } from 'services/wallet/WalletService'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/accounts'

export interface SendNFTContextState {
  sendToken: NFTItemData
  fromAccount: Account
  toAccount: Account
  fees: Fees
  canSubmit: boolean
  sendStatus: 'Idle' | 'Sending' | 'Success' | 'Fail'
  sendStatusMsg: string
  onSendNow: () => void
  transactionId: string | undefined
  sdkError: SendHookError | undefined
}

export const SendNFTContext = createContext<SendNFTContextState>({} as any)

export const SendNFTContextProvider = ({
  nft,
  children
}: {
  nft: NFTItemData
  children: any
}) => {
  const activeAccount = useSelector(selectActiveAccount)
  const { avaxPrice } = useWalletStateContext()!
  const [sendToken] = useState<NFTItemData>(nft)

  const customGasPrice$ = useRef(new BehaviorSubject({ bn: new BN(0) }))
  const gasLimit$ = useRef(new BehaviorSubject<number>(0))

  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')
  const [sendFromAddress, setSendFromAddress] = useState<string>('')
  const [sendFromTitle, setSendFromTitle] = useState<string>('')
  const [sendFee, setSendFee] = useState<BN | undefined>()
  const [gasLimit, setGasLimit] = useState(0)

  const [sendFeeAvax, setSendFeeAvax] = useState<string | undefined>()
  const [sendFeeUsd, setSendFeeUsd] = useState<number | undefined>()
  const [customGasPriceNanoAvax, setCustomGasPriceNanoAvax] = useState('0')
  const [sendStatus, setSendStatus] = useState<
    'Idle' | 'Sending' | 'Success' | 'Fail'
  >('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [transactionId, setTransactionId] = useState<string>()
  const [canSubmit, setCanSubmit] = useState(false)
  const [sdkError, setSdkError] = useState<SendHookError | undefined>(undefined)

  useEffect(() => {
    if (!sendToken || !activeAccount) {
      return
    }
    const subscription = checkAndValidateSendNft(
      sendToken.collection.contract_address,
      Number.parseInt(sendToken.token_id, 10),
      customGasPrice$.current,
      of(sendToAddress),
      of(walletServiceInstance.getEvmWallet(activeAccount.index)), //fixme
      gasLimit$.current
    ).subscribe(value => {
      setCanSubmit(value.canSubmit ?? false)
      setSdkError(value.error)
      setSendFee(value.sendFee)
      setGasLimit(value.gasLimit ?? 0)
    })

    return () => {
      return subscription.unsubscribe()
    }
  }, [sendToken, sendToAddress, activeAccount])

  useEffect(() => {
    if (!activeAccount) {
      return
    }
    setSendFromAddress(activeAccount.address)
    setSendFromTitle(activeAccount.title)
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
    customGasPrice$.current.next(
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
    gasLimit$.current.next(gasLimit)
  }, [gasLimit])

  function onSendNow() {
    setTransactionId(undefined)
    setSendStatus('Sending')

    sendNftSubmit(
      nft.collection.contract_address,
      Number.parseInt(sendToken.token_id, 10),
      Promise.resolve(walletServiceInstance.getEvmWallet(activeAccount!.index)), //fixme
      sendToAddress,
      firstValueFrom(customGasPrice$.current),
      gasLimit
    ).subscribe({
      next: value => {
        if (value === undefined) {
          Alert.alert('Error', 'Undefined error')
        } else {
          if ('txId' in value && value.txId) {
            setTransactionId(value.txId)
            setSendStatus('Success')
          }
        }
      },
      error: err => {
        setSendStatus('Fail')
        setSendStatusMsg(err)
      }
    })
  }

  const state: SendNFTContextState = {
    sendToken,
    fromAccount: {
      address: sendFromAddress,
      title: sendFromTitle
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
    canSubmit: canSubmit ?? false,
    sendStatus,
    sendStatusMsg,
    onSendNow,
    transactionId,
    sdkError
  }
  return (
    <SendNFTContext.Provider value={state}>{children}</SendNFTContext.Provider>
  )
}

export function useSendNFTContext() {
  return useContext(SendNFTContext)
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
