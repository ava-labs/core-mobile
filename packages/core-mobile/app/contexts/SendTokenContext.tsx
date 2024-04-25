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
import AvaLogoSVG from 'components/svg/AvaLogoSVG'
import { Image, InteractionManager } from 'react-native'
import { mustNumber } from 'utils/JsTools'
import { TokenWithBalance } from 'store/balance'
import { TokenSymbol } from 'store/network'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import sendService from 'services/send/SendService'
import { SendState } from 'services/send/types'
import { bnToBig, bnToLocaleString } from '@avalabs/utils-sdk'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { formatUriImageToPng } from 'utils/Contentful'
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
  sendAmountInCurrency: number
  fromAccount: Account
  toAccount: Account
  tokenLogo: () => JSX.Element
  fees: Fees
  canSubmit: boolean
  sendStatus: SendStatus
  sendStatusMsg: string
  onSendNow: () => void
  sdkError: string | undefined
  maxAmount: string
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
  const { theme } = useApplicationContext()
  const dispatch = useDispatch()
  const activeAccount = useSelector(selectActiveAccount)
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>()
  const [maxAmount, setMaxAmount] = useState('')
  const [sendAmount, setSendAmount] = useState<Amount>(ZERO_AMOUNT)

  const tokenPriceInSelectedCurrency = sendToken?.priceInCurrency ?? 0
  const sendAmountInCurrency =
    tokenPriceInSelectedCurrency * Number(sendAmount.amount)

  const [sendToAddress, setSendToAddress] = useState('')
  const [sendToTitle, setSendToTitle] = useState('')
  const sendFromAddress = activeAccount?.addressC ?? ''
  const sendFromTitle = activeAccount?.name ?? '-'

  const [gasLimit, setGasLimit] = useState(0)

  const [sendFeeBN, setSendFeeBN] = useState(new BN(0))
  const sendFeeNative = useMemo(
    () => bnToLocaleString(sendFeeBN, activeNetwork.networkToken.decimals),
    [activeNetwork.networkToken.decimals, sendFeeBN]
  )
  const { data: networkFee } = useNetworkFee(activeNetwork)
  const [defaultMaxFeePerGas, setDefaultMaxFeePerGas] =
    useState<NetworkTokenUnit>(NetworkTokenUnit.fromNetwork(activeNetwork))

  // setting maxFeePerGas to lowest network fee to calculate max amount in Send screen
  useEffect(() => {
    if (!networkFee) return
    setDefaultMaxFeePerGas(networkFee.low.maxFeePerGas)
  }, [networkFee])

  const balanceAfterTrx = useMemo(() => {
    //since fee is paid in native token only, for non-native tokens we should not subtract
    //fee

    const balanceAfterTxnBn = sendToken?.balance.sub(sendAmount.bn)
    if (
      sendToken?.symbol?.toLowerCase() ===
      activeNetwork.networkToken.symbol.toLowerCase()
    ) {
      balanceAfterTxnBn?.sub(sendFeeBN)
    }

    return bnToBig(balanceAfterTxnBn ?? new BN(0), sendToken?.decimals).toFixed(
      4
    )
  }, [
    activeNetwork.networkToken.symbol,
    sendAmount.bn,
    sendFeeBN,
    sendToken?.balance,
    sendToken?.decimals,
    sendToken?.symbol
  ])
  const balanceAfterTrxInCurrency = useMemo(
    () =>
      (
        tokenPriceInSelectedCurrency *
        mustNumber(() => parseFloat(balanceAfterTrx), 0)
      ).toFixed(2),
    [balanceAfterTrx, tokenPriceInSelectedCurrency]
  )

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
      setMaxAmount('')
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

  const tokenLogo = useCallback(() => {
    if (sendToken?.symbol === TokenSymbol.AVAX) {
      return (
        <AvaLogoSVG
          backgroundColor={theme.tokenLogoBg}
          logoColor={theme.tokenLogoColor}
          size={57}
        />
      )
    } else {
      return (
        <Image
          style={{ width: 57, height: 57 }}
          source={{ uri: formatUriImageToPng(sendToken?.logoUri ?? '', 57) }}
        />
      )
    }
  }, [sendToken, theme])

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
        setMaxAmount(
          state.maxAmount
            ? bnToLocaleString(state.maxAmount, sendToken?.decimals)
            : ''
        )
        setSendFeeBN(state.sendFee ?? new BN(0))
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
    sendAmountInCurrency,
    fromAccount: {
      address: sendFromAddress,
      title: sendFromTitle,
      balanceAfterTrx,
      balanceAfterTrxInCurrency
    },
    toAccount: useMemo(() => {
      return {
        title: sendToTitle,
        address: sendToAddress,
        setTitle: setSendToTitle,
        setAddress: setSendToAddress
      }
    }, [sendToAddress, sendToTitle]),
    fees: {
      sendFeeNative,
      gasLimit
    },
    tokenLogo,
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
  balanceAfterTrx?: string
  balanceAfterTrxInCurrency?: string
}

export interface Fees {
  sendFeeNative: string | undefined
  gasLimit: number | undefined
}
