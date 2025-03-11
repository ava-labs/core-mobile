import React, { FC, useEffect } from 'react'
import { useSendContext } from 'contexts/SendContext'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { SendTokensScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { showTransactionErrorToast } from 'utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { useSelector } from 'react-redux'
import {
  NetworkTokenWithBalance,
  TokenWithBalanceAVM,
  TokenWithBalanceBTC,
  TokenWithBalancePVM
} from '@avalabs/vm-module-types'
import { selectActiveAccount } from 'store/account'
import ZeroState from 'components/ZeroState'
import { ActivityIndicator, Button, View } from '@avalabs/k2-mobile'
import SendEVM from './components/SendEVM'
import SendBTC from './components/SendBTC'
import SendAVM from './components/SendAVM'
import SendPVM from './components/SendPVM'
import { useNativeTokenWithBalance } from './hooks/useNativeTokenWithBalance'

type SendTokenScreenNavigationProp = SendTokensScreenProps<
  typeof AppNavigation.Send.Send
>

const SendTokenScreen: FC = () => {
  const navigation =
    useNavigation<SendTokenScreenNavigationProp['navigation']>()
  const { params } = useRoute<SendTokenScreenNavigationProp['route']>()
  const contact = params?.contact

  const { setToken, setToAddress } = useSendContext()
  const { activeNetwork } = useNetworks()
  const activeAccount = useSelector(selectActiveAccount)
  const nativeToken = useNativeTokenWithBalance()

  useEffect(() => {
    if (params?.token) {
      setToken(params?.token)
    }
  }, [setToken, params?.token])

  useEffect(() => {
    if (contact) {
      setToAddress(contact.address)
    }
  }, [contact, setToAddress])

  const handleOpenAddressBook = (): void => {
    navigation.navigate(AppNavigation.Wallet.AddressBook)
  }

  const handleOpenQRScanner = (): void => {
    navigation.navigate(AppNavigation.Modal.QRScanner, {
      onSuccess: (data: string) => {
        setToAddress(data)
      }
    })
  }

  const handleSuccess = (txHash: string): void => {
    AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
      chainId: activeNetwork.chainId,
      txHash
    })
    audioFeedback(Audios.Send)

    navigation.goBack()
  }

  const handleFailure = (error: unknown): void => {
    if (error instanceof Error && !isUserRejectedError(error)) {
      showTransactionErrorToast({
        message: getJsonRpcErrorMessage(error)
      })
      AnalyticsService.capture('SendTransactionFailed', {
        errorMessage: error.message,
        chainId: activeNetwork.chainId
      })
    }
  }

  const isLoading = !activeAccount || !nativeToken

  if (isLoading) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return activeNetwork.vmName === NetworkVMType.EVM ? (
    <SendEVM
      nativeToken={nativeToken as NetworkTokenWithBalance}
      account={activeAccount}
      network={activeNetwork}
      onOpenQRScanner={handleOpenQRScanner}
      onOpenAddressBook={handleOpenAddressBook}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
    />
  ) : activeNetwork.vmName === NetworkVMType.PVM ? (
    <SendPVM
      account={activeAccount}
      nativeToken={nativeToken as TokenWithBalancePVM}
      network={activeNetwork}
      onOpenQRScanner={handleOpenQRScanner}
      onOpenAddressBook={handleOpenAddressBook}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
    />
  ) : activeNetwork.vmName === NetworkVMType.AVM ? (
    <SendAVM
      account={activeAccount}
      nativeToken={nativeToken as TokenWithBalanceAVM}
      network={activeNetwork}
      onOpenQRScanner={handleOpenQRScanner}
      onOpenAddressBook={handleOpenAddressBook}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
    />
  ) : activeNetwork.vmName === NetworkVMType.BITCOIN ? (
    <SendBTC
      account={activeAccount}
      nativeToken={nativeToken as TokenWithBalanceBTC}
      network={activeNetwork}
      onOpenQRScanner={handleOpenQRScanner}
      onOpenAddressBook={handleOpenAddressBook}
      onSuccess={handleSuccess}
      onFailure={handleFailure}
    />
  ) : (
    <ZeroState.Basic
      title="Unable to send"
      message="network not supported"
      button={
        <Button type="primary" size="large" onPress={() => navigation.goBack()}>
          Go back
        </Button>
      }
    />
  )
}

export default SendTokenScreen
