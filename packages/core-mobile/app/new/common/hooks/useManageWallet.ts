import { DropdownItem } from 'common/components/DropdownMenu'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectWallets, setWalletName } from 'store/wallet/slice'
import { WalletId } from 'store/wallet/types'
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
      }
    },
    [handleRenameWallet]
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
