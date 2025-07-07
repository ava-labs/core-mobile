import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  ActivityIndicator,
  alpha,
  AnimatedBalance,
  Icons,
  Pressable,
  SCREEN_WIDTH,
  SearchBar,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import NavigationBarButton from 'common/components/NavigationBarButton'
import { ScrollScreen } from 'common/components/ScrollScreen'
import WalletCard from 'common/components/WalletCard'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { WalletDisplayData } from 'common/types'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { useRouter } from 'expo-router'
import { useBalanceForAccount } from 'new/common/contexts/useBalanceForAccount'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Account, selectAccounts, setActiveAccount } from 'store/account'
import { selectActiveAccount } from 'store/account'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { selectActiveWalletId, selectWallets } from 'store/wallet/slice'
import { WalletType } from 'services/wallet/types'
import { CoreAccountType } from '@avalabs/types'

const IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID = 'imported-accounts-wallet-id'
const IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME = 'Imported'

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
  const activeAccount = useSelector(selectActiveAccount)

  const [expandedWallets, setExpandedWallets] = useState<
    Record<string, boolean>
  >({})

  useMemo(() => {
    const initialExpansionState: Record<string, boolean> = {}
    const walletIds = [
      ...Object.keys(allWallets),
      IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID
    ]
    if (walletIds.length > 0) {
      // Expand only the active wallet by default
      walletIds.forEach(id => {
        initialExpansionState[id] =
          id === activeWalletId ||
          (id === IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID &&
            activeAccount?.type === CoreAccountType.IMPORTED)
      })
    }
    setExpandedWallets(initialExpansionState)
  }, [allWallets, activeWalletId, activeAccount?.type])

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
    return allAccountsArray.filter(account => {
      const wallet = allWallets[account.walletId]
      if (!wallet) {
        return false
      }
      const walletName = wallet.name.toLowerCase()

      const isPrivateKeyAccount = wallet.type === WalletType.PRIVATE_KEY
      const virtualWalletMatches =
        isPrivateKeyAccount &&
        IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME.toLowerCase().includes(
          searchText.toLowerCase()
        )
      const walletNameMatches =
        !isPrivateKeyAccount && walletName.includes(searchText.toLowerCase())

      return (
        virtualWalletMatches ||
        walletNameMatches ||
        account.name.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressC?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressBTC?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressAVM?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressPVM?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressSVM?.toLowerCase().includes(searchText.toLowerCase()) ||
        account.addressCoreEth?.toLowerCase().includes(searchText.toLowerCase())
      )
    })
  }, [allAccountsArray, allWallets, searchText])

  const handleSetActiveAccount = useCallback(
    (accountId: string) => {
      dispatch(setActiveAccount(accountId))
    },
    [dispatch]
  )

  const importedWallets = useMemo(() => {
    return Object.values(allWallets).filter(
      wallet => wallet.type === WalletType.PRIVATE_KEY
    )
  }, [allWallets])

  const otherWallets = useMemo(() => {
    return Object.values(allWallets).filter(
      wallet => wallet.type !== WalletType.PRIVATE_KEY
    )
  }, [allWallets])

  const otherWalletsDisplayData = useMemo(() => {
    return otherWallets.map(wallet => {
      const accountsForWallet = accountSearchResults.filter(
        account => account.walletId === wallet.id
      )

      if (accountsForWallet.length === 0) {
        return null
      }

      const accountDataForWallet = accountsForWallet.map((account, index) => {
        const isActive = account.id === activeAccount?.id
        const nextAccount = accountsForWallet[index + 1]
        const hideSeparator = isActive || nextAccount?.id === activeAccount?.id

        return {
          hideSeparator,
          containerSx: {
            backgroundColor: isActive
              ? alpha(colors.$textPrimary, 0.1)
              : 'transparent',
            borderRadius: 8
          },
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
          leftIcon: isActive ? (
            <Icons.Custom.CheckSmall
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          ) : (
            <View sx={{ width: 24 }} />
          ),
          value: <AccountBalance accountId={account.id} isActive={isActive} />,
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
        }
      })

      return {
        ...wallet,
        accounts: accountDataForWallet
      }
    })
  }, [
    otherWallets,
    accountSearchResults,
    activeAccount?.id,
    colors.$textPrimary,
    colors.$textSecondary,
    handleSetActiveAccount,
    gotoAccountDetails
  ])

  const importedWalletsDisplayData = useMemo(() => {
    // Get all accounts from private key wallets
    const allPrivateKeyAccounts = importedWallets.flatMap(wallet => {
      return accountSearchResults.filter(
        account => account.walletId === wallet.id
      )
    })

    if (allPrivateKeyAccounts.length === 0) {
      return null
    }

    // Create virtual "Private Key Accounts" wallet if there are any imported wallets
    // Only add the virtual wallet if there are matching accounts (respects search)
    const privateKeyAccountData = allPrivateKeyAccounts.map(
      (account, index) => {
        const isActive = account.id === activeAccount?.id
        const nextAccount = allPrivateKeyAccounts[index + 1]
        const hideSeparator = isActive || nextAccount?.id === activeAccount?.id

        return {
          hideSeparator,
          containerSx: {
            backgroundColor: isActive
              ? alpha(colors.$textPrimary, 0.1)
              : 'transparent',
            borderRadius: 8
          },
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
          leftIcon: isActive ? (
            <Icons.Custom.CheckSmall
              color={colors.$textPrimary}
              width={24}
              height={24}
            />
          ) : (
            <View sx={{ width: 24 }} />
          ),
          value: <AccountBalance accountId={account.id} isActive={isActive} />,
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
        }
      }
    )

    // Create virtual wallet for private key accounts
    return {
      id: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID, // Virtual ID
      name: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME,
      type: WalletType.PRIVATE_KEY,
      accounts: privateKeyAccountData
    }
  }, [
    importedWallets,
    accountSearchResults,
    activeAccount?.id,
    colors.$textPrimary,
    colors.$textSecondary,
    handleSetActiveAccount,
    gotoAccountDetails
  ])

  const walletsDisplayData: (WalletDisplayData | null)[] = useMemo(() => {
    return [...otherWalletsDisplayData, importedWalletsDisplayData].filter(
      Boolean
    ) as WalletDisplayData[]
  }, [otherWalletsDisplayData, importedWalletsDisplayData])

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

  const renderHeader = useCallback(() => {
    return <SearchBar onTextChanged={setSearchText} searchText={searchText} />
  }, [searchText])

  useEffect(() => {
    // When searching, expand all wallets
    if (searchText.length > 0) {
      setExpandedWallets(prev => {
        const newState = { ...prev }
        Object.keys(newState).forEach(key => {
          newState[key] = true
        })
        return newState
      })
    }
  }, [searchText])

  return (
    <ScrollScreen
      title="Manage accounts"
      isModal
      shouldAvoidKeyboard
      renderHeader={renderHeader}
      renderHeaderRight={renderHeaderRight}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
        flex: walletsDisplayData.length ? undefined : 1
      }}>
      {walletsDisplayData.length ? (
        walletsDisplayData.map(wallet => {
          if (!wallet) {
            return null
          }
          const isExpanded = expandedWallets[wallet.id] ?? false

          if (searchText && wallet.accounts.length === 0) {
            return null
          }

          return (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              isExpanded={isExpanded}
              searchText={searchText}
              onToggleExpansion={() => toggleWalletExpansion(wallet.id)}
              showMoreButton={wallet.id !== IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID}
            />
          )
        })
      ) : (
        <ErrorState
          sx={{ flex: 1 }}
          title="No accounts found"
          description="Try a different search term"
        />
      )}
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
