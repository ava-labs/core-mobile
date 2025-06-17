import { useLocalSearchParams, useRouter } from 'expo-router'
import { VerifyPin } from 'new/common/components/VerifyPin'
import React, { useCallback, useState } from 'react'
import Logger from 'utils/Logger'
import { useDispatch } from 'react-redux'
import { AppThunkDispatch } from 'store/types'
import { importMnemonicWalletAndAccount } from 'store/wallet/thunks'
import { showSnackbar } from 'new/common/utils/toast'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { ActivityIndicator, View } from '@avalabs/k2-alpine'
import KeychainMigrator from 'utils/KeychainMigrator'
import { useActiveWallet } from 'common/hooks/useActiveWallet'

const VerifyPinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const activeWallet = useActiveWallet()
  const { walletSecretToImport } = useLocalSearchParams<{
    walletSecretToImport: string
  }>()
  const dispatch = useDispatch<AppThunkDispatch>()
  const [isImporting, setIsImporting] = useState(false)

  const handlePinVerified = useCallback(
    async (pin: string): Promise<void> => {
      const migrator = new KeychainMigrator(activeWallet.id)
      await migrator.migrateIfNeeded('PIN', pin)

      setIsImporting(true)

      try {
        await dispatch(
          importMnemonicWalletAndAccount({
            mnemonic: walletSecretToImport
          })
        ).unwrap()

        AnalyticsService.capture('MnemonicWalletImported', {
          walletType: WalletType.MNEMONIC
        })
        showSnackbar('Wallet imported successfully!')

        if (canGoBack()) back()
      } catch (error) {
        Logger.error(
          'Failed to import mnemonic wallet after PIN verification',
          error
        )
        showSnackbar(
          `Import failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      } finally {
        setIsImporting(false)
      }
    },
    [activeWallet, canGoBack, back, dispatch, walletSecretToImport]
  )

  if (isImporting) {
    return (
      <View sx={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return <VerifyPin onVerified={handlePinVerified} />
}
export default VerifyPinScreen
