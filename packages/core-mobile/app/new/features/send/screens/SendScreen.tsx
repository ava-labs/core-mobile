import { ActivityIndicator, View } from '@avalabs/k2-alpine'
import {
  NetworkTokenWithBalance,
  NetworkVMType,
  TokenWithBalanceAVM,
  TokenWithBalanceBTC,
  TokenWithBalancePVM,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'
import { ErrorState } from 'common/components/ErrorState'
import { transactionSnackbar } from 'common/utils/toast'
import { useNavigation, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { InteractionManager } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { selectActiveAccount } from 'store/account'
import { addRecentContact } from 'store/addressBook'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { SendAVM } from '../components/SendAVM'
import { SendBTC } from '../components/SendBTC'
import { SendEVM } from '../components/SendEVM'
import { SendPVM } from '../components/SendPVM'
import { SendSVM } from '../components/SendSVM'
import { useSendContext } from '../context/sendContext'
import { useNativeTokenWithBalanceByNetwork } from '../hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from '../store'

export const SendScreen = (): JSX.Element => {
  const dispatch = useDispatch()
  const { network, resetAmount, toAddress } = useSendContext()
  const { canDismiss, dismiss } = useRouter()
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
            id: toAddress.to,
            type: toAddress.recipientType
          })
        )

      canDismiss() && dismiss()
      InteractionManager.runAfterInteractions(() => {
        const navigationState = getState()
        if (
          navigationState?.routes[navigationState?.index ?? 0]?.name ===
          'recentContacts'
        ) {
          canDismiss() && dismiss()
        }
      })
    },
    [
      canDismiss,
      dismiss,
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

  switch (network?.vmName) {
    case NetworkVMType.EVM:
      return (
        <SendEVM
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as NetworkTokenWithBalance}
          account={activeAccount}
          network={network}
        />
      )

    case NetworkVMType.PVM:
      return (
        <SendPVM
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as TokenWithBalancePVM}
          account={activeAccount}
          network={network}
        />
      )

    case NetworkVMType.AVM:
      return (
        <SendAVM
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as TokenWithBalanceAVM}
          account={activeAccount}
          network={network}
        />
      )

    case NetworkVMType.BITCOIN:
      return (
        <SendBTC
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as TokenWithBalanceBTC}
          account={activeAccount}
          network={network}
        />
      )

    case NetworkVMType.SVM:
      return (
        <SendSVM
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as TokenWithBalanceSVM}
          account={activeAccount}
          network={network}
        />
      )

    default:
      return (
        <ErrorState
          title="Unable to send"
          description="network not supported"
        />
      )
  }
}
