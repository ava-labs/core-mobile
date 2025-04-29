import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  GroupList,
  Icons,
  Pressable,
  SearchBar,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { showSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import { useBalanceForAccount } from 'new/common/contexts/useBalanceForAccount'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ScrollView as RnScrollView } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletService from 'services/wallet/WalletService'
import {
  addAccount,
  selectAccounts,
  setActiveAccountIndex
} from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'

const ITEM_HEIGHT = 50

const ManageAccountsScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const [searchText, setSearchText] = useState('')
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const accountCollection = useSelector(selectAccounts)
  const scrollViewRef = useRef<RnScrollView>(null)

  const accounts = useMemo(
    () => Object.values(accountCollection),
    [accountCollection]
  )

  const gotoAccountDetails = useCallback(
    (accountIndex: number): void => {
      navigate({
        pathname: '/accountSettings/account',
        params: { accountIndex: accountIndex.toString() }
      })
    },
    [navigate]
  )

  const accountSearchResults = useMemo(() => {
    return accounts.filter(account => {
      return account.name.toLowerCase().includes(searchText.toLowerCase())
    })
  }, [accounts, searchText])

  const data = useMemo(() => {
    return accountSearchResults.map(account => ({
      title: (
        <Text
          variant="body1"
          sx={{
            color: colors.$textPrimary,
            fontSize: 14,
            lineHeight: 16,
            fontWeight: '500'
          }}>
          {account.name}
        </Text>
      ),
      subtitle: (
        <Text
          variant="mono"
          sx={{
            color: alpha(colors.$textPrimary, 0.6),
            fontSize: 13,
            lineHeight: 16,
            fontWeight: '500'
          }}>
          {truncateAddress(account.addressC)}
        </Text>
      ),
      leftIcon: account.active ? (
        <Icons.Custom.CheckSmall
          color={colors.$textPrimary}
          width={24}
          height={24}
        />
      ) : (
        <View sx={{ width: 24 }} />
      ),
      value: (
        <AccountBalance
          accountIndex={account.index}
          isActive={account.active}
        />
      ),
      onPress: () => dispatch(setActiveAccountIndex(account.index)),
      accessory: (
        <TouchableOpacity
          hitSlop={16}
          sx={{ marginLeft: 4 }}
          onPress={() => gotoAccountDetails(account.index)}>
          <Icons.Alert.AlertCircle
            color={colors.$textSecondary}
            width={18}
            height={18}
          />
        </TouchableOpacity>
      )
    }))
  }, [
    accountSearchResults,
    colors.$textPrimary,
    colors.$textSecondary,
    dispatch,
    gotoAccountDetails
  ])

  const handleAddAccount = useCallback(async (): Promise<void> => {
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
    } catch (error) {
      Logger.error('Unable to add account', error)
      showSnackbar('Unable to add account')
    } finally {
      setIsAddingAccount(false)
      scrollViewRef.current?.scrollTo({
        y: data.length * ITEM_HEIGHT,
        animated: true
      })
    }
  }, [accounts, data.length, dispatch, isAddingAccount])

  const renderHeaderRight = useCallback(() => {
    return (
      <NavigationBarButton
        isModal
        testID="add_account_btn"
        onPress={handleAddAccount}>
        <Icons.Content.Add color={colors.$textPrimary} />
      </NavigationBarButton>
    )
  }, [colors.$textPrimary, handleAddAccount])

  const renderHeader = useCallback(() => {
    return (
      <SearchBar
        onTextChanged={setSearchText}
        searchText={searchText}
        useDebounce={true}
      />
    )
  }, [searchText])

  return (
    <ScrollViewScreenTemplate
      title="Manage accounts"
      isModal
      renderHeader={renderHeader}
      renderHeaderRight={renderHeaderRight}
      contentContainerStyle={{ padding: 16 }}>
      <GroupList itemHeight={ITEM_HEIGHT} data={data} />
      <ActivityIndicator animating={isAddingAccount} sx={{ marginTop: 16 }} />
    </ScrollViewScreenTemplate>
  )
}

export default ManageAccountsScreen

const AccountBalance = ({
  isActive,
  accountIndex
}: {
  isActive: boolean
  accountIndex: number
}): React.JSX.Element => {
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const {
    theme: { colors }
  } = useTheme()
  const {
    balance: accountBalance,
    fetchBalance,
    isFetchingBalance,
    isBalanceLoaded
  } = useBalanceForAccount(accountIndex)
  const { formatCurrency } = useFormatCurrency()

  const balance = useMemo(() => {
    return formatCurrency({ amount: accountBalance })
  }, [accountBalance, formatCurrency])

  if (isFetchingBalance) {
    return <ActivityIndicator size="small" sx={{ marginRight: 4 }} />
  }

  if (!isBalanceLoaded) {
    return (
      <Pressable onPress={fetchBalance}>
        <Icons.Custom.BalanceRefresh color={colors.$textPrimary} />
      </Pressable>
    )
  }

  return (
    <AnimatedBalance
      variant="body1"
      balance={balance}
      shouldMask={isPrivacyModeEnabled}
      balanceSx={{
        color: isActive ? colors.$textPrimary : alpha(colors.$textPrimary, 0.6),
        lineHeight: 18
      }}
      shouldAnimate={false}
    />
  )
}
