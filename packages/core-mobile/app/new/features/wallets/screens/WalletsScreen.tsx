import { Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { CoreAccountType } from '@avalabs/types'
import { ContentReveal } from 'common/components/ContentReveal'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreenRef, ListScreenV2 } from 'common/components/ListScreenV2'
import NavigationBarButton from 'common/components/NavigationBarButton'
import WalletCard from 'common/components/WalletCard'
import { useEffectiveHeaderHeight } from 'common/hooks/useEffectiveHeaderHeight'
import { WalletDisplayData } from 'common/types'
import { useRouter } from 'expo-router'
import { useAllBalances } from 'features/portfolio/hooks/useAllBalances'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { RefreshControl } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const headerHeight = useEffectiveHeaderHeight()
  const dispatch = useDispatch()
  const { navigate, dismiss } = useRouter()
  const accountCollection = useSelector(selectAccounts)
  const allWallets = useSelector(selectWallets)
  const activeAccount = useSelector(selectActiveAccount)
  const activeAccountId = activeAccount?.id
  const activeAccountWalletId = activeAccount?.walletId
  const activeAccountType = activeAccount?.type
  const { data: allBalancesData, isLoading, refetch } = useAllBalances()
  const isBalanceAccurate = useMemo(() => {
    if (!allBalancesData) return false
    const allEntries = Object.values(allBalancesData).flat()
    return allEntries.every(balance => balance.dataAccurate)
  }, [allBalancesData])
  const listRef = useRef<ListScreenRef<WalletDisplayData>>(null)

  const [isRefreshing, setIsRefreshing] = useState(false)

  const [expandedWallets, setExpandedWallets] = useState<
    Record<string, boolean>
  >({})

  const expandedWalletsRef = useRef(expandedWallets)
  expandedWalletsRef.current = expandedWallets

  const errorMessage = useMemo(() => {
    if (!isLoading && !isBalanceAccurate) return 'Unable to load all balances'
    return null
  }, [isLoading, isBalanceAccurate])

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
        if (Object.hasOwn(prev, id)) {
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
          hideSeparator
        }
      })

      return {
        ...wallet,
        accounts: accountDataForWallet
      } as WalletDisplayData
    })
  }, [primaryWallets, allAccountsArray, activeAccountId])

  const importedWalletsDisplayData = useMemo(() => {
    const allPrivateKeyAccounts = importedWallets.flatMap(wallet =>
      allAccountsArray.filter(account => account.walletId === wallet.id)
    )

    if (allPrivateKeyAccounts.length === 0) {
      return null
    }

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
          hideSeparator
        }
      }
    )

    return {
      id: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID,
      name: IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME,
      type: WalletType.PRIVATE_KEY,
      accounts: privateKeyAccountData
    } as WalletDisplayData
  }, [importedWallets, allAccountsArray, activeAccountId])

  const walletsDisplayData = useMemo((): WalletDisplayData[] => {
    const validPrimaryWallets = primaryWalletsDisplayData.filter(
      (wallet): wallet is WalletDisplayData => wallet !== null
    )

    const combinedWallets: WalletDisplayData[] = importedWalletsDisplayData
      ? [...validPrimaryWallets, importedWalletsDisplayData]
      : validPrimaryWallets

    const activeWallet = combinedWallets.find(wallet =>
      isActiveWalletId(wallet.id)
    )

    if (activeWallet) {
      const otherWallets = combinedWallets.filter(
        wallet => wallet.id !== activeWallet.id
      )
      return [activeWallet, ...otherWallets]
    }

    return combinedWallets
  }, [primaryWalletsDisplayData, importedWalletsDisplayData, isActiveWalletId])

  const toggleWalletExpansion = useCallback((walletId: string) => {
    setExpandedWallets(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }))
  }, [])

  const handleAddAccount = useCallback((): void => {
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
    return (
      <ContentReveal isVisible={!!errorMessage}>
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
      </ContentReveal>
    )
  }, [colors.$textDanger, errorMessage])

  const cardStyle = useMemo(
    () => ({
      marginHorizontal: 16,
      marginVertical: 5,
      backgroundColor: colors.$surfacePrimary,
      borderColor: colors.$borderPrimary,
      borderWidth: 1
    }),
    [colors.$surfacePrimary, colors.$borderPrimary]
  )

  const renderItem = useCallback(
    ({ item }: { item: WalletDisplayData }) => {
      if (!item) {
        return null
      }
      const isExpanded = expandedWalletsRef.current[item.id] ?? false
      const isActive = isActiveWalletId(item.id)

      return (
        <WalletCard
          wallet={item}
          isActive={isActive}
          isRefreshing={isRefreshing}
          isExpanded={isExpanded}
          onToggleExpansion={toggleWalletExpansion}
          onSetActiveAccount={handleSetActiveAccount}
          onAccountDetails={gotoAccountDetails}
          style={cardStyle}
        />
      )
    },
    [
      isActiveWalletId,
      isRefreshing,
      toggleWalletExpansion,
      handleSetActiveAccount,
      gotoAccountDetails,
      cardStyle
    ]
  )

  const keyExtractor = useCallback((item: WalletDisplayData) => item.id, [])

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

  const insets = useSafeAreaInsets()

  const progressViewOffset = useMemo(() => {
    return headerHeight * 2 + insets.top
  }, [headerHeight, insets.top])

  return (
    <ListScreenV2
      flatListRef={listRef}
      title="My wallets"
      subtitle={`An overview of your wallets\nand associated accounts`}
      data={walletsDisplayData}
      extraData={expandedWallets}
      backgroundColor={isDark ? '#121213' : '#F1F1F4'}
      renderHeader={renderHeader}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          progressViewOffset={progressViewOffset}
        />
      }
      progressViewOffset={progressViewOffset}
      renderHeaderRight={renderHeaderRight}
      renderEmpty={renderEmpty}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      shouldShowStickyHeader={false}
    />
  )
}
