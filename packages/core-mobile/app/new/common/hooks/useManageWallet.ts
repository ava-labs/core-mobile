import { DropdownItem } from 'common/components/DropdownMenu'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectWallets, setWalletName } from 'store/wallet/slice'
import { Wallet } from 'store/wallet/types'
import { showAlert } from '@avalabs/k2-alpine'
import { removeWallet } from 'store/wallet/thunks'
import { addAccount } from 'store/account'
import { selectAccounts } from 'store/account/slice'
import { AppThunkDispatch } from 'store/types'
import { WalletType } from 'services/wallet/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { showSnackbar } from 'new/common/utils/toast'

export const useManageWallet = (): {
  getDropdownItems: (wallet: Wallet) => DropdownItem[]
  handleDropdownSelect: (action: string, wallet: Wallet) => void
} => {
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const dispatch = useDispatch<AppThunkDispatch>()
  const wallets = useSelector(selectWallets)
  const accounts = useSelector(selectAccounts)

  const handleRenameWallet = useCallback(
    (wallet: Wallet): void => {
      const handleSaveWalletName = (values: Record<string, string>): void => {
        if (values.newName) {
          dispatch(setWalletName({ walletId: wallet.id, name: values.newName }))
        }
      }

      showAlertWithTextInput({
        title: 'Rename wallet',
        inputs: [{ key: 'newName', defaultValue: wallet.name }],
        buttons: [
          {
            text: 'Cancel',
            onPress: dismissAlertWithTextInput
          },
          {
            text: 'Save',
            shouldDisable: (values: Record<string, string>) => {
              return values.newName?.trim().length === 0
            },
            onPress: handleSaveWalletName
          }
        ]
      })
    },
    [dispatch]
  )

  const handleRemoveWallet = useCallback(
    (wallet: Wallet): void => {
      const walletCount = Object.keys(wallets).length

      if (walletCount <= 1) {
        showAlert({
          title: 'Cannot remove wallet',
          description:
            'You must have at least one wallet. This is your only wallet.',
          buttons: [
            {
              text: 'OK'
            }
          ]
        })
        return
      }

      showAlert({
        title: 'Remove wallet',
        description: 'Are you sure you want to remove this wallet?',
        buttons: [
          {
            text: 'Cancel'
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              dispatch(removeWallet(wallet.id))
            }
          }
        ]
      })
    },
    [dispatch, wallets]
  )

  const handleAddAccount = useCallback(
    async (wallet: Wallet): Promise<void> => {
      if (isAddingAccount) return

      try {
        AnalyticsService.capture('AccountSelectorAddAccount', {
          accountNumber: Object.keys(accounts).length + 1
        })

        setIsAddingAccount(true)
        await dispatch(addAccount(wallet.id)).unwrap()

        AnalyticsService.capture('CreatedANewAccountSuccessfully', {
          walletType: wallet.type
        })

        showSnackbar('Account added successfully')
      } catch (error) {
        Logger.error('Unable to add account', error)
        showSnackbar('Unable to add account')
      } finally {
        setIsAddingAccount(false)
      }
    },
    [isAddingAccount, accounts, dispatch]
  )

  const canRemoveWallet = useCallback(
    (wallet: Wallet): boolean => {
      // 1. Seedless wallets cannot be removed
      if (wallet.type === WalletType.SEEDLESS) return false

      // 2. Mnemonic wallets can be removed if there are multiple mnemonic or seedless wallets
      const walletCount = Object.values(wallets).filter(
        w => w.type === WalletType.MNEMONIC || w.type === WalletType.SEEDLESS
      ).length

      const isLastRemovableMnemonic =
        walletCount === 1 && wallet.type === WalletType.MNEMONIC

      return !isLastRemovableMnemonic
    },
    [wallets]
  )

  const getDropdownItems = useCallback(
    (wallet: Wallet): DropdownItem[] => {
      const baseItems: DropdownItem[] = [
        {
          id: 'rename',
          title: 'Rename'
        }
      ]

      if (
        [WalletType.MNEMONIC, WalletType.SEEDLESS, WalletType.LEDGER].includes(
          wallet.type
        )
      ) {
        baseItems.push({
          id: 'add_account',
          title: 'Add account to this wallet'
        })
      }

      if (canRemoveWallet(wallet)) {
        baseItems.push({
          id: 'remove',
          title: 'Remove wallet',
          destructive: true
        })
      }
      return baseItems
    },
    [canRemoveWallet]
  )

  const handleWalletMenuAction = useCallback(
    (action: string, wallet: Wallet) => {
      switch (action) {
        case 'rename':
          handleRenameWallet(wallet)
          break
        case 'remove':
          handleRemoveWallet(wallet)
          break
        case 'add_account':
          handleAddAccount(wallet)
          break
      }
    },
    [handleRenameWallet, handleRemoveWallet, handleAddAccount]
  )

  const handleDropdownSelect = useCallback(
    (action: string, wallet: Wallet) => {
      handleWalletMenuAction(action, wallet)
    },
    [handleWalletMenuAction]
  )

  return {
    getDropdownItems,
    handleDropdownSelect
  }
}
