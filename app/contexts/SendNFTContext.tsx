import React, {
  createContext,
  Dispatch,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { BN } from 'avalanche'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { NFTItemData } from 'store/nft'
import { bnToEthersBigNumber, bnToLocaleString } from '@avalabs/utils-sdk'
import { FeePreset } from 'components/NetworkFeeSelector'
import { selectSelectedCurrency } from 'store/settings/currency'
import { usePosthogContext } from 'contexts/PosthogContext'
import { SendState } from 'services/send/types'
import sendService from 'services/send/SendService'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'

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
  sdkError: string | undefined
}

export const SendNFTContext = createContext<SendNFTContextState>({} as any)

export const SendNFTContextProvider = ({
  nft,
  children
}: {
  nft: NFTItemData
  children: any
}) => {
  const { capture } = usePosthogContext()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPrice(
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const [sendToken] = useState<NFTItemData>(nft)

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
  const [selectedFeePreset, setSelectedFeePreset] = useState<FeePreset>(
    FeePreset.Normal
  )
  const [customGasPrice, setCustomGasPrice] = useState(new BN(0))
  const customGasPriceBig = useMemo(
    () => bnToEthersBigNumber(customGasPrice),
    [customGasPrice]
  )
  const [sendStatus, setSendStatus] = useState<
    'Idle' | 'Sending' | 'Success' | 'Fail'
  >('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [transactionId, setTransactionId] = useState<string>()
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(validateStateFx, [
    activeAccount,
    activeNetwork,
    customGasPriceBig,
    gasLimit,
    selectedCurrency,
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
    setTransactionId(undefined)
    setSendStatus('Sending')

    const sendState = {
      address: sendToAddress,
      gasPrice: customGasPriceBig,
      gasLimit,
      token: sendService.mapTokenFromNFT(sendToken)
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

  function validateStateFx() {
    if (!activeAccount) {
      setError('Account not set')
      setCanSubmit(false)
      return
    }
    sendService
      .validateStateAndCalculateFees(
        {
          token: sendService.mapTokenFromNFT(sendToken),
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
        setSendFeeBN(state.sendFee ?? new BN(0))
        setError(state.error ? state.error.message : undefined)
        setCanSubmit(state.canSubmit ?? false)
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
      sendFeeNative,
      sendFeeInCurrency: sendFeeInCurrency,
      customGasPrice,
      setCustomGasPrice,
      gasLimit,
      setGasLimit,
      setSelectedFeePreset
    },
    canSubmit,
    sendStatus,
    sendStatusMsg,
    onSendNow,
    transactionId,
    sdkError: error
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
  balanceAfterTrxInCurrency?: string
}

export interface Fees {
  sendFeeNative: string | undefined
  sendFeeInCurrency: number | undefined
  customGasPrice: BN
  setCustomGasPrice: Dispatch<BN>
  gasLimit: number | undefined
  setGasLimit: Dispatch<number>
  setSelectedFeePreset: Dispatch<FeePreset>
}
