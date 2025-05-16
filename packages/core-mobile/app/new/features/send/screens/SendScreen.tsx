import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { transactionSnackbar } from 'common/utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { useDispatch, useSelector } from 'react-redux'
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
import { addRecentContact } from 'store/addressBook'
import { useSendContext } from '../context/sendContext'
import { SendAVM } from '../components/SendAVM'
import { SendPVM } from '../components/SendPVM'
import { SendBTC } from '../components/SendBTC'
import { SendEVM } from '../components/SendEVM'
import { useNativeTokenWithBalanceByNetwork } from '../hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from '../store'

export const SendScreen = (): JSX.Element => {
  const { canGoBack, back } = useRouter()
  const dispatch = useDispatch()
  const { network, resetAmount, toAddress } = useSendContext()
  const nativeToken = useNativeTokenWithBalanceByNetwork(network)
  const activeAccount = useSelector(selectActiveAccount)
  const { getState } = useNavigation()
  const [_, setSelectedToken] = useSendSelectedToken()

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
      toAddress &&
        toAddress?.recipientType !== 'address' &&
        dispatch(
          addRecentContact({
            id: Number(toAddress.to),
            type: toAddress.recipientType
          })
        )

      canGoBack() && back()
      // dismiss recent contacts modal
      const navigationState = getState()
      if (
        navigationState?.routes[navigationState?.index ?? 0]?.name ===
        'recentContacts'
      ) {
        canGoBack() && back()
      }
      // dismiss onboarding modal
      const state = getState()
      if (state?.routes[state?.index ?? 0]?.name === 'onboarding') {
        canGoBack() && back()
      }
    },
    [
      back,
      canGoBack,
      dispatch,
      getState,
      network,
      resetAmount,
      setSelectedToken,
      toAddress
    ]
  )

  const handleFailure = useCallback(
    (error: unknown): void => {
      if (error instanceof Error && !isUserRejectedError(error)) {
        transactionSnackbar.error({ error: getJsonRpcErrorMessage(error) })
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
