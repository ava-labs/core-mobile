import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { Text, Button, useTheme } from '@avalabs/k2-alpine'
import { useLedgerSetupContext } from 'new/features/ledger/contexts/LedgerSetupContext'

export default function CompleteScreen(): JSX.Element {
  const { push } = useRouter()
  const {
    theme: { colors }
  } = useTheme()

  const { resetSetup } = useLedgerSetupContext()

  const handleComplete = (): void => {
    resetSetup()
    // Navigate to account management after successful wallet creation
    // @ts-ignore TODO: make routes typesafe
    push('/accountSettings/manageAccounts')
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
        🎉 Wallet Created Successfully!
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
        Continue to Wallet
      </Button>
    </View>
  )
}
