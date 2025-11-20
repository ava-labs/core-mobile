import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, Button, useTheme, Icons } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'

export default function CompleteScreen(): JSX.Element {
  const router = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const { resetSetup } = useLedgerSetupContext()

  const handleComplete = (): void => {
    resetSetup()
    // Keep going back until we can't go back anymore (should reach manage accounts)
    const goBackToRoot = (): void => {
      if (router.canGoBack()) {
        router.back()
        setTimeout(goBackToRoot, 50)
      }
    }
    goBackToRoot()
  }

  return (
    <ScrollScreen
      hasParent={true}
      isModal={true}
      scrollEnabled={false}
      contentContainerStyle={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24
        }}>
        <Icons.Action.CheckCircleOutline
          color={colors.$textSuccess}
          width={75}
          height={75}
        />
        <Text
          variant="heading3"
          style={{
            textAlign: 'center',
            marginTop: 24,
            marginBottom: 18,
            fontWeight: '600'
          }}>
          Ledger wallet{'\n'}successfully added
        </Text>
        <Text
          variant="body1"
          style={{
            textAlign: 'center',
            color: colors.$textSecondary,
            lineHeight: 20,
            marginBottom: 80
          }}>
          You can now start buying, swapping, sending, receiving crypto and
          collectibles via the app with your Ledger wallet
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <Button type="primary" size="large" onPress={handleComplete}>
          Done
        </Button>
      </View>
    </ScrollScreen>
  )
}
