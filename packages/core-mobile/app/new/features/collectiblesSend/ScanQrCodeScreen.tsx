import React, { useCallback, useMemo, useEffect } from 'react'
import { Text, View } from '@avalabs/k2-alpine'
import { useGlobalSearchParams, useRouter } from 'expo-router'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import { useCollectiblesContext } from 'features/portfolio/collectibles/CollectiblesContext'
import { useSendSelectedToken } from 'features/send/store'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useNativeTokenWithBalanceByNetwork } from 'features/send/hooks/useNativeTokenWithBalanceByNetwork'
import useCollectibleSend from 'screens/send/hooks/useCollectibleSend'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { isUserRejectedError } from 'store/rpc/providers/walletConnect/utils'
import { getJsonRpcErrorMessage } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'
import { showSnackbar } from 'common/utils/toast'
import { audioFeedback, Audios } from 'utils/AudioFeedback'

export const ScanQrCodeScreen = (): JSX.Element => {
  const { localId } = useGlobalSearchParams<{ localId: string }>()
  const { getCollectible } = useCollectiblesContext()
  const [_, setSelectedToken] = useSendSelectedToken()
  const { getNetwork } = useNetworks()
  const { canGoBack, back } = useRouter()
  const fromAddress = useSelector(selectActiveAccount)?.addressC ?? ''

  const collectible = useMemo(() => {
    return getCollectible(localId)
  }, [getCollectible, localId])

  const selectedNetwork = useMemo(() => {
    return getNetwork(collectible?.networkChainId)
  }, [collectible?.networkChainId, getNetwork])
  const nativeToken = useNativeTokenWithBalanceByNetwork(selectedNetwork)

  useEffect(() => {
    if (collectible) {
      setSelectedToken(collectible)
    }
  }, [collectible, setSelectedToken])

  const { send } = useCollectibleSend({
    chainId: collectible?.networkChainId,
    fromAddress,
    nativeToken
  })

  const handleSend = useCallback(
    async (toAddress: string): Promise<void> => {
      try {
        const txHash = await send(toAddress)

        selectedNetwork &&
          AnalyticsService.captureWithEncryption('SendTransactionSucceeded', {
            chainId: selectedNetwork.chainId,
            txHash
          })
        audioFeedback(Audios.Send)
        setSelectedToken(undefined)
        canGoBack() && back()
      } catch (error) {
        if (error instanceof Error && !isUserRejectedError(error)) {
          showSnackbar(getJsonRpcErrorMessage(error))
          selectedNetwork &&
            AnalyticsService.capture('SendTransactionFailed', {
              errorMessage: error.message,
              chainId: selectedNetwork.chainId
            })
        }
      }
    },
    [back, canGoBack, selectedNetwork, send, setSelectedToken]
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
