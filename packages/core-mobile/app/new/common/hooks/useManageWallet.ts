import { showAlert } from '@avalabs/k2-alpine'
import { DropdownItem } from 'common/components/DropdownMenu'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { useLedgerWallet } from 'features/ledger/hooks/useLedgerWallet'
import { useLedgerWalletMap } from 'features/ledger/store'
import { showSnackbar } from 'new/common/utils/toast'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerAppType } from 'services/ledger/types'
import { WalletType } from 'services/wallet/types'
import { addAccount, selectAccounts } from 'store/account'
import { removeAccount, selectImportedAccounts } from 'store/account/slice'
import { AppThunkDispatch } from 'store/types'
import {
  selectIsMigratingActiveAccounts,
  selectRemovableWallets,
  selectWalletsCount,
  setWalletName
} from 'store/wallet/slice'
import { removeWallet } from 'store/wallet/thunks'
import { Wallet } from 'store/wallet/types'
import Logger from 'utils/Logger'

export const useManageWallet = (
  wallet: Wallet
): {
  handleAddAccount: (wallet: Wallet) => void
  getDropdownItems: (wallet: Wallet) => DropdownItem[]
  handleDropdownSelect: (action: string, wallet: Wallet) => void
  isAddingAccount: boolean
  isAvalancheAppOpen: boolean
  isLedger: boolean
} => {
  const { removeLedgerWallet } = useLedgerWalletMap()
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const dispatch = useDispatch<AppThunkDispatch>()
  const walletsCount = useSelector(selectWalletsCount)
  const importedAccounts = useSelector(selectImportedAccounts)
  const removableWallets = useSelector(selectRemovableWallets)
  const accounts = useSelector(selectAccounts)
  const isMigratingActiveAccounts = useSelector(selectIsMigratingActiveAccounts)

  const { ledgerWalletMap } = useLedgerWalletMap()
  const { transportState } = useLedgerWallet()

  const isLedger = useMemo(() => {
    return (
      wallet.type === WalletType.LEDGER_LIVE ||
      wallet.type === WalletType.LEDGER
    )
  }, [wallet.type])

  const deviceForWallet = useMemo(() => {
    if (!wallet.id) return undefined
    return ledgerWalletMap[wallet.id]
  }, [ledgerWalletMap, wallet.id])

  const handleRemoveAllImportedAccounts = useCallback((): void => {
    importedAccounts.forEach(account => {
      dispatch(removeAccount(account.id))
      // removeWallet will also set the first account of the first wallet as active
      dispatch(removeWallet(account.walletId))
    })
  }, [dispatch, importedAccounts])

  const [isAvalancheAppOpen, setIsAvalancheAppOpen] = useState(false)

  useEffect(() => {
    async function checkApp(): Promise<void> {
      if (isLedger && transportState.available) {
        setIsAvalancheAppOpen(false)
        try {
          LedgerService.ensureConnection(deviceForWallet?.deviceId || '')
          await LedgerService.waitForApp(LedgerAppType.AVALANCHE) // timeout set to 30 seconds
          setIsAvalancheAppOpen(true)
        } catch (error) {
          setIsAvalancheAppOpen(false)
        }
      } else {
        setIsAvalancheAppOpen(false)
      }
    }
    checkApp()
  }, [deviceForWallet?.deviceId, isLedger, transportState.available])

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
      if (walletsCount <= 1) {
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

              if (
                wallet.type === WalletType.LEDGER ||
                wallet.type === WalletType.LEDGER_LIVE
              ) {
                removeLedgerWallet(wallet.id)
              }
            }
          }
        ]
      })
    },
    [dispatch, walletsCount, removeLedgerWallet]
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

      // 2. Mnemonic wallets can be removed if there are multiple mnemonic/seedless/keystone wallets
      const isLastRemovableMnemonic =
        removableWallets.length === 1 &&
        (wallet.type === WalletType.MNEMONIC ||
          wallet.type === WalletType.KEYSTONE)

      return !isLastRemovableMnemonic
    },
    [removableWallets]
  )

  const getDropdownItems = useCallback(
    (wallet: Wallet): DropdownItem[] => {
      const baseItems: DropdownItem[] = []

      if (wallet.type !== WalletType.PRIVATE_KEY) {
        baseItems.push({
          id: 'rename',
          title: 'Rename'
        })
      }

      if (
        [
          WalletType.MNEMONIC,
          WalletType.SEEDLESS,
          WalletType.KEYSTONE
        ].includes(wallet.type) ||
        (isAvalancheAppOpen && isLedger)
      ) {
        baseItems.push({
          id: 'add_account',
          title: 'Add account to this wallet',
          disabled: isMigratingActiveAccounts
        })
      }

      if (canRemoveWallet(wallet) && wallet.type !== WalletType.PRIVATE_KEY) {
        baseItems.push({
          id: 'remove',
          title: 'Remove wallet',
          destructive: true
        })
      }

      if (wallet.type === WalletType.PRIVATE_KEY) {
        baseItems.push({
          id: 'remove_all_imported_accounts',
          title: 'Remove all accounts',
          destructive: true
        })
      }

      return baseItems
    },
    [canRemoveWallet, isAvalancheAppOpen, isLedger, isMigratingActiveAccounts]
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
        case 'remove_all_imported_accounts':
          handleRemoveAllImportedAccounts()
          break
      }
    },
    [
      handleRenameWallet,
      handleRemoveWallet,
      handleAddAccount,
      handleRemoveAllImportedAccounts
    ]
  )

  const handleDropdownSelect = useCallback(
    (action: string, wallet: Wallet) => {
      handleWalletMenuAction(action, wallet)
    },
    [handleWalletMenuAction]
  )

  return {
    isAddingAccount,
    handleAddAccount,
    getDropdownItems,
    handleDropdownSelect,
    isAvalancheAppOpen,
    isLedger
  }
}
