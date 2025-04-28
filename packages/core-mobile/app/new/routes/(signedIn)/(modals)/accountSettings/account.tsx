import {
  BalanceHeader,
  NavigationTitleHeader,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { Space } from 'components/Space'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useLocalSearchParams } from 'expo-router'
import { AccountAddresses } from 'features/accountSettings/components/accountAddresses'
import { AccountButtons } from 'features/accountSettings/components/AccountButtons'
import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectAccountByIndex } from 'store/account'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectSelectedCurrency } from 'store/settings/currency'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'

const AccountScreen = (): JSX.Element => {
  const { accountIndex } = useLocalSearchParams<{ accountIndex: string }>()
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const { theme } = useTheme()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const accountIndexNumber = isNaN(Number(accountIndex))
    ? 0
    : Number(accountIndex)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const account = useSelector(selectAccountByIndex(accountIndexNumber))
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(account?.index ?? 0, tokenVisibility)
  )
  const isLoading = isBalanceLoading || isRefetchingBalance
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(account?.index ?? 0)
  )
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { formatCurrency } = useFormatCurrency()
  const currencyBalance = useMemo(() => {
    return !balanceAccurate || balanceTotalInCurrency === 0
      ? '$' + UNKNOWN_AMOUNT
      : formatCurrency({ amount: balanceTotalInCurrency })
  }, [balanceAccurate, balanceTotalInCurrency, formatCurrency])

  const formattedBalance = useMemo(
    () => currencyBalance.replace(selectedCurrency, ''),
    [currencyBalance, selectedCurrency]
  )

  const handleBalanceHeaderLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      setBalanceHeaderLayout(event.nativeEvent.layout)
    },
    []
  )

  const header = useMemo(
    () => <NavigationTitleHeader title={account?.name ?? ''} />,
    [account?.name]
  )

  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header,
    targetLayout: balanceHeaderLayout,
    shouldHeaderHaveGrabber: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: theme.colors.$surfacePrimary
        }}>
        <View onLayout={handleBalanceHeaderLayout}>
          <Animated.View
            style={[
              {
                backgroundColor: theme.colors.$surfacePrimary
              },
              animatedHeaderStyle
            ]}>
            <BalanceHeader
              accountName={account?.name ?? ''}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              errorMessage={
                balanceAccurate ? undefined : 'Unable to load all balances'
              }
              isLoading={isLoading}
              isPrivacyModeEnabled={isPrivacyModeEnabled}
              isDeveloperModeEnabled={isDeveloperMode}
            />
          </Animated.View>
        </View>
      </View>
    )
  }, [
    theme.colors.$surfacePrimary,
    handleBalanceHeaderLayout,
    animatedHeaderStyle,
    account?.name,
    formattedBalance,
    selectedCurrency,
    balanceAccurate,
    isLoading,
    isPrivacyModeEnabled,
    isDeveloperMode
  ])

  if (account === undefined) {
    return <></>
  }

  return (
    <View sx={{ flex: 1, marginBottom: 60, paddingHorizontal: 16 }}>
      <ScrollView
        onScroll={onScroll}
        contentContainerStyle={{ paddingBottom: 60 }}>
        {renderHeader()}
        <Space y={32} />
        <View sx={{ gap: 12 }}>
          <AccountAddresses account={account} />
          {/* <WalletInfo showPrivateKey={handleShowPrivateKey} /> */}
        </View>
        <Space y={32} />
      </ScrollView>
      <AccountButtons accountIndex={account.index} />
    </View>
  )
}

export default AccountScreen
