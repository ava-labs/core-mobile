import React, { useCallback } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { View } from '@avalabs/k2-alpine'
import { VerifyPin } from 'common/components/VerifyPin'
import { ImportedAccount } from 'store/account/types'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import KeychainMigrator from 'utils/KeychainMigrator'
import { useImportPrivateKey } from 'new/common/hooks/useImportPrivateKey'
import { LoadingState } from 'common/components/LoadingState'

const VerifyPinForImportPrivateKeyScreen = (): JSX.Element => {
  const activeWallet = useActiveWallet()
  const { privateKeyAccountString, privateKey } = useLocalSearchParams<{
    privateKeyAccountString: string //typeof ImportedAccount
    privateKey: string
  }>()
  // Parse the string back to an ImportedAccount object
  const privateKeyAccount: ImportedAccount | null = privateKeyAccountString
    ? JSON.parse(privateKeyAccountString)
    : null

  const { isImporting, importWallet } = useImportPrivateKey()

  const handlePinVerified = useCallback(
    async (pin: string): Promise<void> => {
      if (!privateKeyAccount || !privateKey) return

      const migrator = new KeychainMigrator(activeWallet.id)
      await migrator.migrateIfNeeded('PIN', pin)

      await importWallet(privateKeyAccount, privateKey)
    },
    [activeWallet.id, importWallet, privateKeyAccount, privateKey]
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

export default VerifyPinForImportPrivateKeyScreen
