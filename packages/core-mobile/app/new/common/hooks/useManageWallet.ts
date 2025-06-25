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
import { AppThunkDispatch } from 'store/types'

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
  const dispatch = useDispatch<AppThunkDispatch>()
  const wallets = useSelector(selectWallets)

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

  const dropdownItems = useMemo((): DropdownItem[] => {
    return [
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
  }, [])

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
      }
    },
    [handleRenameWallet, handleRemoveWallet]
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
