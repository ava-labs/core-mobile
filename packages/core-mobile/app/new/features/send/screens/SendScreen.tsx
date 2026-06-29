import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { audioFeedback, Audios } from 'utils/AudioFeedback'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { transactionSnackbar } from 'common/utils/toast'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { useDispatch, useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { View, ActivityIndicator } from '@avalabs/k2-alpine'
import {
  NetworkTokenWithBalance,
  NetworkVMType,
  TokenWithBalanceAVM,
  TokenWithBalanceBTC,
  TokenWithBalancePVM,
  TokenWithBalanceSVM
} from '@avalabs/vm-module-types'
import { ErrorState } from 'common/components/ErrorState'
import { useNavigation } from 'expo-router'
import { addRecentContact } from 'store/addressBook'
import {
  AvmCapableAccount,
  PvmCapableAccount,
  SvmCapableAccount
} from 'common/hooks/send/utils/types'
import { useSendContext } from '../context/sendContext'
import { SendAVM } from '../components/SendAVM'
import { SendPVM } from '../components/SendPVM'
import { SendBTC } from '../components/SendBTC'
import { SendEVM } from '../components/SendEVM'
import { useNativeTokenWithBalanceByNetwork } from '../hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from '../store'
import { SendSVM } from '../components/SendSVM'

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
        AnalyticsService.capture('SendTransactionSucceeded', {
          encrypted: {
            chainId: network.chainId,
            txHash
          },
          caip2ChainId: getCaip2ChainId(network.chainId)
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

      canGoBack() && back()
      // dismiss recent contacts modal
      const navigationState = getState()
      if (
        navigationState?.routes.some(route => route.name === 'recentContacts')
      ) {
        canGoBack() && back()
      }
      // dismiss onboarding modal
      const state = getState()
      if (state?.routes.some(route => route.name === 'onboarding')) {
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
      if (!activeAccount.addressPVM || !activeAccount.addressCoreEth) {
        return (
          <ErrorState
            title="Unable to send"
            description="Required account address not available"
          />
        )
      }
      return (
        <SendPVM
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as TokenWithBalancePVM}
          account={activeAccount as PvmCapableAccount}
          network={network}
        />
      )

    case NetworkVMType.AVM:
      if (!activeAccount.addressAVM || !activeAccount.addressCoreEth) {
        return (
          <ErrorState
            title="Unable to send"
            description="Required account address not available"
          />
        )
      }
      return (
        <SendAVM
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as TokenWithBalanceAVM}
          account={activeAccount as AvmCapableAccount}
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
      if (!activeAccount.addressSVM) {
        return (
          <ErrorState
            title="Unable to send"
            description="Required account address not available"
          />
        )
      }
      return (
        <SendSVM
          onSuccess={handleSuccess}
          onFailure={handleFailure}
          nativeToken={nativeToken as TokenWithBalanceSVM}
          account={activeAccount as SvmCapableAccount}
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
