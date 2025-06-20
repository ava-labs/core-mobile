import { AnimatedPressable, Text, useTheme, View } from '@avalabs/k2-alpine'
import { getItemEnteringAnimation } from 'common/utils/animations'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { FlatList } from 'react-native-gesture-handler'
import Animated, { LinearTransition } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  Account,
  selectAccounts,
  selectActiveAccount,
  setActiveAccount
} from 'store/account'
import { useRecentAccounts } from '../store'
import { AccountItem } from './AccountItem'

const CARD_PADDING = 12

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

  const { recentAccountIds, addRecentAccount } = useRecentAccounts()

  useEffect(() => {
    if (recentAccountIds.length === 0 && activeAccount) {
      addRecentAccount(activeAccount.index.toString())
    }
  }, [activeAccount, addRecentAccount, recentAccountIds])

  const recentAccounts = useMemo(() => {
    return recentAccountIds
      .map(id => accountCollection[id])
      .filter((account): account is Account => account !== undefined)
  }, [accountCollection, recentAccountIds])

  useEffect(() => {
    if (activeAccount?.index != null) {
      flatListRef.current?.scrollToOffset({
        offset: 0
      })
    }
  }, [activeAccount?.index])

  const onSelectAccount = useCallback(
    (account: Account): void => {
      AnalyticsService.capture('AccountSelectorAccountSwitched', {
        accountIndex: account.index
      })
      dispatch(setActiveAccount(account.id))
    },
    [dispatch]
  )

  const gotoAccountDetails = useCallback(
    (accountId: string): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/account',
        params: { accountId }
      })
    },
    [navigate]
  )

  const goToManageAccounts = useCallback(() => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/manageAccounts')
  }, [navigate])

  const renderSeparator = useCallback(
    () => <View sx={{ width: CARD_PADDING }} />,
    []
  )

  const contentContainerJustifyContent = useMemo(() => {
    return recentAccounts.length < 2 ? 'center' : undefined
  }, [recentAccounts.length])

  const renderItem = useCallback(
    ({ item, index }: { item: Account; index: number }) => (
      <AccountItem
        index={index}
        isActive={item.id === activeAccount?.id}
        account={item as Account}
        onSelectAccount={onSelectAccount}
        gotoAccountDetails={gotoAccountDetails}
      />
    ),
    [activeAccount?.id, gotoAccountDetails, onSelectAccount]
  )

  return (
    <View sx={{ flexDirection: 'row', height: ACCOUNT_CARD_SIZE }}>
      <AnimatedFlatList
        testID="account_carousel_list"
        removeClippedSubviews={true}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: contentContainerJustifyContent,
          paddingHorizontal: 16
        }}
        ref={flatListRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={{ overflow: 'visible', flexGrow: 1 }}
        horizontal
        data={recentAccounts}
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
        keyExtractor={item => (item as Account)?.index?.toString() ?? ''}
        ListFooterComponent={
          <Animated.View
            entering={getItemEnteringAnimation(recentAccounts.length)}
            layout={LinearTransition.springify()}>
            <AnimatedPressable
              onPress={goToManageAccounts}
              style={{
                marginLeft: CARD_PADDING,
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
                  fontWeight: '500',
                  paddingHorizontal: 25,
                  textAlign: 'center'
                }}>
                {'Manage all or add a wallet'}
              </Text>
            </AnimatedPressable>
          </Animated.View>
        }
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  )
}
