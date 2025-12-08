import { MINIMUM_MNEMONIC_WORDS } from 'common/consts'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useImportMnemonic } from 'common/hooks/useImportMnemonic'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import React, { useCallback, useState } from 'react'
import KeychainMigrator, { MigrationStatus } from 'utils/KeychainMigrator'

export default function SetWalletName(): JSX.Element {
  const { normalizedMnemonic } = useLocalSearchParams<{
    normalizedMnemonic: string
  }>()
  const [name, setName] = useState<string>('')
  const navigation = useNavigation()
  const router = useRouter()

  const activeWallet = useActiveWallet()
  const { isImporting, importWallet } = useImportMnemonic()
  const [isCheckingMigration, setIsCheckingMigration] = useState(false)

  const handleImport = useCallback(async () => {
    setIsCheckingMigration(true)
    const migrator = new KeychainMigrator(activeWallet.id)
    const migrationStatus = await migrator.getMigrationStatus('PIN')
    setIsCheckingMigration(false)

    if (migrationStatus !== MigrationStatus.NoMigrationNeeded) {
      router.navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/verifyPin',
        params: {
          walletSecretToImport: normalizedMnemonic
        }
      })
    } else {
      await importWallet(normalizedMnemonic, name)
      navigation.getParent()?.goBack()
    }
  }, [
    normalizedMnemonic,
    activeWallet.id,
    router,
    importWallet,
    name,
    navigation
  ])

  return (
    <Component
      name={name}
      setName={setName}
      parentIsLoading={isImporting || isCheckingMigration}
      buttonText="Import"
      disabled={
        !normalizedMnemonic ||
        normalizedMnemonic.trim().split(/\s+/).length <
          MINIMUM_MNEMONIC_WORDS ||
        isImporting ||
        isCheckingMigration
      }
      onNext={handleImport}
    />
  )
}
