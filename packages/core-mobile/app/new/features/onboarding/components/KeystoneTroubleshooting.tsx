import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { Link } from 'expo-router'
import React, { FC, useCallback } from 'react'

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
            href="https://guide.keyst.one/docs/core-mobile"
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
      <View sx={{ gap: 40 }}>
        <Text variant="subtitle1">
          Please ensure you have selected a valid QR code from your Keystone
          device.
        </Text>
        <Steps
          steps={[
            'Tap “...” on Keystone device and select “Connect Software Wallet”.',
            'Select the Core Wallet.',
            'Click on the “Try Again” button below to scan the QR code displayed on the Keystone device.'
          ]}
        />
      </View>
    </ScrollScreen>
  )
}

export const Steps: FC<{ steps: string[] }> = ({ steps }) => {
  const { theme } = useTheme()

  return (
    <View
      sx={{
        gap: 12
      }}>
      {steps.map((step, index) => (
        <View
          key={`step-${index}`}
          sx={{
            gap: 16,
            padding: 12,
            borderRadius: 12,
            backgroundColor: theme.colors.$surfaceSecondary,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
          <Text
            variant="subtitle1"
            sx={{
              fontWeight: 'bold'
            }}>{`Step ${index + 1}`}</Text>
          <Text
            variant="subtitle1"
            sx={{
              flex: 1
            }}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  )
}
