import { useLocalSearchParams } from 'expo-router'
import { VerifyPin } from 'new/common/components/VerifyPin'
import React, { useCallback } from 'react'
import { View } from '@avalabs/k2-alpine'
import KeychainMigrator from 'utils/KeychainMigrator'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useImportMnemonic } from 'new/common/hooks/useImportMnemonic'
import { LoadingState } from 'common/components/LoadingState'

const VerifyPinScreen = (): React.JSX.Element => {
  const activeWallet = useActiveWallet()
  const { walletSecretToImport } = useLocalSearchParams<{
    walletSecretToImport: string
  }>()
  const { isImporting, importWallet } = useImportMnemonic()

  const handlePinVerified = useCallback(
    async (pin: string): Promise<void> => {
      if (!walletSecretToImport) return

      const migrator = new KeychainMigrator(activeWallet.id)
      await migrator.migrateIfNeeded('PIN', pin)

      await importWallet(walletSecretToImport)
    },
    [activeWallet.id, walletSecretToImport, importWallet]
  )

  if (isImporting) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingState />
      </View>
    )
  }

  return <VerifyPin onVerified={handlePinVerified} />
}
export default VerifyPinScreen
