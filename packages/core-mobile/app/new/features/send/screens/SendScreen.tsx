import React, { useCallback } from 'react'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { showSnackbar } from 'common/utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { View, ActivityIndicator } from '@avalabs/k2-alpine'
import {
  NetworkTokenWithBalance,
  NetworkVMType,
  TokenWithBalanceAVM,
  TokenWithBalanceBTC,
  TokenWithBalancePVM
} from '@avalabs/vm-module-types'
import { ErrorState } from 'common/components/ErrorState'
import { useNavigation } from '@react-navigation/native'
import { RecipientType, useSendContext } from '../context/sendContext'
import { SendAVM } from '../components/SendAVM'
import { SendPVM } from '../components/SendPVM'
import { SendBTC } from '../components/SendBTC'
import { SendEVM } from '../components/SendEVM'
import { useNativeTokenWithBalanceByNetwork } from '../hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from '../store'

export type SendNavigationProps = {
  to: string // accountIndex | contactUID | address
  recipientType: RecipientType
}

export const SendScreen = (): JSX.Element => {
  const { to, recipientType } = useLocalSearchParams<SendNavigationProps>()
  const { canGoBack, back } = useRouter()
  const { setToAddress, network, resetAmount } = useSendContext()
  const nativeToken = useNativeTokenWithBalanceByNetwork(network)
  const activeAccount = useSelector(selectActiveAccount)
  const { getState } = useNavigation()
  const [_, setSelectedToken] = useSendSelectedToken()

  useFocusEffect(
    useCallback(() => {
      setToAddress({ to, recipientType })
    }, [recipientType, setToAddress, to])
  )

  const handleSuccess = useCallback(
    (txHash: string): void => {
      network &&
        AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
          chainId: network.chainId,
          txHash
        })
      audioFeedback(Audios.Send)
      resetAmount()
      setSelectedToken(undefined)

      canGoBack() && back()
      // dismiss recent contacts modal
      const navigationState = getState()
      if (
        navigationState?.routes[navigationState?.index ?? 0]?.name ===
        'recentContacts'
      ) {
        canGoBack() && back()
      }
    },
    [back, canGoBack, getState, network, resetAmount, setSelectedToken]
  )

  const handleFailure = useCallback(
    (error: unknown): void => {
      if (error instanceof Error && !isUserRejectedError(error)) {
        showSnackbar(getJsonRpcErrorMessage(error))
        network &&
          AnalyticsService.capture('SendTransactionFailed', {
            errorMessage: error.message,
            chainId: network.chainId
          })
      }
    },
    [network]
  )

  const isLoading = !activeAccount || !nativeToken

  if (isLoading) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="small" />
      </View>
    )
  }

  return network?.vmName === NetworkVMType.EVM ? (
    <SendEVM
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      nativeToken={nativeToken as NetworkTokenWithBalance}
      account={activeAccount}
      network={network}
    />
  ) : network?.vmName === NetworkVMType.PVM ? (
    <SendPVM
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      nativeToken={nativeToken as TokenWithBalancePVM}
      account={activeAccount}
      network={network}
    />
  ) : network?.vmName === NetworkVMType.AVM ? (
    <SendAVM
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      nativeToken={nativeToken as TokenWithBalanceAVM}
      account={activeAccount}
      network={network}
    />
  ) : network?.vmName === NetworkVMType.BITCOIN ? (
    <SendBTC
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      nativeToken={nativeToken as TokenWithBalanceBTC}
      account={activeAccount}
      network={network}
    />
  ) : (
    <ErrorState title="Unable to send" description="network not supported" />
  )
}
