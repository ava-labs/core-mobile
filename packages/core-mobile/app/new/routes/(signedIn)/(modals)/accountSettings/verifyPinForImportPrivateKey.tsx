import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator } from '@avalabs/k2-alpine'
import { View } from '@avalabs/k2-alpine'
import { WalletType } from 'services/wallet/types'
import { useDispatch } from 'react-redux'
import { useSelector } from 'react-redux'
import { selectActiveWallet } from 'store/wallet/slice'
import { AppThunkDispatch } from 'store/types'
import { importPrivateKeyAccountAndCreateWallet } from 'store/wallet/thunks'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import { useCallback } from 'react'
import { VerifyPin } from 'common/components/VerifyPin'
import { ImportedAccount } from 'store/account/types'
import AnalyticsService from 'services/analytics/AnalyticsService'

const VerifyPinForImportPrivateKeyScreen = (): JSX.Element => {
  const { canGoBack, back } = useRouter()
  const activeWallet = useSelector(selectActiveWallet)
  const { privateKeyAccountString, privateKey } = useLocalSearchParams<{
    privateKeyAccountString: string //typeof ImportedAccount
    privateKey: string
  }>()
  // Parse the string back to an ImportedAccount object
  const privateKeyAccount: ImportedAccount | null = privateKeyAccountString
    ? JSON.parse(privateKeyAccountString)
    : null

  const dispatch = useDispatch<AppThunkDispatch>()
  const [isImporting, setIsImporting] = useState(false)

  const handlePinVerified = useCallback(
    async (pin: string): Promise<void> => {
      if (!activeWallet) {
        Logger.error('No active wallet found after PIN verification screen.')
        showSnackbar('Error: No active wallet found.')
        if (canGoBack()) back()
        return
      }

      setIsImporting(true)

      try {
        await dispatch(
          importPrivateKeyAccountAndCreateWallet({
            accountDetails: privateKeyAccount as ImportedAccount,
            accountSecret: privateKey,
            pin
          })
        ).unwrap()

        AnalyticsService.capture('PrivateKeyWalletImported', {
          walletType: WalletType.PRIVATE_KEY
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
    [activeWallet, canGoBack, back, dispatch, privateKeyAccount, privateKey]
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

export default VerifyPinForImportPrivateKeyScreen
