import { useNavigation, useRouter } from 'expo-router'
import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { onWalletImported } from 'store/app/slice'
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
        const { walletId } = await dispatch(
          importMnemonicWalletAndAccount({
            mnemonic,
            name
          })
        ).unwrap()

        showSnackbar('Wallet imported successfully!')

        if (canGoBack()) {
          navigation.getParent()?.goBack()
        }

        // Trigger account discovery after a brief delay so the success
        // toast is visible before "Adding accounts..." replaces it.
        // Uses setTimeout to avoid blocking the finally/cleanup.
        setTimeout(() => {
          dispatch(
            onWalletImported({
              walletId,
              walletType: WalletType.MNEMONIC
            })
          )
        }, 1500)
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
