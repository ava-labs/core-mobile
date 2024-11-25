import React from 'react'
import { Alert } from 'react-native'
import { ScrollView, View } from '../Primitives'
import { Button, useAlert, useTheme } from '../..'

export default {
  title: 'Alert'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const simpleAlert = useAlert({
    title: 'Simple Alert',
    description: `Are you sure you want to delete your wallet?`,
    buttons: [
      {
        text: 'Cancel',
        bold: true,
        onAction: () => {
          simpleAlert.hide()
        }
      },
      {
        text: 'Delete',
        destructive: true,
        bold: true,
        onAction: () => {
          simpleAlert.hide()
        }
      }
    ]
  })

  const DELETE_TEXT = 'DELETE'
  const alertWithTextInput = useAlert({
    title: 'Delete Wallet',
    description: `If you want to delete your wallet, please enter ${DELETE_TEXT}.`,
    inputs: [{ key: 'delete' }],
    buttons: [
      {
        text: 'Cancel',
        onAction: () => {
          alertWithTextInput.hide()
        }
      },
      {
        text: 'Delete',
        destructive: true,
        bold: true,
        shouldDisable: (values: Record<string, string>) => {
          return values.delete !== DELETE_TEXT
        },
        onAction: (values: Record<string, string>) => {
          if (values.delete === DELETE_TEXT) {
            alertWithTextInput.hide()
          }
        }
      }
    ]
  })

  const handleNativeAlert = (): void => {
    Alert.alert(
      'Native Alert',
      'Are you sure you want to delete your wallet?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive'
        }
      ]
    )
  }

  const handleSimpleAlert = (): void => {
    simpleAlert.show()
  }

  const handleAlertWithTextInput = (): void => {
    alertWithTextInput.show()
  }

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{ width: '100%', backgroundColor: 'transparent' }}
        contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Button type="primary" size="large" onPress={handleNativeAlert}>
          Native Alert
        </Button>
        <Button type="primary" size="large" onPress={handleSimpleAlert}>
          Simple Alert
        </Button>
        <Button type="primary" size="large" onPress={handleAlertWithTextInput}>
          Alert with text input
        </Button>
      </ScrollView>
      {simpleAlert.render()}
      {alertWithTextInput.render()}
    </View>
  )
}
