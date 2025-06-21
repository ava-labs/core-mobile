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
import { useActiveAccount } from 'common/hooks/useActiveAccount'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useRouter } from 'expo-router'
import { useBalanceForAccount } from 'new/common/contexts/useBalanceForAccount'
import React, { useCallback, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectAccounts, Account, setActiveAccount } from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { selectWallets, selectActiveWalletId } from 'store/wallet/slice'

const ITEM_HEIGHT = 50

const ManageAccountsScreen = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate } = useRouter()
  const [searchText, setSearchText] = useState('')
  const accountCollection = useSelector(selectAccounts)
  const allWallets = useSelector(selectWallets)
  const activeWalletId = useSelector(selectActiveWalletId)
  const activeAccount = useActiveAccount()

  const [expandedWallets, setExpandedWallets] = useState<
    Record<string, boolean>
  >({})

  useMemo(() => {
    const initialExpansionState: Record<string, boolean> = {}
    const walletIds = Object.keys(allWallets)
    if (walletIds.length > 0) {
      // Expand only the active wallet by default
      walletIds.forEach(id => {
        initialExpansionState[id] = id === activeWalletId
      })
    }
    setExpandedWallets(initialExpansionState)
  }, [allWallets, activeWalletId])

  const allAccountsArray: Account[] = useMemo(
    () => Object.values(accountCollection),
    [accountCollection]
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

  const accountSearchResults = useMemo(() => {
    if (!searchText) {
      return allAccountsArray
    }
    return allAccountsArray.filter(account =>
      account.name.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [allAccountsArray, searchText])

  const handleSetActiveAccount = useCallback(
    (accountId: string) => {
      dispatch(setActiveAccount(accountId))
    },
    [dispatch]
  )

  const walletsDisplayData = useMemo(() => {
    const walletArray = Object.values(allWallets)
    return walletArray
      .map(wallet => {
        const accountsForWallet = accountSearchResults.filter(
          account => account.walletId === wallet.id
        )

        if (accountsForWallet.length === 0 && searchText) {
          return null
        }

        const accountDataForWallet = accountsForWallet.map(account => ({
          title: (
            <Text
              testID={`manage_accounts_list__${account.name}`}
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
          leftIcon:
            account.id === activeAccount.id ? (
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
              accountId={account.id}
              isActive={account.id === activeAccount.id}
            />
          ),
          onPress: () => handleSetActiveAccount(account.id),
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
        return {
          ...wallet,
          accounts: accountDataForWallet
        }
      })
      .filter(Boolean) // Remove nulls (wallets with no matching search results)
  }, [
    allWallets,
    accountSearchResults,
    searchText,
    colors,
    handleSetActiveAccount,
    gotoAccountDetails
  ])

  const toggleWalletExpansion = useCallback((walletId: string) => {
    setExpandedWallets(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }))
  }, [])

  const handleAddAccount = useCallback(async (): Promise<void> => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/accountSettings/importWallet'
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

  const renderExpansionIcon = useCallback(
    (isExpanded: boolean) => {
      if (isExpanded) {
        return (
          <Icons.Navigation.ChevronRight
            color={colors.$textPrimary}
            width={24}
            height={24}
          />
        )
      }
      return (
        <Icons.Navigation.ExpandMore
          color={colors.$textPrimary}
          width={24}
          height={24}
        />
      )
    },
    [colors.$textPrimary]
  )

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
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12
      }}>
      {walletsDisplayData.map(wallet => {
        if (!wallet) {
          return null
        }
        const isExpanded = expandedWallets[wallet.id] ?? false

        if (searchText && wallet.accounts.length === 0) {
          return null
        }

        return (
          <View
            key={wallet.id}
            sx={{
              backgroundColor: colors.$surfaceSecondary,
              borderRadius: 12,
              overflow: 'hidden'
            }}>
            <TouchableOpacity
              onPress={() => toggleWalletExpansion(wallet.id)}
              sx={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
              <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {renderExpansionIcon(isExpanded)}
                <Text
                  variant="heading6"
                  sx={{
                    color: colors.$textPrimary
                  }}>
                  {wallet.name}
                </Text>
              </View>
            </TouchableOpacity>

            {isExpanded && (
              <>
                {wallet.accounts.length > 0 ? (
                  <GroupList itemHeight={ITEM_HEIGHT} data={wallet.accounts} />
                ) : (
                  !searchText && (
                    <View
                      sx={{
                        paddingHorizontal: 16,
                        paddingVertical: 20,
                        alignItems: 'center',
                        backgroundColor: colors.$surfaceSecondary
                      }}>
                      <Text sx={{ color: colors.$textSecondary }}>
                        No accounts in this wallet.
                      </Text>
                    </View>
                  )
                )}
              </>
            )}
          </View>
        )
      })}
    </ScrollScreen>
  )
}

export default ManageAccountsScreen

const AccountBalance = ({
  isActive,
  accountId
}: {
  isActive: boolean
  accountId: string
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
  } = useBalanceForAccount(accountId)
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
