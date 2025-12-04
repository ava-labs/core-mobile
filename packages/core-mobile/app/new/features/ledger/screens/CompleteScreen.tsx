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
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.$surfacePrimary
      }}>
      <Text
        variant="heading4"
        style={{ textAlign: 'center', marginBottom: 16 }}>
        🎉 Wallet created successfully!
      </Text>
      <Text
        variant="body1"
        style={{
          textAlign: 'center',
          color: colors.$textSecondary,
          marginBottom: 32
        }}>
        Your Ledger wallet has been set up and is ready to use.
      </Text>
      <Button type="primary" size="large" onPress={handleComplete}>
        Continue to wallet
      </Button>
    </View>
  )
}
