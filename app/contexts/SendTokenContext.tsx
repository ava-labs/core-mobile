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
import { selectActiveNetwork, TokenSymbol } from 'store/network'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import sendService from 'services/send/SendService'
import { SendState } from 'services/send/types'
import {
  bnToBig,
  bnToEthersBigNumber,
  bnToLocaleString
} from '@avalabs/utils-sdk'
import { useNativeTokenPrice } from 'hooks/useNativeTokenPrice'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { usePosthogContext } from 'contexts/PosthogContext'
import { FeePreset } from 'components/NetworkFeeSelector'
import { Amount } from 'screens/swap/SwapView'
import { showSnackBarCustom } from 'components/Snackbar'
import TransactionToast, {
  TransactionToastType
} from 'components/toast/TransactionToast'
import BN from 'bn.js'

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

export const SendTokenContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const { theme } = useApplicationContext()
  const { capture } = usePosthogContext()
  const activeAccount = useSelector(selectActiveAccount)
  const activeNetwork = useSelector(selectActiveNetwork)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPrice(
    selectedCurrency.toLowerCase() as VsCurrencyType
  )

  const [sendToken, setSendToken] = useState<TokenWithBalance | undefined>()
  const [maxAmount, setMaxAmount] = useState('')
  const [sendAmount, setSendAmount] = useState<Amount>({
    bn: new BN(0),
    amount: '0'
  })

  const tokenPriceInSelectedCurrency = sendToken?.priceInCurrency ?? 0
  const sendAmountInCurrency =
    tokenPriceInSelectedCurrency * Number(sendAmount.amount)

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
    () => (Number.parseFloat(sendFeeNative) * nativeTokenPrice).toFixed(2),
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
        nativeTokenPrice * mustNumber(() => parseFloat(balanceAfterTrx), 0)
      ).toFixed(2),
    [balanceAfterTrx, nativeTokenPrice]
  )

  const [sendStatus, setSendStatus] = useState<SendStatus>('Idle')
  const [sendStatusMsg, setSendStatusMsg] = useState('')
  const [canSubmit, setCanSubmit] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(validateStateFx, [
    activeAccount,
    activeNetwork,
    customGasPriceBig,
    gasLimit,
    selectedCurrency,
    sendAmount,
    sendToAddress,
    sendToken,
    trueGasLimit
  ])

  function onSendNow() {
    if (!activeAccount) {
      setSendStatus('Fail')
      setSendStatusMsg('No active account')
      return
    }

    capture('SendApproved', { selectedGasFee: selectedFeePreset.toUpperCase() })

    const sendState = {
      address: sendToAddress,
      amount: sendAmount.bn,
      gasPrice: customGasPriceBig,
      gasLimit: trueGasLimit,
      token: sendToken
    } as SendState

    setSendStatus('Preparing')

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

    InteractionManager.runAfterInteractions(() => {
      sendService
        .send(
          sendState,
          activeNetwork,
          activeAccount,
          selectedCurrency.toLowerCase()
        )
        .then(txId => {
          setSendStatus('Success')
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
          const transactionHash =
            reason?.transactionHash ?? reason?.error?.transactionHash
          showSnackBarCustom({
            component: (
              <TransactionToast
                message={'Send Failed'}
                type={TransactionToastType.ERROR}
                txHash={transactionHash}
              />
            ),
            duration: 'short'
          })
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
          source={{
            uri: sendToken?.logoUri
          }}
        />
      )
    }
  }, [sendToken, theme])

  function validateStateFx() {
    if (!activeAccount) {
      setError('Account not set')
      setCanSubmit(false)
      return
    }
    sendService
      .validateStateAndCalculateFees(
        {
          token: sendToken,
          amount: sendAmount.bn,
          address: sendToAddress,
          gasPrice: customGasPriceBig,
          gasLimit: trueGasLimit
        } as SendState,
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
  }

  const state: SendTokenContextState = {
    sendToken,
    setSendToken,
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
      sendFeeInCurrency,
      customGasPrice,
      setCustomGasPrice,
      gasLimit: trueGasLimit,
      setCustomGasLimit,
      setSelectedFeePreset
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

export function useSendTokenContext() {
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
  sendFeeInCurrency: string | undefined
  customGasPrice: BN
  setCustomGasPrice: Dispatch<BN>
  gasLimit: number | undefined
  setCustomGasLimit: Dispatch<number>
  setSelectedFeePreset: Dispatch<FeePreset>
}
