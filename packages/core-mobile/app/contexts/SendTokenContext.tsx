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
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { NetworkTokenUnit, Amount } from 'types'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'

export interface SendTokenContextState {
  sendToken: TokenWithBalance | undefined
  setSendToken: Dispatch<TokenWithBalance | undefined>
  sendAmount: Amount
  setSendAmount: Dispatch<Amount>
  toAccount: Account
  fees: Fees
  canSubmit: boolean
  sendStatus: SendStatus
  sendStatusMsg: string
  onSendNow: () => void
  sdkError: string | undefined
  maxAmount: Amount
}

export type SendStatus = 'Idle' | 'Preparing' | 'Sending' | 'Success' | 'Fail'

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

  const [sendStatus, setSendStatus] = useState<SendStatus>('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

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

  function onSendNow(): void {
    if (!activeAccount) {
      setSendStatus('Fail')
      setSendStatusMsg('No active account')
      AnalyticsService.capture('SendFailed', {
        errorMessage: 'No active account',
        chainId: activeNetwork.chainId
      })
      return
    }

    AnalyticsService.capture('SendApproved', {
      chainId: activeNetwork.chainId
    })

    const sendState: SendState = {
      address: sendToAddress,
      amount: sendAmount.bn,
      defaultMaxFeePerGas: defaultMaxFeePerGas.toSubUnit(),
      gasLimit,
      token: sendToken
    }

    setSendStatus('Preparing')

    setSendStatus('Sending')

    showSnackBarCustom({
      component: (
        <TransactionToast
          testID="send_token_context__send_pending_toast"
          message={'Send Pending...'}
          type={TransactionToastType.PENDING}
        />
      ),
      duration: 'short'
    })

    InteractionManager.runAfterInteractions(() => {
      const sentryTrx = SentryWrapper.startTransaction('send-erc20')
      sendService
        .send(
          sendState,
          activeNetwork,
          activeAccount,
          selectedCurrency.toLowerCase(),
          undefined,
          sentryTrx,
          dispatch
        )
        .then(txId => {
          setSendStatus('Success')
          AnalyticsService.capture('SendSucceeded', {
            chainId: activeNetwork.chainId
          })
          showSnackBarCustom({
            component: (
              <TransactionToast
                testID="send_token_context__send_successful_toast"
                message={'Send Successful'}
                type={TransactionToastType.SUCCESS}
                txHash={txId}
              />
            ),
            duration: 'short'
          })
        })
        .catch(reason => {
          const transactionHash =
            reason?.transactionHash ?? reason?.error?.transactionHash
          AnalyticsService.capture('SendFailed', {
            errorMessage: reason?.error?.message,
            chainId: activeNetwork.chainId
          })

          showSnackBarCustom({
            component: (
              <TransactionToast
                testID="send_token_context__send_failed_toast"
                message={'Send Failed'}
                type={TransactionToastType.ERROR}
                txHash={transactionHash}
              />
            ),
            duration: 'short'
          })
        })
        .finally(() => {
          SentryWrapper.finish(sentryTrx)
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
    sendStatus,
    sendStatusMsg,
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
