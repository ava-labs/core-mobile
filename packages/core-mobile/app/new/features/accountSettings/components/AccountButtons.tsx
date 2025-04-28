import { AlertWithTextInputs, Button, View } from '@avalabs/k2-alpine'
import { AlertWithTextInputsHandle } from '@avalabs/k2-alpine/src/components/Alert/types'
import React, { useRef, useCallback } from 'react'
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
  const alert = useRef<AlertWithTextInputsHandle>(null)

  const handleShowAlertWithTextInput = (): void => {
    alert.current?.show({
      title: 'Rename account',
      inputs: [{ key: 'accountName', defaultValue: account?.name }],
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            alert.current?.hide()
          }
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
        alert.current?.hide()
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

      <AlertWithTextInputs ref={alert} />
    </View>
  )
}
