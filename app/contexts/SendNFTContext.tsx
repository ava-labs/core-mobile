import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork } from 'store/network'
import { NFTItemData } from 'store/nft'
import { bnToEthersBigNumber, bnToLocaleString } from '@avalabs/utils-sdk'
import { FeePreset } from 'components/NetworkFeeSelector'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectNativeTokenBalanceForNetworkAndAccount } from 'store/balance'
import { SendState } from 'services/send/types'
import sendService from 'services/send/SendService'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import BN from 'bn.js'
import { InteractionManager } from 'react-native'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { RootState } from 'store'

export interface SendNFTContextState {
  sendToken: NFTItemData
  fromAccount: Account
  toAccount: Account
  fees: Fees
  canSubmit: boolean
  sendStatus: SendStatus
  sendStatusMsg: string
  onSendNow: () => void
  sdkError: string | undefined
}

export const SendNFTContext = createContext<SendNFTContextState>(
  {} as SendNFTContextState
)

export type SendStatus = 'Idle' | 'Preparing' | 'Sending' | 'Success' | 'Fail'

export const SendNFTContextProvider = ({
  nft,
  children
}: {
  nft: NFTItemData
  children: ReactNode
}) => {
  const { capture } = usePostCapture()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const nativeTokenBalance = useSelector((state: RootState) =>
    selectNativeTokenBalanceForNetworkAndAccount(
      state,
      activeNetwork.chainId,
      activeAccount?.index
    )
  )

  const { nativeTokenPrice } = useNativeTokenPrice(
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const [sendToken] = useState<NFTItemData>(nft)

  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')
  const sendFromAddress = activeAccount?.address ?? ''
  const sendFromTitle = activeAccount?.title ?? '-'

  const [gasLimit, setGasLimit] = useState(0)
  const [customGasLimit, setCustomGasLimit] = useState<number | undefined>(
    undefined
  )
  const trueGasLimit = customGasLimit || gasLimit

  const [sendFeeBN, setSendFeeBN] = useState(new BN(0))
  const sendFeeNative = useMemo(
    () => bnToLocaleString(sendFeeBN, activeNetwork.networkToken.decimals),
    [activeNetwork.networkToken.decimals, sendFeeBN]
  )

  const sendFeeInCurrency = useMemo(
    () => Number.parseFloat(sendFeeNative) * nativeTokenPrice,
    [nativeTokenPrice, sendFeeNative]
  )

  const [selectedFeePreset, setSelectedFeePreset] = useState<FeePreset>(
    FeePreset.Normal
  )
  const [customGasPrice, setCustomGasPrice] = useState(new BN(0))
  const customGasPriceBig = useMemo(
    () => bnToEthersBigNumber(customGasPrice),
    [customGasPrice]
  )
  const [sendStatus, setSendStatus] = useState<SendStatus>('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(validateStateFx, [
    activeAccount,
    activeNetwork,
    nativeTokenBalance,
    customGasPriceBig,
    trueGasLimit,
    selectedCurrency,
    sendToAddress,
    sendToken
  ])

  function onSendNow() {
    if (!activeAccount) {
      setSendStatus('Fail')
      setSendStatusMsg('No active account')
      capture('NftSendFailed', {
        errorMessage: 'No active account',
        chainId: activeNetwork.chainId
      })
      return
    }

    capture('NftSendApproved', {
      selectedGasFee: selectedFeePreset.toUpperCase()
    })

    const sendState = {
      address: sendToAddress,
      gasPrice: customGasPriceBig,
      gasLimit: trueGasLimit,
      token: sendService.mapTokenFromNFT(sendToken)
    } as SendState

    setSendStatus('Preparing')

    InteractionManager.runAfterInteractions(() => {
      const sentryTrx = SentryWrapper.startTransaction('send-erc721')
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
                  message={'Send Pending...'}
                  type={TransactionToastType.PENDING}
                />
              ),
              duration: 'short'
            })
          },
          sentryTrx
        )
        .then(txId => {
          setSendStatus('Success')
          capture('NftSendSucceeded', { chainId: activeNetwork.chainId })
          showSnackBarCustom({
            component: (
              <TransactionToast
                message={'Send Successful'}
                type={TransactionToastType.SUCCESS}
                txHash={txId}
              />
            ),
            duration: 'short'
          })
        })
        .catch(reason => {
          setSendStatus('Fail')
          capture('NftSendFailed', {
            errorMessage: reason?.error?.message,
            chainId: activeNetwork.chainId
          })
          showSnackBarCustom({
            component: (
              <TransactionToast
                message={'Send Failed'}
                type={TransactionToastType.ERROR}
              />
            ),
            duration: 'short'
          })
          setSendStatusMsg(reason)
        })
        .finally(() => {
          SentryWrapper.finish(sentryTrx)
        })
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
          gasLimit: trueGasLimit
        } as SendState,
        activeNetwork,
        activeAccount,
        selectedCurrency,
        nativeTokenBalance
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
      gasLimit: trueGasLimit,
      setCustomGasLimit,
      setSelectedFeePreset,
      selectedFeePreset
    },
    canSubmit,
    sendStatus,
    sendStatusMsg,
    onSendNow,
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
  setCustomGasLimit: Dispatch<number>
  setSelectedFeePreset: Dispatch<FeePreset>
  selectedFeePreset: FeePreset
}
