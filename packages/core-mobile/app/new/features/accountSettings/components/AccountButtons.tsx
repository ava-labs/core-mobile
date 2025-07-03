import { Button, Text, useTheme, View } from '@avalabs/k2-alpine'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import React, { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'expo-router'
import {
  removeAccountWithActiveCheck,
  selectAccountById,
  selectAccountsByWalletId,
  setAccountTitle
} from 'store/account'
import { WalletType } from 'services/wallet/types'

export const AccountButtons = ({
  accountId,
  walletType
}: {
  accountId: string
  walletType: WalletType
}): React.JSX.Element => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { theme } = useTheme()
  const account = useSelector(selectAccountById(accountId))
  const siblingAccounts = useSelector((state: RootState) =>
    selectAccountsByWalletId(state, account?.walletId ?? '')
  )

  const isRemoveEnabled = useMemo(() => {
    if (!account) return false

    if (siblingAccounts.length <= 1) return false

    const highestIndexInWallet = Math.max(
      ...siblingAccounts.map(acc => acc.index)
    )
    return account.index === highestIndexInWallet
  }, [account, siblingAccounts])

  const handleShowAlertWithTextInput = (): void => {
    showAlertWithTextInput({
      title: 'Rename account',
      inputs: [{ key: 'accountName', defaultValue: account?.name }],
      buttons: [
        {
          text: 'Cancel',
          onPress: dismissAlertWithTextInput
        },
        {
          text: 'Save',
          shouldDisable: (values: Record<string, string>) => {
            return values.accountName?.length === 0
          },
          onPress: handleSaveAccountName
        }
      ]
    })
  }

  const handleRemoveAccount = useCallback((): void => {
    if (!account) return

    showAlertWithTextInput({
      title: 'Remove account',
      description: `Are you sure you want to remove "${account.name}"?`,
      inputs: [],
      buttons: [
        {
          text: 'Cancel',
          onPress: dismissAlertWithTextInput
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            dismissAlertWithTextInput()
            dispatch(removeAccountWithActiveCheck(account.id))
            router.back()
          }
        }
      ]
    })
  }, [account, dispatch, router])

  const handleSaveAccountName = useCallback(
    (values: Record<string, string>): void => {
      if (values.accountName && values.accountName.length > 0) {
        dismissAlertWithTextInput()
        if (account && values.accountName !== account.name) {
          dispatch(
            setAccountTitle({
              accountId: account.id,
              title: values.accountName,
              walletType
            })
          )
        }
      }
    },
    [account, dispatch, walletType]
  )

  return (
    <View sx={{ gap: 12 }}>
      <Button
        style={{ borderRadius: 12 }}
        size="large"
        type="secondary"
        onPress={handleShowAlertWithTextInput}>
        Rename account
      </Button>
      {walletType !== WalletType.SEEDLESS && (
        <Button
          style={{ borderRadius: 12 }}
          size="large"
          textStyle={{
            color: theme.colors.$textDanger
          }}
          type="secondary"
          disabled={!isRemoveEnabled}
          onPress={handleRemoveAccount}>
          Remove account
        </Button>
      )}
      {!isRemoveEnabled && (
        <Text variant="caption" sx={{ color: theme.colors.$textSecondary }}>
          Only the most recently added seed phrase accounts may be removed
        </Text>
      )}
    </View>
  )
}
