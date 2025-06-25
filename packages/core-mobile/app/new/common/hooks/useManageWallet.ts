import { DropdownItem } from 'common/components/DropdownMenu'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectWallets, setWalletName } from 'store/wallet/slice'
import { WalletId } from 'store/wallet/types'
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
  dropdownItems: DropdownItem[]
  handleDropdownSelect: (
    action: string,
    walletId: string,
    currentName: string
  ) => void
  setActiveDropdownWalletId: (id: string | null) => void
} => {
  const [activeDropdownWalletId, setActiveDropdownWalletId] = useState<
    string | null
  >(null)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const dispatch = useDispatch<AppThunkDispatch>()
  const wallets = useSelector(selectWallets)
  const accounts = useSelector(selectAccounts)

  const handleRenameWallet = useCallback(
    (walletId: WalletId, walletName: string): void => {
      const handleSaveWalletName = (values: Record<string, string>): void => {
        if (values.newName) {
          dispatch(setWalletName({ walletId: walletId, name: values.newName }))
        }
      }

      showAlertWithTextInput({
        title: 'Rename account',
        inputs: [{ key: 'newName', defaultValue: walletName }],
        buttons: [
          {
            text: 'Cancel',
            onPress: dismissAlertWithTextInput
          },
          {
            text: 'Save',
            shouldDisable: (values: Record<string, string>) => {
              return values.newName?.length === 0
            },
            onPress: handleSaveWalletName
          }
        ]
      })
    },
    [dispatch]
  )

  const handleRemoveWallet = useCallback(
    (walletId: WalletId): void => {
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
              dispatch(removeWallet(walletId))
            }
          }
        ]
      })
    },
    [dispatch, wallets]
  )

  const handleAddAccount = useCallback(
    async (walletId: WalletId): Promise<void> => {
      if (isAddingAccount) return

      const wallet = wallets[walletId]
      if (!wallet) {
        Logger.error('Wallet not found for adding account')
        return
      }

      try {
        AnalyticsService.capture('AccountSelectorAddAccount', {
          accountNumber: Object.keys(accounts).length + 1
        })

        setIsAddingAccount(true)
        await dispatch(addAccount(walletId)).unwrap()

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

  const dropdownItems = useMemo((): DropdownItem[] => {
    const baseItems = [
      {
        id: 'rename',
        title: 'Rename'
      },
      {
        id: 'remove',
        title: 'Remove wallet',
        destructive: true
      }
    ]

    // Only show add account option for mnemonic wallets
    if (activeDropdownWalletId) {
      const wallet = wallets[activeDropdownWalletId]
      if (wallet?.type === WalletType.MNEMONIC) {
        baseItems.push({
          id: 'add_account',
          title: 'Add account to this wallet'
        })
      }
    }

    return baseItems
  }, [activeDropdownWalletId, wallets])

  const handleWalletMenuAction = useCallback(
    (action: string, walletId: string, currentName: string) => {
      setActiveDropdownWalletId(null)

      switch (action) {
        case 'rename':
          handleRenameWallet(walletId, currentName)
          break
        case 'remove':
          handleRemoveWallet(walletId)
          break
        case 'add_account':
          handleAddAccount(walletId)
          break
      }
    },
    [handleRenameWallet, handleRemoveWallet, handleAddAccount]
  )

  const handleDropdownSelect = useCallback(
    (action: string, walletId: string, currentName: string) => {
      if (activeDropdownWalletId) {
        handleWalletMenuAction(action, walletId, currentName)
      }
    },
    [activeDropdownWalletId, handleWalletMenuAction]
  )

  return {
    dropdownItems,
    handleDropdownSelect,
    setActiveDropdownWalletId
  }
}
