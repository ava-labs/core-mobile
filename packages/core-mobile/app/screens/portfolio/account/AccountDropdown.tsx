import React, { useCallback, useEffect, useRef } from 'react'
import { Animated, Easing, FlatList, Pressable, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Account } from 'store/account'
import AccountItem from 'screens/portfolio/account/AccountItem'
import AvaText from 'components/AvaText'
import Separator from 'components/Separator'
import AvaButton from 'components/AvaButton'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import AnalyticsService from 'services/analytics/AnalyticsService'

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
  const dispatch = useDispatch()

  useEffect(() => {
    AnalyticsService.capture('AccountSelectorOpened')
  }, [])

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

  function onSelectAccount(accountIndex: number): void {
    AnalyticsService.capture('AccountSelectorAccountSwitched', { accountIndex })
    dispatch(setActiveAccountIndex(accountIndex))
    animatedDismiss()
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={goBack}>
      <View
        testID="accounts_dropdown"
        style={{
          backgroundColor: theme.overlay,
          flex: 1,
          paddingHorizontal: 16
        }}>
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
}): JSX.Element {
  const activeAccount = useSelector(selectActiveAccount)
  return (
    <AccountItem
      key={account.name}
      account={account}
      selected={account.index === activeAccount?.index}
      onSelectAccount={onSelectAccount}
    />
  )
}

export default AccountDropdown
