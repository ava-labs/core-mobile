import {
  ActivityIndicator,
  alpha,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import React, { useCallback, useMemo } from 'react'
import { useHeaderHeight } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useCollectibleSend } from 'common/hooks/send/useCollectibleSend'
import { useRouter } from 'expo-router'
import { useSendContext } from 'features/send/context/sendContext'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import { useSendSelectedToken } from 'features/send/store'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { isAddress } from 'ethers'
import { useSendTransactionCallbacks } from '../hooks/useSendTransactionCallbacks'

export const ScanQrCodeScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const headerHeight = useHeaderHeight()
  const { isSending } = useSendContext()
  const { getNetwork } = useNetworks()
  const { canGoBack, back } = useRouter()
  const { getState } = useNavigation()
  const fromAddress = useSelector(selectActiveAccount)?.addressC ?? ''
  const [selectedToken] = useSendSelectedToken()
  const { onSuccess, onFailure } = useSendTransactionCallbacks()

  const selectedNetwork = useMemo(() => {
    return getNetwork(selectedToken?.networkChainId)
  }, [selectedToken?.networkChainId, getNetwork])
  const nativeToken = useNativeTokenWithBalanceByNetwork(selectedNetwork)
  const { data: networkFee } = useNetworkFee(selectedNetwork)

  const { send } = useCollectibleSend({
    chainId: selectedToken?.networkChainId,
    fromAddress,
    nativeToken,
    network: selectedNetwork,
    maxFee: networkFee?.low.maxFeePerGas
  })

  const handleSend = useCallback(
    async (toAddress: string): Promise<void> => {
      try {
        if (isAddress(toAddress) === false) {
          onFailure(new Error('Invalid address'))
          return
        }

        const txHash = await send(toAddress)

        onSuccess({
          txHash,
          onDismiss: () => {
            // dismiss QR code modal
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
          }
        })
      } catch (reason) {
        onFailure(reason)
      }
    },
    [back, canGoBack, getState, onFailure, onSuccess, send]
  )

  return (
    <View
      sx={{ paddingHorizontal: 16, paddingTop: headerHeight + 16, flex: 1 }}>
      <Text variant="heading2">Scan a QR code</Text>
      <QrCodeScanner
        onSuccess={handleSend}
        vibrate={true}
        sx={{
          height: '80%',
          width: '100%',
          marginTop: 21
        }}
      />
      {isSending && (
        <View
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: alpha(colors.$surfaceSecondary, 0.5),
            zIndex: 1
          }}>
          <ActivityIndicator size="small" />
        </View>
      )}
    </View>
  )
}
