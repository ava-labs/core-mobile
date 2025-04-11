import { AnimatedPressable, useTheme, View, Text } from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Account,
  selectAccounts,
  selectActiveAccount,
  setActiveAccountIndex
} from 'store/account'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { getItemEnteringAnimation } from 'common/utils/animations'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { FlatList } from 'react-native-gesture-handler'
import { AccountItem } from './AccountItem'

export const ACCOUNT_CARD_SIZE = 140

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

export const AccountList = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const activeAccount = useSelector(selectActiveAccount)
  const accountCollection = useSelector(selectAccounts)
  const flatListRef = useRef<FlatList>(null)

  const accounts = useMemo(
    () => Object.values(accountCollection),
    [accountCollection]
  )

  const accountsToDisplay = useMemo(() => {
    return accounts.slice(0, 5)
  }, [accounts])

  const onSelectAccount = useCallback(
    (accountIndex: number): void => {
      AnalyticsService.capture('AccountSelectorAccountSwitched', {
        accountIndex
      })
      dispatch(setActiveAccountIndex(accountIndex))
    },
    [dispatch]
  )

  const gotoAccountDetails = useCallback(
    (accountIndex: number): void => {
      navigate({
        pathname: './accountSettings/account',
        params: { accountIndex: accountIndex.toString() }
      })
    },
    [navigate]
  )

  const goToManageAccounts = useCallback(() => {
    navigate('./accountSettings/manageAccounts')
  }, [navigate])

  const renderSeparator = useCallback(() => <View sx={{ width: 16 }} />, [])

  const contentContainerJustifyContent = useMemo(() => {
    return accountsToDisplay.length < 2 ? 'center' : undefined
  }, [accountsToDisplay.length])

  const renderItem = useCallback(
    ({ item, index }: { item: Account; index: number }) => (
      <AccountItem
        index={index}
        isActive={index === activeAccount?.index}
        account={item as Account}
        onSelectAccount={onSelectAccount}
        gotoAccountDetails={gotoAccountDetails}
        testID={`account #${index + 1}`}
      />
    ),
    [activeAccount?.index, gotoAccountDetails, onSelectAccount]
  )

  const onContentSizeChange = useCallback(() => {
    flatListRef.current?.scrollToOffset({
      offset:
        (ACCOUNT_CARD_SIZE + 16) *
        (activeAccount?.index ?? accountsToDisplay.length)
    })
  }, [activeAccount?.index, accountsToDisplay.length])

  return (
    <View sx={{ flexDirection: 'row', height: ACCOUNT_CARD_SIZE }}>
      <AnimatedFlatList
        testID="account_list"
        removeClippedSubviews={true}
        onContentSizeChange={onContentSizeChange}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: contentContainerJustifyContent
        }}
        ref={flatListRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={{ overflow: 'visible', flexGrow: 1 }}
        horizontal
        data={accountsToDisplay}
        renderItem={item =>
          renderItem({
            item: item.item as Account,
            index: item.index
          })
        }
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
              onPress={goToManageAccounts}
              style={{
                marginLeft: 16,
                backgroundColor: colors.$surfaceSecondary,
                width: ACCOUNT_CARD_SIZE,
                height: ACCOUNT_CARD_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 18
              }}>
              <Text
                testID="manage_accounts"
                variant="body2"
                sx={{
                  paddingHorizontal: 30
                }}>
                {accounts.length > 1
                  ? `Manage all ${accounts.length} accounts`
                  : 'Manage account'}
              </Text>
            </AnimatedPressable>
          </Animated.View>
        }
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  )
}
