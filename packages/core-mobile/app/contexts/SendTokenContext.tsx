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
import { TokenWithBalance } from 'store/balance'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import sendService from 'services/send/SendService'
import { SendState } from 'services/send/types'
import { bnToLocaleString } from '@avalabs/utils-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NetworkTokenUnit, Amount } from 'types'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useInAppRequest } from 'hooks/useInAppRequest'
import { RpcMethod } from 'store/rpc'

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined
  setSendToken: Dispatch<TokenWithBalance | undefined>
  sendAmount: Amount
  setSendAmount: Dispatch<Amount>
  toAccount: Account
  fees: Fees
  canSubmit: boolean
  onSendNow: ({ onSuccess }: { onSuccess?: () => void }) => void
  sdkError: string | undefined
  maxAmount: Amount
}

export const SendTokenContext = createContext<SendTokenContextState>(
  {} as SendTokenContextState
)

const ZERO_AMOUNT = {
  bn: new BN(0),
  amount: '0'
}

export const SendTokenContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const { activeNetwork } = useNetworks()
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>()
  const [maxAmount, setMaxAmount] = useState<Amount>(ZERO_AMOUNT)
  const [sendAmount, setSendAmount] = useState<Amount>(ZERO_AMOUNT)

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
    defaultMaxFeePerGas
  ])

  const setSendTokenAndResetAmount = useCallback(
    (token: TokenWithBalance | undefined) => {
      setSendToken(token)
      setSendAmount(ZERO_AMOUNT)
      setMaxAmount(ZERO_AMOUNT)
    },
    []
  )

  const onSendNow: SendTokenContextState['onSendNow'] = ({ onSuccess }) => {
    if (!sendAmount) return

    if (!activeAccount) {
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
      sendService
        .send({
          sendState,
          network: activeNetwork,
          account: activeAccount,
          currency: selectedCurrency.toLowerCase(),
          sentryTrx,
          signAndSend: txParams =>
            request({
              method: RpcMethod.ETH_SEND_TRANSACTION,
              params: txParams,
              chainId: activeNetwork.chainId.toString()
            }),
          dispatch
        })
        .then(txHash => {
          AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
            chainId: activeNetwork.chainId,
            txHash
          })
          onSuccess?.()
        })
        .catch(reason => {
          AnalyticsService.capture('SendTransactionFailed', {
            errorMessage: reason.message,
            chainId: activeNetwork.chainId
          })
        })
        .finally(() => {
          SentryWrapper.finish(sentryTrx)
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
        selectedCurrency
      )
      .then(state => {
        setGasLimit(state.gasLimit ?? 0)
        setMaxAmount({
          bn: state.maxAmount ?? new BN(0),
          amount: state.maxAmount
            ? bnToLocaleString(state.maxAmount, sendToken?.decimals)
            : ''
        })
        setError(state.error ? state.error.message : undefined)
        setCanSubmit(state.canSubmit ?? false)
      })
      .catch(Logger.error)
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
    fees: {
      gasLimit
    },
    canSubmit,
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

export interface Fees {
  gasLimit: number | undefined
}
