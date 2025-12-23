import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { CoreAccountType } from '@avalabs/types'
import { useHeaderHeight } from '@react-navigation/elements'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen, ListScreenRef } from 'common/components/ListScreen'
import NavigationBarButton from 'common/components/NavigationBarButton'
import WalletCard from 'common/components/WalletCard'
import { WalletDisplayData } from 'common/types'
import { useRouter } from 'expo-router'
import { useIsAllBalancesAccurate } from 'features/portfolio/hooks/useIsAllBalancesAccurate'
import { useAllBalances } from 'features/portfolio/hooks/useAllBalances'
import React, { RefObject, useCallback, useMemo, useRef, useState } from 'react'
import { RefreshControl } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import {
  selectAccounts,
  selectActiveAccount,
  setActiveAccount
} from 'store/account'
import { selectWallets } from 'store/wallet/slice'
import {
  IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID,
  IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME
} from '../consts'

export const WalletsScreen = (): JSX.Element => {
  const {
    theme: { colors, isDark }
  } = useTheme()
  const headerHeight = useHeaderHeight()
  const dispatch = useDispatch()
  const { navigate, dismiss } = useRouter()
  const accountCollection = useSelector(selectAccounts)
  const allWallets = useSelector(selectWallets)
  const activeAccount = useSelector(selectActiveAccount)
  const activeAccountId = activeAccount?.id
  const activeAccountWalletId = activeAccount?.walletId
  const activeAccountType = activeAccount?.type
  const { isLoading, refetch } = useAllBalances()
  const isBalanceAccurate = useIsAllBalancesAccurate()
  const listRef = useRef<ListScreenRef<WalletDisplayData>>(null)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const [expandedWallets, setExpandedWallets] = useState<
    Record<string, boolean>
  >({})

  const errorMessage =
    isLoading || isRefreshing || isBalanceAccurate
      ? undefined
      : 'Unable to load all balances'

  const allAccountsArray = useMemo(() => {
    return Object.values(accountCollection)
  }, [accountCollection])

  const isActiveWalletId = useCallback(
    (id: string): boolean => {
      if (!activeAccountWalletId || !activeAccountType) {
        return false
      }
      return (
        id === activeAccountWalletId ||
        (id === IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID &&
          activeAccountType === CoreAccountType.IMPORTED)
      )
    },
    [activeAccountType, activeAccountWalletId]
  )

  // Keep wallet expansion state stable across account changes.
  // Only initialize missing wallet IDs and (on first mount) expand the active wallet by default.
  React.useEffect(() => {
    const walletIds = [
      ...Object.keys(allWallets),
      IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID
    ]

    setExpandedWallets(prev => {
      const isFirstInit = Object.keys(prev).length === 0
      const next: Record<string, boolean> = {}

      walletIds.forEach(id => {
        if (isFirstInit) {
          next[id] = isActiveWalletId(id)
          return
        }
        if (Object.prototype.hasOwnProperty.call(prev, id)) {
          next[id] = Boolean(prev[id])
          return
        }
        next[id] = isActiveWalletId(id)
      })

      return next
    })
  }, [allWallets, isActiveWalletId])

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

  const handleSetActiveAccount = useCallback(
    (accountId: string) => {
      if (accountId === activeAccount?.id) {
        return
      }
      dispatch(setActiveAccount(accountId))

      dismiss()
    },
    [activeAccount?.id, dispatch, dismiss]
  )

  const importedWallets = useMemo(() => {
    return Object.values(allWallets).filter(
      wallet => wallet.type === WalletType.PRIVATE_KEY
    )
  }, [allWallets])

  const primaryWallets = useMemo(() => {
    return Object.values(allWallets).filter(
      wallet => wallet.type !== WalletType.PRIVATE_KEY
    )
  }, [allWallets])

  const primaryWalletsDisplayData = useMemo(() => {
    return primaryWallets.map(wallet => {
      const accountsForWallet = allAccountsArray.filter(
        account => account.walletId === wallet.id
      )
      if (accountsForWallet.length === 0) {
        return null
      }

      const accountDataForWallet = accountsForWallet.map((account, index) => {
        const isActive = account.id === activeAccountId
        const nextAccount = accountsForWallet[index + 1]
        const hideSeparator =
          isActive ||
          nextAccount?.id === activeAccountId ||
          index === accountsForWallet.length - 1

        return {
          wallet,
          account,
          isActive,
          hideSeparator,
          onPress: () => handleSetActiveAccount(account.id),
          onPressDetails: () => gotoAccountDetails(account.id)
        }
      })

      return {
        ...wallet,
        accounts: accountDataForWallet
      } as WalletDisplayData
    })
  }, [
    primaryWallets,
    allAccountsArray,
    activeAccountId,
    handleSetActiveAccount,
    gotoAccountDetails
  ])

  const importedWalletsDisplayData = useMemo(() => {
    // Get all accounts from private key wallets
    const allPrivateKeyAccounts = importedWallets.flatMap(wallet =>
      allAccountsArray.filter(account => account.walletId === wallet.id)
    )

    if (allPrivateKeyAccounts.length === 0) {
      return null
    }

    // Create virtual "Private Key Accounts" wallet if there are any imported wallets
    // Only add the virtual wallet if there are matching accounts (respects search)
    const privateKeyAccountData = allPrivateKeyAccounts.map(
      (account, index) => {
        const isActive = account.id === activeAccountId
        const nextAccount = allPrivateKeyAccounts[index + 1]
        const hideSeparator =
          isActive ||
          nextAccount?.id === activeAccountId ||
          index === allPrivateKeyAccounts.length - 1

        return {
          wallet: importedWallets.find(w => w.id === account.walletId),
          account,
          isActive,
          hideSeparator,
          onPress: () => handleSetActiveAccount(account.id),
          onPressDetails: () => gotoAccountDetails(account.id)
        }
      }
    )

    // Create virtual wallet for private key accounts
    return {
      id: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID, // Virtual ID
      name: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME,
      type: WalletType.PRIVATE_KEY,
      accounts: privateKeyAccountData
    } as WalletDisplayData
  }, [
    importedWallets,
    allAccountsArray,
    activeAccountId,
    handleSetActiveAccount,
    gotoAccountDetails
  ])

  const walletsDisplayData = useMemo((): WalletDisplayData[] => {
    // Filter out null values from primary wallets
    const validPrimaryWallets = primaryWalletsDisplayData.filter(
      (wallet): wallet is WalletDisplayData => wallet !== null
    )

    // Combine all wallets (primary + imported)
    const combinedWallets: WalletDisplayData[] = importedWalletsDisplayData
      ? [...validPrimaryWallets, importedWalletsDisplayData]
      : validPrimaryWallets

    // Find the active wallet (could be primary or imported)
    const activeWallet = combinedWallets.find(wallet =>
      isActiveWalletId(wallet.id)
    )

    // If active wallet is found, move it to the beginning
    if (activeWallet) {
      const otherWallets = combinedWallets.filter(
        wallet => wallet.id !== activeWallet.id
      )
      return [activeWallet, ...otherWallets]
    }

    // If no active wallet found, return in default order
    return combinedWallets
  }, [primaryWalletsDisplayData, importedWalletsDisplayData, isActiveWalletId])

  const toggleWalletExpansion = useCallback((walletId: string) => {
    setExpandedWallets(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }))
  }, [])

  const handleAddAccount = useCallback((): void => {
    // @ts-ignore TODO: make routes typesafe
    navigate('/accountSettings/importWallet')
  }, [navigate])

  const renderHeaderRight = useCallback(() => {
    return (
      <NavigationBarButton testID="add_wallet_btn" onPress={handleAddAccount}>
        <Icons.Content.Add width={32} height={32} color={colors.$textPrimary} />
      </NavigationBarButton>
    )
  }, [colors.$textPrimary, handleAddAccount])

  const renderHeader = useCallback(() => {
    if (errorMessage) {
      return (
        <View
          sx={{
            gap: 8,
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: 8
          }}>
          <Icons.Alert.ErrorOutline color={colors.$textDanger} />
          <Text
            variant="buttonMedium"
            sx={{ fontFamily: 'Inter-Medium', color: colors.$textDanger }}>
            {errorMessage}
          </Text>
        </View>
      )
    }
    return null
  }, [colors.$textDanger, errorMessage])

  const renderItem = useCallback(
    ({ item }: { item: WalletDisplayData }) => {
      if (!item) {
        return null
      }
      const isExpanded = expandedWallets[item.id] ?? false
      const isActive = isActiveWalletId(item.id)

      return (
        <WalletCard
          wallet={item}
          isActive={isActive}
          isRefreshing={isRefreshing}
          isExpanded={isExpanded}
          onToggleExpansion={() => toggleWalletExpansion(item.id)}
          style={{
            marginHorizontal: 16,
            marginVertical: 5,
            backgroundColor: colors.$surfacePrimary,
            borderColor: colors.$borderPrimary,
            borderWidth: 1
          }}
        />
      )
    },
    [
      colors.$borderPrimary,
      colors.$surfacePrimary,
      expandedWallets,
      isActiveWalletId,
      isRefreshing,
      toggleWalletExpansion
    ]
  )

  const renderEmpty = useCallback(() => {
    return (
      <ErrorState
        sx={{ flex: 1 }}
        title="No accounts found"
        description="Try a different search term"
      />
    )
  }, [])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    listRef.current?.scrollViewRef?.current?.scrollToOffset({ offset: 0 })
  }, [refetch])

  return (
    <ListScreen
      flatListRef={listRef as RefObject<ListScreenRef<WalletDisplayData>>}
      title="My wallets"
      subtitle={`An overview of your wallets\nand associated accounts`}
      data={walletsDisplayData}
      backgroundColor={isDark ? '#121213' : '#F1F1F4'}
      renderHeader={renderHeader}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          progressViewOffset={headerHeight}
        />
      }
      progressViewOffset={headerHeight}
      renderHeaderRight={renderHeaderRight}
      renderEmpty={renderEmpty}
      renderItem={renderItem}
      shouldShowStickyHeader={false}
    />
  )
}
