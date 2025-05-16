import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  GroupList,
  Icons,
  Pressable,
  SCREEN_WIDTH,
  SearchBar,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { showSnackbar } from 'common/utils/toast'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useRouter } from 'expo-router'
import { useBalanceForAccount } from 'new/common/contexts/useBalanceForAccount'
import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccounts, setActiveAccountId } from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

const ITEM_HEIGHT = 50

const ManageAccountsScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const [searchText, setSearchText] = useState('')
  const accountCollection = useSelector(selectAccounts)

  const accounts = useMemo(
    () => Object.values(accountCollection),
    [accountCollection]
  )

  const gotoAccountDetails = useCallback(
    (accountUuid: string): void => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/accountSettings/account',
        params: { accountUuid }
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
          numberOfLines={2}
          sx={{
            color: colors.$textPrimary,
            fontSize: 14,
            lineHeight: 16,
            fontWeight: '500',
            width: SCREEN_WIDTH * 0.3
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
          {truncateAddress(account.addressC, TRUNCATE_ADDRESS_LENGTH)}
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
        <AccountBalance accountUuid={account.id} isActive={account.active} />
      ),
      onPress: () => dispatch(setActiveAccountId(account.id)),
      accessory: (
        <TouchableOpacity
          hitSlop={16}
          sx={{ marginLeft: 4 }}
          onPress={() => gotoAccountDetails(account.id)}>
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
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/addOrConnectWallet'
    })
  }, [navigate])

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
    <ScrollScreen
      title="Manage accounts"
      isModal
      renderHeader={renderHeader}
      renderHeaderRight={renderHeaderRight}
      contentContainerStyle={{ padding: 16 }}>
      <GroupList itemHeight={ITEM_HEIGHT} data={data} />
    </ScrollScreen>
  )
}

export default ManageAccountsScreen

const AccountBalance = ({
  isActive,
  accountUuid
}: {
  isActive: boolean
  accountUuid: string
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
  } = useBalanceForAccount(accountUuid)
  const { formatCurrency } = useFormatCurrency()

  const balance = useMemo(() => {
    return accountBalance === 0
      ? formatCurrency({ amount: 0 }).replace(/[\d.,]+/g, UNKNOWN_AMOUNT)
      : formatCurrency({ amount: accountBalance })
  }, [accountBalance, formatCurrency])

  const renderMaskView = useCallback(() => {
    return (
      <HiddenBalanceText
        variant={'heading6'}
        sx={{
          color: isActive
            ? colors.$textPrimary
            : alpha(colors.$textPrimary, 0.6),
          lineHeight: 18
        }}
      />
    )
  }, [colors.$textPrimary, isActive])

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
        lineHeight: 18,
        width: SCREEN_WIDTH * 0.3,
        textAlign: 'right'
      }}
      renderMaskView={renderMaskView}
      shouldAnimate={false}
    />
  )
}
