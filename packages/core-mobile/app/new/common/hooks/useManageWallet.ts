import { DropdownItem } from 'common/components/DropdownMenu'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectWallets, setWalletName } from 'store/wallet/slice'
import { Wallet, WalletId } from 'store/wallet/types'
import { showAlert } from '@avalabs/k2-alpine'
import { removeWallet } from 'store/wallet/thunks'
import { addAccount } from 'store/account'
import { selectAccounts } from 'store/account/slice'
import { AppThunkDispatch } from 'store/types'
import { WalletType } from 'services/wallet/types'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import { showSnackbar } from 'new/common/utils/toast'

export const useManageWallet = (
  walletId?: string
): {
  dropdownItems: DropdownItem[]
  handleDropdownSelect: (
    action: string,
    walletId: string,
    currentName: string
  ) => void
} => {
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const dispatch = useDispatch<AppThunkDispatch>()
  const wallets = useSelector(selectWallets)
  const accounts = useSelector(selectAccounts)

  const handleRenameWallet = useCallback(
    (_walletId: WalletId, walletName: string): void => {
      const handleSaveWalletName = (values: Record<string, string>): void => {
        if (values.newName) {
          dispatch(setWalletName({ walletId: _walletId, name: values.newName }))
        }
      }

      showAlertWithTextInput({
        title: 'Rename wallet',
        inputs: [{ key: 'newName', defaultValue: walletName }],
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
    (_walletId: WalletId): void => {
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
              dispatch(removeWallet(_walletId))
            }
          }
        ]
      })
    },
    [dispatch, wallets]
  )

  const handleAddAccount = useCallback(
    async (_walletId: WalletId): Promise<void> => {
      if (isAddingAccount) return

      const wallet = wallets[_walletId]
      if (!wallet) {
        Logger.error('Wallet not found for adding account')
        return
      }

      try {
        AnalyticsService.capture('AccountSelectorAddAccount', {
          accountNumber: Object.keys(accounts).length + 1
        })

        setIsAddingAccount(true)
        await dispatch(addAccount(_walletId)).unwrap()

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
    [isAddingAccount, accounts, dispatch, wallets]
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
        walletCount === 1 && wallets[wallet.id]?.type === WalletType.MNEMONIC

      return !isLastRemovableMnemonic
    },
    [wallets]
  )

  const dropdownItems = useMemo((): DropdownItem[] => {
    const baseItems: DropdownItem[] = [
      {
        id: 'rename',
        title: 'Rename'
      }
    ]

    // Only show add account option for mnemonic and seedless wallets
    if (walletId) {
      const wallet = wallets[walletId]
      if (!wallet) {
        Logger.error('Wallet not found for dropdown items')
        return baseItems
      }

      if (canRemoveWallet(wallet)) {
        baseItems.push({
          id: 'remove',
          title: 'Remove wallet',
          destructive: true
        })
      }

      if ([WalletType.MNEMONIC, WalletType.SEEDLESS].includes(wallet.type)) {
        baseItems.push({
          id: 'add_account',
          title: 'Add account to this wallet'
        })
      }
    }

    return baseItems
  }, [walletId, wallets, canRemoveWallet])

  const handleWalletMenuAction = useCallback(
    (action: string, _walletId: string, currentName: string) => {
      switch (action) {
        case 'rename':
          handleRenameWallet(_walletId, currentName)
          break
        case 'remove':
          handleRemoveWallet(_walletId)
          break
        case 'add_account':
          handleAddAccount(_walletId)
          break
      }
    },
    [handleRenameWallet, handleRemoveWallet, handleAddAccount]
  )

  const handleDropdownSelect = useCallback(
    (action: string, _walletId: string, currentName: string) => {
      handleWalletMenuAction(action, _walletId, currentName)
    },
    [handleWalletMenuAction]
  )

  return {
    dropdownItems,
    handleDropdownSelect
  }
}
