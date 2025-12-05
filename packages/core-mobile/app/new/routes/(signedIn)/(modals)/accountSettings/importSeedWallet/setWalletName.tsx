import { showAlert } from '@avalabs/k2-alpine'
import * as bip39 from 'bip39'
import { MINIMUM_MNEMONIC_WORDS } from 'common/consts'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useImportMnemonic } from 'common/hooks/useImportMnemonic'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { SetWalletName as Component } from 'features/onboarding/components/SetWalletName'
import React, { useCallback, useState } from 'react'
import KeychainMigrator, { MigrationStatus } from 'utils/KeychainMigrator'

export default function SetWalletName(): JSX.Element {
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const [name, setName] = useState<string>('')
  const navigation = useNavigation()
  const router = useRouter()

  const activeWallet = useActiveWallet()
  const { isImporting, importWallet } = useImportMnemonic()
  const [isCheckingMigration, setIsCheckingMigration] = useState(false)

  const handleImport = useCallback(async () => {
    const trimmedMnemonic = mnemonic.toLowerCase().trim()
    const isValid = bip39.validateMnemonic(trimmedMnemonic)

    if (!isValid) {
      showAlert({
        title: 'Invalid phrase',
        description:
          'The recovery phrase you entered is invalid. Please double check for spelling mistakes or the order of each word.',
        buttons: [
          {
            text: 'Dismiss',
            style: 'destructive'
          }
        ]
      })
      return
    }

    setIsCheckingMigration(true)
    const migrator = new KeychainMigrator(activeWallet.id)
    const migrationStatus = await migrator.getMigrationStatus('PIN')
    setIsCheckingMigration(false)

    if (migrationStatus !== MigrationStatus.NoMigrationNeeded) {
      router.navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/verifyPin',
        params: {
          walletSecretToImport: trimmedMnemonic
        }
      })
    } else {
      await importWallet(trimmedMnemonic, name)
      navigation.getParent()?.goBack()
    }
  }, [mnemonic, activeWallet.id, router, importWallet, name, navigation])

  return (
    <Component
      name={name}
      setName={setName}
      parentIsLoading={isImporting || isCheckingMigration}
      buttonText="Import"
      disabled={
        !mnemonic ||
        mnemonic.trim().split(/\s+/).length < MINIMUM_MNEMONIC_WORDS ||
        isImporting ||
        isCheckingMigration
      }
      onNext={handleImport}
    />
  )
}
