import { router } from 'expo-router'
import React from 'react'
import { View, Text, Button } from '@avalabs/k2-alpine'
import { useAlert } from 'new/hooks/useAlert'

const AccountScreen = (): JSX.Element => {
  const DELETE_TEXT = 'DELETE'
  const deleteWalletAlert = useAlert({
    title: 'Delete Wallet',
    description: `If you want to delete your wallet, please enter ${DELETE_TEXT}.`,
    inputs: [{ key: 'delete' }],
    buttons: [
      {
        title: 'Cancel',
        onAction: () => {
          deleteWalletAlert.hide()
        }
      },
      {
        title: 'Delete',
        destructive: true,
        bold: true,
        shouldDisable: (values: Record<string, string>) => {
          return values.delete !== DELETE_TEXT
        },
        onAction: (values: Record<string, string>) => {
          if (values.delete === DELETE_TEXT) {
            deleteWalletAlert.hide()

            router.replace('/')
          }
        }
      }
    ]
  })

  const handleDeleteWallet = (): void => {
    deleteWalletAlert.show()
  }

  return (
    <View
      sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text variant="heading3">Account Settings</Text>
      <Button size="medium" type="tertiary" onPress={handleDeleteWallet}>
        Delete Wallet
      </Button>
      {deleteWalletAlert.render()}
    </View>
  )
}

export default AccountScreen
