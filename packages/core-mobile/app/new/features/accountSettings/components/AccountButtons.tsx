import { Button, View } from '@avalabs/k2-alpine'
import {
  dismissAlertWithTextInput,
  showAlertWithTextInput
} from 'common/utils/alertWithTextInput'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccountByIndex, setAccountTitle } from 'store/account'
import { selectWalletType } from 'store/app'

export const AccountButtons = ({
  accountIndex
}: {
  accountIndex: number
}): React.JSX.Element => {
  const dispatch = useDispatch()
  const walletType = useSelector(selectWalletType)
  const account = useSelector(selectAccountByIndex(accountIndex))

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

  const handleSaveAccountName = useCallback(
    (values: Record<string, string>): void => {
      if (values.accountName && values.accountName.length > 0) {
        dismissAlertWithTextInput()
        values.accountName !== account?.name &&
          dispatch(
            setAccountTitle({
              accountIndex,
              title: values.accountName,
              walletType
            })
          )
      }
    },
    [account?.name, accountIndex, dispatch, walletType]
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
      {/* <Button
        style={{ borderRadius: 12 }}
        size="large"
        type="secondary"
        // todo: CP-10070
        onPress={noop}>
        Export private key
      </Button> */}
      {/* TODO: waiting product decision on whether we show this  */}
      {/* <Button
        style={{ borderRadius: 12 }}
        size="large"
        type="secondary"
        onPress={noop}>
        Hide account
      </Button> */}
    </View>
  )
}
