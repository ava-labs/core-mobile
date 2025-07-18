import React, { useCallback, useEffect } from 'react'
import { withWalletConnectCache } from 'common/components/withWalletConnectCache'
import { KeystoneTroubleshootingParams } from 'services/walletconnectv2/walletConnectCache/types'
import { useNavigation, Link } from 'expo-router'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { BackHandler } from 'react-native'
import { View, Text, SCREEN_WIDTH, Button, useTheme } from '@avalabs/k2-alpine'
import { Space } from 'common/components/Space'
import { Steps } from 'features/onboarding/components/KeystoneTroubleshooting'

const KeystoneTroubleshootingScreen = ({
  params
}: {
  params: KeystoneTroubleshootingParams
}): JSX.Element => {
  const { theme } = useTheme()
  const navigation = useNavigation()
  const { retry } = params

  const closeAndRetry = useCallback(() => {
    retry()
    navigation.goBack()
  }, [navigation, retry])

  useEffect(() => {
    const onBackPress = (): boolean => {
      // modal is being dismissed via physical back button
      closeAndRetry()
      return false
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    )

    return () => backHandler.remove()
  }, [closeAndRetry])

  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (
        e.data.action.type === 'POP' // gesture dismissed
      ) {
        // modal is being dismissed via gesture or back button
        closeAndRetry()
      }
    })
  }, [navigation, closeAndRetry])

  return (
    <ScrollScreen
      isModal
      titleSx={{
        maxWidth: '80%'
      }}
      contentContainerStyle={{
        padding: 16,
        paddingTop: 0
      }}>
      <View
        sx={{
          alignItems: 'center',
          paddingHorizontal: 25,
          paddingVertical: 60
        }}>
        <View
          sx={{
            gap: 16
          }}>
          <Text variant="heading4">Invalid QR Code</Text>
          <Text
            variant="body1"
            sx={{
              marginBottom: 40
            }}>
            Please ensure you have selected a valid QR code from your Keystone
            device.
          </Text>
          <Steps
            steps={[
              'Tap the scan icon at the bottom right of Keystone.',
              'Scan the QR code on the Core Wallet.',
              'Confirm the transaction details and swipe to Confirm.',
              'Use camera to scan the QR code displayed on Keystone.'
            ]}
          />
        </View>
        <Space y={40} />
        <Button
          style={{
            width: SCREEN_WIDTH - 64
          }}
          type="primary"
          size="large"
          onPress={closeAndRetry}>
          Try Again
        </Button>
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
    </ScrollScreen>
  )
}

export default withWalletConnectCache('keystoneTroubleshootingParams')(
  KeystoneTroubleshootingScreen
)
