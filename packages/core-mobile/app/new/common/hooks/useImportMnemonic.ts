import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { AppThunkDispatch } from 'store/types'
import { importMnemonicWalletAndAccount } from 'store/wallet/thunks'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { showSnackbar } from 'new/common/utils/toast'
import Logger from 'utils/Logger'

export const useImportMnemonic = (): {
  isImporting: boolean
  importWallet: (mnemonic: string) => Promise<void>
} => {
  const dispatch = useDispatch<AppThunkDispatch>()
  const { canGoBack, back } = useRouter()
  const [isImporting, setIsImporting] = useState(false)

  const importWallet = useCallback(
    async (mnemonic: string) => {
      if (!mnemonic) {
        Logger.error('Missing mnemonic for seed wallet import')
        return
      }

      setIsImporting(true)
      try {
        await dispatch(
          importMnemonicWalletAndAccount({
            mnemonic
          })
        ).unwrap()

        AnalyticsService.capture('MnemonicWalletImported', {
          walletType: WalletType.MNEMONIC
        })
        showSnackbar('Wallet imported successfully!')

        if (canGoBack()) back()
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
    [dispatch, canGoBack, back]
  )

  return { isImporting, importWallet }
}
