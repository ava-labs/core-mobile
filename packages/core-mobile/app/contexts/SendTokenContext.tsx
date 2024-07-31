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
import { InteractionManager } from 'react-native'
import { selectNativeTokenBalanceForNetworkAndAccount } from 'store/balance/slice'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import sendService from 'services/send/SendService'
import { SendState } from 'services/send/types'
import { bigIntToString } from '@avalabs/utils-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NetworkTokenUnit, Amount } from 'types'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RootState } from 'store'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { TokenWithBalance } from '@avalabs/vm-module-types'

export type SendStatus = 'Idle' | 'Sending' | 'Success' | 'Fail'

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined
  setSendToken: Dispatch<TokenWithBalance | undefined>
  sendAmount: Amount
  setSendAmount: Dispatch<Amount>
  toAccount: Account
  canSubmit: boolean
  sendStatus: SendStatus
  onSendNow: () => void
  sdkError: string | undefined
  maxAmount: Amount
}

export const SendTokenContext = createContext<SendTokenContextState>(
  {} as SendTokenContextState
)

const ZERO_AMOUNT = {
  bn: 0n,
  amount: '0'
}

export const SendTokenContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const { activeNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const nativeTokenBalance = useSelector((state: RootState) =>
    selectNativeTokenBalanceForNetworkAndAccount(
      state,
      activeNetwork.chainId,
      activeAccount?.index
    )
  )

  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>()
  const [maxAmount, setMaxAmount] = useState<Amount>(ZERO_AMOUNT)
  const [sendAmount, setSendAmount] = useState<Amount>(ZERO_AMOUNT)

  const [sendStatus, setSendStatus] = useState<SendStatus>('Idle')

  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')

  const [gasLimit, setGasLimit] = useState(0)

  const { data: networkFee } = useNetworkFee(activeNetwork)

  const [defaultMaxFeePerGas, setDefaultMaxFeePerGas] =
    useState<NetworkTokenUnit>(NetworkTokenUnit.fromNetwork(activeNetwork))

  // setting maxFeePerGas to lowest network fee to calculate max amount in Send screen
  useEffect(() => {
    if (!networkFee) return
    setDefaultMaxFeePerGas(networkFee.low.maxFeePerGas)
  }, [networkFee])

  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const { request } = useInAppRequest()

  useEffect(validateStateFx, [
    activeAccount,
    activeNetwork,
    gasLimit,
    selectedCurrency,
    sendAmount,
    sendToAddress,
    sendToken,
    defaultMaxFeePerGas,
    nativeTokenBalance
  ])

  const setSendTokenAndResetAmount = useCallback(
    (token: TokenWithBalance | undefined) => {
      setSendToken(token)
      setSendAmount(ZERO_AMOUNT)
      setMaxAmount(ZERO_AMOUNT)
    },
    []
  )

  const onSendNow = (): void => {
    if (!sendAmount) {
      setSendStatus('Fail')
      return
    }

    if (!activeAccount) {
      setSendStatus('Fail')
      AnalyticsService.capture('SendTransactionFailed', {
        errorMessage: 'No active account',
        chainId: activeNetwork.chainId
      })
      return
    }

    const sendState: SendState = {
      address: sendToAddress,
      amount: sendAmount.bn,
      defaultMaxFeePerGas: defaultMaxFeePerGas.toSubUnit(),
      gasLimit,
      token: sendToken
    }

    InteractionManager.runAfterInteractions(() => {
      const sentryTrx = SentryWrapper.startTransaction('send-token')
      setSendStatus('Sending')
      sendService
        .send({
          sendState,
          network: activeNetwork,
          account: activeAccount,
          currency: selectedCurrency.toLowerCase(),
          sentryTrx,
          request
        })
        .then(txHash => {
          setSendStatus('Success')

          AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
            chainId: activeNetwork.chainId,
            txHash
          })

          audioFeedback(Audios.Send)
        })
        .catch(reason => {
          setSendStatus('Fail')
          setError(reason.message)
          AnalyticsService.capture('SendTransactionFailed', {
            errorMessage: reason.message,
            chainId: activeNetwork.chainId
          })
        })
        .finally(() => {
          SentryWrapper.finish(sentryTrx)
          setSendStatus('Idle')
        })
    })
  }

  function validateStateFx(): void {
    if (!sendAmount) {
      setError('Amount not set')
      setCanSubmit(false)
      return
    }

    if (!activeAccount) {
      setError('Account not set')
      setCanSubmit(false)
      return
    }

    const sendState: SendState = {
      token: sendToken,
      amount: sendAmount.bn,
      address: sendToAddress,
      defaultMaxFeePerGas: defaultMaxFeePerGas.toSubUnit(),
      gasLimit
    }

    sendService
      .validateStateAndCalculateFees(
        sendState,
        activeNetwork,
        activeAccount,
        selectedCurrency,
        nativeTokenBalance
      )
      .then(state => {
        setGasLimit(state.gasLimit ?? 0)
        setMaxAmount({
          bn: state.maxAmount ?? 0n,
          amount:
            state.maxAmount && sendToken
              ? bigIntToString(state.maxAmount, sendToken.decimals)
              : ''
        })
        setError(state.error ? state.error.message : undefined)
        setCanSubmit(state.canSubmit ?? false)
      })
      .catch(e => {
        setError(e.message)
        Logger.error(e)
      })
  }

  const state: SendTokenContextState = {
    sendToken,
    setSendToken: setSendTokenAndResetAmount,
    sendAmount,
    setSendAmount,
    toAccount: useMemo(() => {
      return {
        title: sendToTitle,
        address: sendToAddress,
        setTitle: setSendToTitle,
        setAddress: setSendToAddress
      }
    }, [sendToAddress, sendToTitle]),
    canSubmit,
    sendStatus,
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

export function useSendTokenContext(): SendTokenContextState {
  return useContext(SendTokenContext)
}

export interface Account {
  title: string
  setTitle?: Dispatch<string>
  address: string
  setAddress?: Dispatch<string>
}
