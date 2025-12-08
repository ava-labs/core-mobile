import { useNavigation, useRouter } from 'expo-router'
import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { AppThunkDispatch } from 'store/types'
import { importMnemonicWalletAndAccount } from 'store/wallet/thunks'
import Logger from 'utils/Logger'

export const useImportMnemonic = (): {
  isImporting: boolean
  importWallet: (mnemonic: string, name?: string) => Promise<void>
} => {
  const dispatch = useDispatch<AppThunkDispatch>()
  const { canGoBack } = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const navigation = useNavigation()

  const importWallet = useCallback(
    async (mnemonic: string, name?: string) => {
      if (!mnemonic) {
        Logger.error('Missing mnemonic for seed wallet import')
        return
      }

      setIsImporting(true)
      try {
        await dispatch(
          importMnemonicWalletAndAccount({
            mnemonic,
            name
          })
        ).unwrap()

        AnalyticsService.capture('MnemonicWalletImported', {
          walletType: WalletType.MNEMONIC
        })
        showSnackbar('Wallet imported successfully!')

        if (canGoBack()) {
          navigation.getParent()?.goBack()
        }
      } catch (error) {
        Logger.error('Failed to import mnemonic wallet', error)
        showSnackbar(
          `Import failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
      } finally {
        setIsImporting(false)
      }
    },
    [dispatch, canGoBack, navigation]
  )

  return { isImporting, importWallet }
}
