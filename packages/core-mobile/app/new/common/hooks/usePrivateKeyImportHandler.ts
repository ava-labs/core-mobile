import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { ImportedAccount } from 'store/account/types'
import KeychainMigrator from 'utils/KeychainMigrator'
import { useActiveWallet } from 'common/hooks/useActiveWallet'
import { useImportPrivateKey } from './useImportPrivateKey'

export const usePrivateKeyImportHandler = (
  tempAccountDetails: ImportedAccount | null,
  privateKey: string
): {
  isImporting: boolean
  handleImport: () => Promise<void>
  isCheckingMigration: boolean
} => {
  const [isCheckingMigration, setIsCheckingMigration] = useState(false)
  const { navigate } = useRouter()
  const activeWallet = useActiveWallet()
  const { importWallet, isImporting } = useImportPrivateKey()

  const handleImport = useCallback(async (): Promise<void> => {
    if (!tempAccountDetails) return

    setIsCheckingMigration(true)
    const migrator = new KeychainMigrator(activeWallet.id)
    const migrationNeeded = await migrator.getMigrationStatus('PIN')
    setIsCheckingMigration(false)

    if (migrationNeeded) {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/verifyPinForImportPrivateKey',
        params: {
          privateKeyAccountString: JSON.stringify(tempAccountDetails),
          privateKey
        }
      })
    } else {
      await importWallet(tempAccountDetails, privateKey)
    }
  }, [navigate, tempAccountDetails, privateKey, importWallet, activeWallet.id])

  return {
    handleImport,
    isImporting,
    isCheckingMigration
  }
}
