import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter } from 'expo-router'
import { StackActions } from '@react-navigation/native'
import { useNavigation } from '@react-navigation/native'
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
  const { canGoBack } = useRouter()
  const [isImporting, setIsImporting] = useState(false)
  const navigation = useNavigation()

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

        if (canGoBack()) {
          navigation.dispatch(StackActions.popTo('manageAccounts'))
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
