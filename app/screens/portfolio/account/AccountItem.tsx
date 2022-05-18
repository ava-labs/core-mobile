import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import { Account } from 'dto/Account'
import AvaButton from 'components/AvaButton'
import InputText from 'components/InputText'
import { Row } from 'components/Row'
import TokenAddress from 'components/TokenAddress'
import { setAccountTitle } from 'services/accounts/AccountsService'
import { store } from 'store'

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
  const [editAccount, setEditAccount] = useState(false)
  const [editedAccountTitle, setEditedAccountTitle] = useState(account.title)
  const [accBalance, setAccBalance] = useState('')

  // useEffect(() => {
  //   const sub = account.balance$.subscribe(value => setAccBalance(value))
  //   return () => sub.unsubscribe()
  // }, [account])

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
      setAccountTitle(newAccountName, account.index, store)
    },
    [account.index, setAccountTitle]
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
                title={account.title}
                onChangeText={setEditedAccountTitle}
                onSubmit={() => saveAccountTitle(editedAccountTitle)}
              />
            ) : (
              <Title title={account.title} />
            )}
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
          <View
            style={{
              width: 116,
              alignItems: 'flex-end'
            }}>
            <TokenAddress address={account.address} />
            <Space y={6} />
            <AvaText.Body3 currency>{accBalance}</AvaText.Body3>
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
    <InputText
      style={{ margin: 0, backgroundColor: theme.colorBg1, borderRadius: 8 }}
      autoFocus
      text={title}
      onSubmit={onSubmit}
      onChangeText={onChangeText}
    />
  )
}

const Title = ({ title }: { title: string }) => {
  return <AvaText.Heading2 ellipsizeMode={'tail'}>{title}</AvaText.Heading2>
}
export default AccountItem
