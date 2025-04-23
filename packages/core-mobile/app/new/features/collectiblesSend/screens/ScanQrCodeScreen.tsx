import React, { useCallback, useMemo } from 'react'
import { Text, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useSendSelectedToken } from 'features/send/store'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import useCollectibleSend from 'screens/send/hooks/useCollectibleSend'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import { useNetworkFee } from 'hooks/useNetworkFee'
import { useNavigation } from '@react-navigation/native'
import { useSuccessOrFailure } from '../hooks/useSuccessOrFailure'

export const ScanQrCodeScreen = (): JSX.Element => {
  const { getNetwork } = useNetworks()
  const { canGoBack, back } = useRouter()
  const { getState } = useNavigation()
  const fromAddress = useSelector(selectActiveAccount)?.addressC ?? ''
  const [selectedToken] = useSendSelectedToken()
  const { onSuccess, onFailure } = useSuccessOrFailure()

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
          }
        })
      } catch (reason) {
        onFailure(reason)
      }
    },
    [back, canGoBack, getState, onFailure, onSuccess, send]
  )

  return (
    <View sx={{ paddingHorizontal: 16, paddingTop: 16, flex: 1 }}>
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
    </View>
  )
}
