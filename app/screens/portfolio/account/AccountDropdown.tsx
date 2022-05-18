import React, { useCallback, useEffect, useRef } from 'react'
import { Animated, Easing, FlatList, Pressable, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import HeaderAccountSelector from 'components/HeaderAccountSelector'
import { Account } from 'dto/Account'
import AccountItem from 'screens/portfolio/account/AccountItem'
import AvaText from 'components/AvaText'
import Separator from 'components/Separator'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import { ShowSnackBar } from 'components/Snackbar'
import { useSelector } from 'react-redux'
import {
  selectAccounts,
  selectActiveAccount
} from 'store/accounts/accountsStore'
import { activateAccount } from 'services/accounts/AccountsService'
import { store } from 'store'
import { useAccountsContext } from '@avalabs/wallet-react-components'

const Y_START = -400

function AccountDropdown({
  onAddEditAccounts
}: {
  onAddEditAccounts: () => void
}): JSX.Element {
  const { theme } = useApplicationContext()
  const accounts = useSelector(selectAccounts)
  const { goBack } = useNavigation()
  const animTranslateY = useRef(new Animated.Value(Y_START)).current
  const accountsContext = useAccountsContext()

  useEffect(() => {
    const compositeAnimation1 = Animated.timing(animTranslateY, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.elastic(1.2)
    })
    compositeAnimation1.start()
    return () => compositeAnimation1.stop()
  }, [animTranslateY])

  const animatedDismiss = useCallback(() => {
    const compositeAnimation1 = Animated.timing(animTranslateY, {
      toValue: Y_START,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.elastic(1.2)
    })
    compositeAnimation1.start(() => goBack())
  }, [animTranslateY, goBack])

  function onSelectAccount(accountIndex: number) {
    accountsContext.activateAccount(accountIndex)
    activateAccount(accountIndex, store)
    animatedDismiss()
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={goBack}>
      <View
        style={{
          backgroundColor: theme.overlay,
          flex: 1,
          paddingHorizontal: 16
        }}>
        <AvaButton.Base
          style={{ paddingLeft: 12 }}
          onPress={() => {
            ShowSnackBar('Copied')
            goBack()
          }}>
          <View
            style={{
              width: 180,
              alignSelf: 'center',
              backgroundColor: theme.colorBg1
            }}>
            <HeaderAccountSelector
              direction={'up'}
              onPressed={() => goBack()}
            />
          </View>
        </AvaButton.Base>

        <Animated.View
          key="some key"
          style={{
            transform: [
              {
                translateY: animTranslateY
              }
            ],
            height: 340,
            overflow: 'hidden',
            backgroundColor: theme.colorBg2,
            borderRadius: 12
          }}>
          <FlatList
            data={[...Object.values(accounts)]}
            renderItem={info => (
              <AccountItemRenderer
                account={info.item}
                onSelectAccount={onSelectAccount}
              />
            )}
          />
          <Separator />
          <AvaButton.Base onPress={onAddEditAccounts}>
            <AvaText.ButtonLarge
              textStyle={{
                marginHorizontal: 16,
                marginVertical: 12,
                color: theme.colorPrimary1
              }}>
              Add/Edit Accounts
            </AvaText.ButtonLarge>
          </AvaButton.Base>
        </Animated.View>
      </View>
    </Pressable>
  )
}

function AccountItemRenderer({
  account,
  onSelectAccount
}: {
  account: Account
  onSelectAccount: (accountIndex: number) => void
}) {
  const activeAccount = useSelector(selectActiveAccount)
  return (
    <AccountItem
      key={account.title}
      account={account}
      selected={account.index === activeAccount?.index}
      onSelectAccount={onSelectAccount}
    />
  )
}

export default AccountDropdown
