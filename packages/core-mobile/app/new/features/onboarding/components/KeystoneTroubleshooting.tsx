import { Button, Text, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Link } from 'expo-router'
import React, { useCallback } from 'react'

export const KeystoneTroubleshooting = ({
  retry
}: {
  retry: () => void
}): JSX.Element => {
  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 20 }}>
        <View sx={{ alignItems: 'center' }}>
          <Link
            href="https://keyst.one"
            style={{
              marginTop: 16,
              paddingVertical: 15
            }}>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8
              }}>
              <Text
                style={{
                  color: '#3AA3FF'
                }}
                variant="buttonSmall">
                Keystone Support
              </Text>
            </View>
          </Link>
        </View>
        <Button size="large" type="primary" onPress={retry}>
          Try Again
        </Button>
      </View>
    )
  }, [retry])

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      title="Invalid QR Code"
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16 }}>
      <View sx={{ gap: 20 }}>
        <Text variant="subtitle1">
          Please ensure you have selected a valid QR code from your Keystone
          device.
        </Text>
      </View>
    </ScrollScreen>
  )
}
