import {
  SCREEN_WIDTH,
  Text,
  TextInput,
  Tooltip,
  View
} from '@avalabs/k2-alpine'
import { QrCodeScanner } from 'common/components/QrCodeScanner'
import ScreenHeader from 'common/components/ScreenHeader'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useDeeplink } from 'contexts/DeeplinkContext/DeeplinkContext'
import { DeepLinkOrigin } from 'contexts/DeeplinkContext/types'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'

const SCANNER_WIDTH = SCREEN_WIDTH - 40

export const WalletConnectScanScreen = (): React.JSX.Element => {
  const router = useRouter()
  const { setPendingDeepLink } = useDeeplink()
  const [wcLink, setWcLink] = useState('')

  const handleOnChangeText = useCallback(
    (value: string) => {
      setWcLink(value)
      setPendingDeepLink({
        url: value,
        origin: DeepLinkOrigin.ORIGIN_QR_CODE
      })
      router.canGoBack() && router.back()
    },
    [router, setPendingDeepLink]
  )

  const renderFooter = useCallback((): JSX.Element => {
    return (
      <View>
        <View style={{ flexDirection: 'row', marginVertical: 16 }}>
          <Text sx={{ marginRight: 8, color: '$textPrimary' }} variant="body1">
            Connection URI
          </Text>
          <Tooltip
            title="Connection URI"
            description="Use this to manually connect"
          />
        </View>
        <TextInput
          value={wcLink}
          onChangeText={handleOnChangeText}
          placeholder="example: wc:07e46b69-98c4-4..."
        />
      </View>
    )
  }, [handleOnChangeText, wcLink])

  return (
    <ScrollScreen
      isModal
      renderFooter={renderFooter}
      scrollEnabled={false}
      renderHeader={() => (
        <View
          style={{
            gap: 16
          }}>
          <ScreenHeader title="Scan a QR code" />
          <View
            style={{
              paddingHorizontal: 4
            }}>
            <QrCodeScanner
              onSuccess={handleOnChangeText}
              vibrate={true}
              sx={{
                height: SCANNER_WIDTH * 1.3,
                width: SCANNER_WIDTH
              }}
            />
          </View>
        </View>
      )}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View style={{ flex: 1 }} />
    </ScrollScreen>
  )
}
