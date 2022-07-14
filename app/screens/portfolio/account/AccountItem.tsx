import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import InputText from 'components/InputText'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { Account, setAccountTitle as setAccountTitleStore } from 'store/account'
import { useDispatch, useSelector } from 'react-redux'
import { selectBalanceTotalInCurrencyForAccount } from 'store/balance'

type Props = {
  account: Account
  onSelectAccount: (accountIndex: number) => void
  editable?: boolean
  selected?: boolean
  blurred?: boolean
}

function AccountItem({
  account,
  onSelectAccount,
  editable,
  selected,
  blurred
}: Props): JSX.Element {
  const context = useApplicationContext()
  const accountBalance = useSelector(
    selectBalanceTotalInCurrencyForAccount(account.index)
  )
  const [editAccount, setEditAccount] = useState(false)
  const [editedAccountTitle, setEditedAccountTitle] = useState(account.title)
  const dispatch = useDispatch()

  const bgColor = useMemo(() => {
    if (selected) {
      return context.isDarkMode
        ? context.theme.colorBg3
        : context.theme.colorBg2
    } else {
      return context.isDarkMode
        ? context.theme.colorBg2
        : context.theme.colorBg2
    }
  }, [
    context.isDarkMode,
    context.theme.colorBg2,
    context.theme.colorBg3,
    selected
  ])

  const saveAccountTitle = useCallback(
    (newAccountName: string) => {
      setEditAccount(false)
      dispatch(
        setAccountTitleStore({
          title: newAccountName,
          accountIndex: account.index
        })
      )
    },
    [account.index, dispatch]
  )

  return (
    <>
      <AvaButton.Base
        onPress={() => onSelectAccount(account.index)}
        style={[
          {
            backgroundColor: bgColor,
            padding: 16
          }
        ]}>
        <Row>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            {editAccount ? (
              <EditTitle
                title={editedAccountTitle}
                onChangeText={setEditedAccountTitle}
                onSubmit={() => saveAccountTitle(editedAccountTitle)}
              />
            ) : (
              <Title title={account.title} />
            )}
            <Space y={6} />
            <AvaText.Body3 currency>{accountBalance}</AvaText.Body3>
            {editable && (
              // For smaller touch area
              <Row>
                {editAccount ? (
                  <Save
                    disabled={!editedAccountTitle}
                    onPress={() => saveAccountTitle(editedAccountTitle)}
                  />
                ) : (
                  <Edit onPress={() => setEditAccount(!editAccount)} />
                )}
              </Row>
            )}
          </View>
          <View>
            <TokenAddress address={account.address} showIcon />
            <Space y={6} />
            <TokenAddress address={account.addressBtc} showIcon />
          </View>
        </Row>
      </AvaButton.Base>
      {blurred && (
        <View
          style={{
            position: 'absolute',
            backgroundColor: context.theme.overlay,
            width: '100%',
            height: '100%'
          }}
        />
      )}
    </>
  )
}

const Save = ({
  disabled,
  onPress
}: {
  disabled: boolean
  onPress: () => void
}) => {
  const { theme } = useApplicationContext()
  return (
    <AvaButton.Base
      rippleBorderless
      disabled={disabled}
      onPress={onPress}
      style={{ paddingVertical: 4, paddingEnd: 8 }}>
      <AvaText.ButtonMedium textStyle={{ color: theme.colorPrimary1 }}>
        Save
      </AvaText.ButtonMedium>
    </AvaButton.Base>
  )
}

const Edit = ({ onPress }: { onPress: () => void }) => {
  const { theme } = useApplicationContext()
  return (
    <AvaButton.Base
      rippleBorderless
      onPress={onPress}
      style={{ paddingVertical: 4, paddingEnd: 8 }}>
      <AvaText.ButtonMedium textStyle={{ color: theme.colorPrimary1 }}>
        Edit
      </AvaText.ButtonMedium>
    </AvaButton.Base>
  )
}

const EditTitle = ({
  title,
  onChangeText,
  onSubmit
}: {
  title: string
  onChangeText: (text: string) => void
  onSubmit: () => void
}) => {
  const { theme } = useApplicationContext()
  return (
    <Row>
      <InputText
        style={{
          margin: 0,
          backgroundColor: theme.colorBg1,
          borderRadius: 8,
          flex: 1
        }}
        autoFocus
        text={title}
        onSubmit={onSubmit}
        onChangeText={onChangeText}
      />
      <Space x={16} />
    </Row>
  )
}

const Title = ({ title }: { title: string }) => {
  return <AvaText.Heading2 ellipsizeMode={'tail'}>{title}</AvaText.Heading2>
}
export default AccountItem
