import { Button, Text, useTheme } from '@avalabs/k2-alpine'
import { useNavigation } from 'expo-router'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'
import React from 'react'
import { View } from 'react-native'

export default function CompleteScreen(): JSX.Element {
  const navigation = useNavigation()
  const {
    theme: { colors }
  } = useTheme()

  const { resetSetup } = useLedgerSetupContext()

  const handleComplete = (): void => {
    resetSetup()
    navigation.getParent()?.goBack()
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
