import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { AppThunkDispatch } from 'store/types'
import { importPrivateKeyWalletAndAccount } from 'store/wallet/thunks'
import { ImportedAccount } from 'store/account/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { WalletType } from 'services/wallet/types'
import { showSnackbar } from 'new/common/utils/toast'
import Logger from 'utils/Logger'
import { StackActions } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'

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
          // clear the stack back to the manage accounts screen
          navigation.dispatch(StackActions.popTo('manageAccounts'))
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
