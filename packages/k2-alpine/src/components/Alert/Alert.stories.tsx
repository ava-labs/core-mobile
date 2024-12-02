import React, { useState } from 'react'
import { ScrollView, View } from '../Primitives'
import { Button, AlertWithTextInputs, useTheme, showAlert } from '../..'

export default {
  title: 'Alert'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()
  const [alertWithTextInputVisible, setAlertWithTextInputVisible] =
    useState(false)

  const DELETE_TEXT = 'DELETE'

  const handleNativeAlert = (): void => {
    showAlert({
      title: 'Simple Alert',
      description: 'Are you sure you want to delete your wallet?',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive'
        }
      ]
    })
  }

  const handleShowAlertWithTextInput = (): void => {
    setAlertWithTextInputVisible(true)
  }

  const handleHideAlertWithTextInput = (): void => {
    setAlertWithTextInputVisible(false)
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
          Simple Alert
        </Button>
        <Button
          type="primary"
          size="large"
          onPress={handleShowAlertWithTextInput}>
          Alert with text input
        </Button>
      </ScrollView>
      <AlertWithTextInputs
        visible={alertWithTextInputVisible}
        title="Delete Wallet"
        description={`If you want to delete your wallet, please enter ${DELETE_TEXT}.`}
        inputs={[{ key: 'delete' }]}
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              handleHideAlertWithTextInput()
            }
          },
          {
            text: 'Delete',
            style: 'destructive',
            shouldDisable: (values: Record<string, string>) => {
              return values.delete !== DELETE_TEXT
            },
            onPress: (values: Record<string, string>) => {
              if (values.delete === DELETE_TEXT) {
                handleHideAlertWithTextInput()
              }
            }
          }
        ]}
      />
    </View>
  )
}
