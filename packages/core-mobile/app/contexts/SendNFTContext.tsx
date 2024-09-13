import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { NFTItem } from 'store/nft'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectAvailableNativeTokenBalanceForNetworkAndAccount } from 'store/balance/slice'
import { SendState } from 'services/send/types'
import sendService from 'services/send/SendService'
import { InteractionManager } from 'react-native'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { RootState } from 'store'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NetworkTokenUnit } from 'types'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { showTransactionErrorToast } from 'utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'

export interface SendNFTContextState {
  sendToken: NFTItem
  fromAccount: Account
  toAccount: Account
  canSubmit: boolean
  sendStatus: SendStatus
  onSendNow: () => void
  sdkError: string | undefined
}

export const SendNFTContext = createContext<SendNFTContextState>(
  {} as SendNFTContextState
)

export type SendStatus = 'Idle' | 'Sending' | 'Success' | 'Fail'
export const SendNFTContextProvider = ({
  nft,
  children
}: {
  nft: NFTItem
  children: ReactNode
}): JSX.Element => {
  const { activeNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const nativeTokenBalance = useSelector((state: RootState) =>
    selectAvailableNativeTokenBalanceForNetworkAndAccount(
      state,
      activeNetwork.chainId,
      activeAccount?.index
    )
  )

  const [sendToken] = useState<NFTItem>(nft)

  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')
  const sendFromAddress = activeAccount?.addressC ?? ''
  const sendFromTitle = activeAccount?.name ?? '-'

  const [gasLimit, setGasLimit] = useState(0)

  const [sendStatus, setSendStatus] = useState<SendStatus>('Idle')
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const { data: networkFee } = useNetworkFee(activeNetwork)
  const [defaultMaxFeePerGas, setDefaultMaxFeePerGas] =
    useState<NetworkTokenUnit>(NetworkTokenUnit.fromNetwork(activeNetwork))

  const { request } = useInAppRequest()

  // setting maxFeePerGas to lowest network fee to calculate max amount in Send screen
  useEffect(() => {
    if (!networkFee) return
    setDefaultMaxFeePerGas(networkFee.low.maxFeePerGas)
  }, [networkFee])

  useEffect(validateStateFx, [
    activeAccount,
    activeNetwork,
    nativeTokenBalance,
    selectedCurrency,
    sendToAddress,
    sendToken,
    defaultMaxFeePerGas,
    gasLimit
  ])

  function onSendNow(): void {
    if (!activeAccount) {
      setSendStatus('Fail')
      AnalyticsService.capture('NftSendFailed', {
        errorMessage: 'No active account',
        chainId: activeNetwork.chainId
      })
      return
    }

    const sendState = {
      address: sendToAddress,
      defaultMaxFeePerGas: defaultMaxFeePerGas.toSubUnit(),
      gasLimit,
      token: sendService.mapTokenFromNFT(sendToken),
      canSubmit
    } as SendState

    InteractionManager.runAfterInteractions(() => {
      setSendStatus('Sending')
      const sentryTrx = SentryWrapper.startTransaction('send-nft')
      sendService
        .send({
          sendState,
          network: activeNetwork,
          account: activeAccount,
          currency: selectedCurrency.toLowerCase(),
          sentryTrx,
          request
        })
        .then(() => {
          setSendStatus('Success')
          AnalyticsService.capture('NftSendSucceeded', {
            chainId: activeNetwork.chainId
          })

          audioFeedback(Audios.Send)
        })
        .catch(reason => {
          setSendStatus('Fail')
          if (!isUserRejectedError(reason)) {
            showTransactionErrorToast({
              message: getJsonRpcErrorMessage(reason)
            })
            AnalyticsService.capture('NftSendFailed', {
              errorMessage: reason?.error?.message,
              chainId: activeNetwork.chainId
            })
          }
        })
        .finally(() => {
          SentryWrapper.finish(sentryTrx)
          setSendStatus('Idle')
        })
    })
  }

  function validateStateFx(): void {
    if (!activeAccount) {
      setError('Account not set')
      setCanSubmit(false)
      return
    }

    const sendState: SendState = {
      token: sendService.mapTokenFromNFT(sendToken),
      address: sendToAddress,
      defaultMaxFeePerGas: defaultMaxFeePerGas.toSubUnit(),
      gasLimit
    }

    sendService
      .validateStateAndCalculateFees({
        sendState,
        activeNetwork,
        account: activeAccount,
        currency: selectedCurrency,
        nativeTokenBalance
      })
      .then(state => {
        setGasLimit(state.gasLimit ?? 0)
        setError(state.error ? state.error.message : undefined)
        setCanSubmit(state.canSubmit ?? false)
      })
      .catch(Logger.error)
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
    canSubmit,
    sendStatus,
    onSendNow,
    sdkError: error
  }
  return (
    <SendNFTContext.Provider value={state}>{children}</SendNFTContext.Provider>
  )
}

export function useSendNFTContext(): SendNFTContextState {
  return useContext(SendNFTContext)
}

export interface Account {
  title: string
  setTitle?: Dispatch<string>
  address: string
  setAddress?: Dispatch<string>
}
