import { noop } from '@avalabs/core-utils-sdk'
import { AlertWithTextInputs, Button, View } from '@avalabs/k2-alpine'
import React, { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountByUuid, setAccountTitle } from 'store/account'
import { selectWalletType } from 'store/app'

export const AccountButtons = ({
  accountUuid
}: {
  accountUuid: string
}): React.JSX.Element => {
  const dispatch = useDispatch()
  const walletType = useSelector(selectWalletType)
  const account = useSelector(selectAccountByUuid(accountUuid))
  const [alertWithTextInputVisible, setAlertWithTextInputVisible] =
    useState(false)

  const handleShowAlertWithTextInput = (): void => {
    setAlertWithTextInputVisible(true)
  }

  const handleHideAlertWithTextInput = (): void => {
    setAlertWithTextInputVisible(false)
  }

  const handleSaveAccountName = useCallback(
    (values: Record<string, string>): void => {
      if (values.accountName && values.accountName.length > 0) {
        handleHideAlertWithTextInput()
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
      <Button
        style={{ borderRadius: 12 }}
        size="large"
        type="secondary"
        // todo: CP-10070
        onPress={noop}>
        Export private key
      </Button>
      {/* TODO: waiting product decision on whether we show this  */}
      {/* <Button
        style={{ borderRadius: 12 }}
        size="large"
        type="secondary"
        onPress={noop}>
        Hide account
      </Button> */}

      <AlertWithTextInputs
        visible={alertWithTextInputVisible}
        title="Rename account"
        inputs={[{ key: 'accountName', defaultValue: account?.name }]}
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: handleHideAlertWithTextInput
          },
          {
            text: 'Save',
            shouldDisable: (values: Record<string, string>) => {
              return values.accountName?.length === 0
            },
            onPress: handleSaveAccountName
          }
        ]}
      />
    </View>
  )
}
