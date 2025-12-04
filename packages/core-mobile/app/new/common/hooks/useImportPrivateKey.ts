import { useNavigation, useRouter } from 'expo-router'
import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { ImportedAccount } from 'store/account/types'
import { AppThunkDispatch } from 'store/types'
import { importPrivateKeyWalletAndAccount } from 'store/wallet/thunks'
import Logger from 'utils/Logger'

export const useImportPrivateKey = (): {
  isImporting: boolean
  importWallet: (
    accountDetails: ImportedAccount,
    accountSecret: string
  ) => Promise<void>
} => {
  const dispatch = useDispatch<AppThunkDispatch>()
  const { canGoBack } = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const navigation = useNavigation()
  const importWallet = useCallback(
    async (accountDetails: ImportedAccount, accountSecret: string) => {
      if (!accountDetails || !accountSecret) {
        Logger.error('Missing account details or secret for private key import')
        return
      }

      setIsImporting(true)
      try {
        await dispatch(
          importPrivateKeyWalletAndAccount({
            accountDetails,
            accountSecret
          })
        ).unwrap()

        AnalyticsService.capture('PrivateKeyWalletImported', {
          walletType: WalletType.PRIVATE_KEY
        })
        showSnackbar('Wallet imported successfully!')

        if (canGoBack()) {
          navigation.getParent()?.goBack()
        }
      } catch (error) {
        Logger.error('Failed to import private key wallet', error)
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
