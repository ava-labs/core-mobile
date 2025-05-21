import { useLocalSearchParams, useRouter } from 'expo-router'
import { VerifyPin } from 'new/common/components/VerifyPin'
import React, { useCallback, useState } from 'react'
import Logger from 'utils/Logger'
import { useSelector, useDispatch } from 'react-redux'
import { selectActiveWallet } from 'store/wallet/slice'
import { AppThunkDispatch } from 'store/types'
import { importMnemonicWalletAndAccount } from 'store/wallet/thunks'
import { showSnackbar } from 'new/common/utils/toast'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { ActivityIndicator, View } from '@avalabs/k2-alpine'

const VerifyPinScreen = (): React.JSX.Element => {
  const { canGoBack, back } = useRouter()
  const activeWallet = useSelector(selectActiveWallet)
  const { mnemonicToImport } = useLocalSearchParams<{
    mnemonicToImport: string
  }>()
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
          importMnemonicWalletAndAccount({ mnemonic: mnemonicToImport, pin })
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
        showSnackbar(`Import failed: ${error.message || 'Unknown error'}`)
      } finally {
        setIsImporting(false)
      }
    },
    [activeWallet, canGoBack, back, dispatch, mnemonicToImport]
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
