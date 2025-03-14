import { AnimatedPressable, Icons, useTheme, View } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  addAccount,
  Account,
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { getItemEnteringAnimation } from 'common/utils/animations'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletService from 'services/wallet/WalletService'
import Logger from 'utils/Logger'
import { showSnackbar } from 'common/utils/toast'
import { FlatList } from 'react-native'
import { AccountItem } from './AccountItem'

export const ACCOUNT_CARD_SIZE = 140

export const AccountList = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const activeAccount = useSelector(selectActiveAccount)
  const accountCollection = useSelector(selectAccounts)
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const accounts = useMemo(
    () => Object.values(accountCollection),
    [accountCollection]
  )

  const onSelectAccount = useCallback(
    (accountIndex: number): void => {
      dispatch(setActiveAccountIndex(accountIndex))
    },
    [dispatch]
  )

  const addAccountAndSetActive = async (): Promise<void> => {
    if (isAddingAccount) return

    try {
      AnalyticsService.capture('AccountSelectorAddAccount', {
        accountNumber: Object.keys(accounts).length + 1
      })

      setIsAddingAccount(true)
      // @ts-expect-error
      // dispatch here is not typed correctly
      await dispatch(addAccount()).unwrap()

      AnalyticsService.capture('CreatedANewAccountSuccessfully', {
        walletType: WalletService.walletType
      })
      flatListRef.current?.scrollToOffset({
        offset: (ACCOUNT_CARD_SIZE + 16) * accounts.length
      })
    } catch (error) {
      Logger.error('Unable to add account', error)
      showSnackbar('Unable to add account')
    } finally {
      setIsAddingAccount(false)
    }
  }

  const gotoAccountDetails = useCallback(
    (accountIndex: number): void => {
      navigate({
        pathname: './accountDetails',
        params: { accountIndex }
      })
    },
    [navigate]
  )

  const renderSeparator = useCallback(() => <View sx={{ width: 16 }} />, [])

  const contentContainerJustifyContent = useMemo(() => {
    return accounts.length < 3 ? 'center' : undefined
  }, [accounts.length])

  return (
    <View sx={{ flexDirection: 'row', height: ACCOUNT_CARD_SIZE }}>
      <Animated.FlatList
        onContentSizeChange={() => {
          flatListRef.current?.scrollToOffset({
            offset:
              (ACCOUNT_CARD_SIZE + 16) *
              (activeAccount?.index ?? accounts.length)
          })
        }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: contentContainerJustifyContent
        }}
        ref={flatListRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={{ overflow: 'visible', flexGrow: 1 }}
        horizontal
        data={accounts}
        renderItem={item => (
          <AccountItem
            index={item.index}
            isActive={item.index === activeAccount?.index}
            account={item.item as Account}
            onSelectAccount={onSelectAccount}
            gotoAccountDetails={gotoAccountDetails}
          />
        )}
        getItemLayout={(_, index) => ({
          length: ACCOUNT_CARD_SIZE,
          offset: ACCOUNT_CARD_SIZE * index,
          index
        })}
        keyExtractor={item => (item as Account).id}
        ListFooterComponent={
          <Animated.View
            entering={getItemEnteringAnimation(accounts.length)}
            layout={LinearTransition.springify()}>
            <AnimatedPressable
              onPress={addAccountAndSetActive}
              hitSlop={16}
              style={{
                marginLeft: 16,
                backgroundColor: colors.$surfaceSecondary,
                width: ACCOUNT_CARD_SIZE,
                height: ACCOUNT_CARD_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 18
              }}>
              <Icons.Content.Add
                width={25}
                height={25}
                color={colors.$textPrimary}
              />
            </AnimatedPressable>
          </Animated.View>
        }
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  )
}
