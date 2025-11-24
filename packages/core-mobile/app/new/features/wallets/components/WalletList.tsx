import {
  ActivityIndicator,
  Button,
  Icons,
  SearchBar,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen, ListScreenProps } from 'common/components/ListScreen'
import NavigationBarButton from 'common/components/NavigationBarButton'
import WalletCard from 'common/components/WalletCard'
import { useManageWallet } from 'common/hooks/useManageWallet'
import { WalletDisplayData } from 'common/types'
import { useRouter } from 'expo-router'
import { useRecentAccounts } from 'features/accountSettings/store'
import { useIsAccountBalanceAccurate } from 'features/portfolio/hooks/useIsAccountBalanceAccurate'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import {
  Account,
  selectAccounts,
  selectActiveAccount,
  setActiveAccount
} from 'store/account'
import { selectWallets } from 'store/wallet/slice'
import {
  IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID,
  IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME
} from '../consts'
import { getIsActiveWallet } from '../utils'

export const WalletList = ({
  hasSearch,
  backgroundColor,
  walletStyle,
  ...props
}: Omit<
  ListScreenProps<WalletDisplayData>,
  | 'data'
  | 'renderItem'
  | 'keyExtractor'
  | 'renderHeader'
  | 'renderHeaderRight'
  | 'renderEmpty'
> & {
  hasSearch?: boolean
  backgroundColor?: string
  walletStyle?: StyleProp<ViewStyle>
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const dispatch = useDispatch()
  const { navigate, dismiss } = useRouter()
  const { handleAddAccount: handleAddAccountToWallet, isAddingAccount } =
    useManageWallet()

  const [searchText, setSearchText] = useState('')
  const [expandedWallets, setExpandedWallets] = useState<
    Record<string, boolean>
  >({})

  const accountCollection = useSelector(selectAccounts)
  const allWallets = useSelector(selectWallets)
  const activeAccount = useSelector(selectActiveAccount)
  const balanceAccurate = useIsAccountBalanceAccurate(activeAccount)
  // TODO: Implement refresh
  const isRefreshing = false

  const errorMessage = balanceAccurate
    ? undefined
    : 'Unable to load all balances'
  const { recentAccountIds, updateRecentAccount } = useRecentAccounts()

  const allAccountsArray = useMemo(() => {
    return recentAccountIds
      .map(id => accountCollection[id])
      .filter((account): account is Account => account !== undefined)
  }, [accountCollection, recentAccountIds])

  useMemo(() => {
    const initialExpansionState: Record<string, boolean> = {}
    const walletIds = [
      ...Object.keys(allWallets),
      IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID
    ]
    // Expand only the active wallet by default
    walletIds.forEach(id => {
      initialExpansionState[id] = getIsActiveWallet(id, activeAccount)
    })
    setExpandedWallets(initialExpansionState)
  }, [allWallets, activeAccount])

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

    const lowerSearchText = searchText.toLowerCase() // Calculate once

    return allAccountsArray.filter(account => {
      const wallet = allWallets[account.walletId]
      if (!wallet) return false

      const isPrivateKeyAccount = wallet.type === WalletType.PRIVATE_KEY

      // Check virtual wallet first (most specific)
      if (
        isPrivateKeyAccount &&
        IMPORTED_ACCOUNTS_VIRTUAL_WALLET_NAME.toLowerCase().includes(
          lowerSearchText
        )
      ) {
        return true
      }

      // Check wallet name
      if (
        !isPrivateKeyAccount &&
        wallet.name.toLowerCase().includes(lowerSearchText)
      ) {
        return true
      }

      // Check account fields with early returns
      const fieldsToCheck = [
        account.name,
        account.addressC,
        account.addressBTC,
        account.addressAVM,
        account.addressPVM,
        account.addressSVM,
        account.addressCoreEth
      ]

      return fieldsToCheck.some(field =>
        field?.toLowerCase().includes(lowerSearchText)
      )
    })
  }, [allAccountsArray, allWallets, searchText])

  const handleSetActiveAccount = useCallback(
    (accountId: string) => {
      if (accountId === activeAccount?.id) {
        return
      }
      dispatch(setActiveAccount(accountId))
      updateRecentAccount(accountId)

      dismiss()
      dismiss()
    },
    [activeAccount?.id, dispatch, updateRecentAccount, dismiss]
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
      const accountsForWallet = accountSearchResults.filter(
        account => account.walletId === wallet.id
      )
      if (accountsForWallet.length === 0) {
        return null
      }

      const accountDataForWallet = accountsForWallet.map((account, index) => {
        const isActive = account.id === activeAccount?.id
        const nextAccount = accountsForWallet[index + 1]
        const hideSeparator =
          isActive ||
          nextAccount?.id === activeAccount?.id ||
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
    accountSearchResults,
    activeAccount?.id,
    handleSetActiveAccount,
    gotoAccountDetails
  ])

  const importedWalletsDisplayData = useMemo(() => {
    // Get all accounts from private key wallets
    const allPrivateKeyAccounts = importedWallets
      .flatMap(wallet => {
        return accountSearchResults.filter(
          account => account.walletId === wallet.id
        )
      })
      .sort((a, b) => {
        return recentAccountIds.indexOf(a.id) - recentAccountIds.indexOf(b.id)
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
        const hideSeparator =
          isActive ||
          nextAccount?.id === activeAccount?.id ||
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
    accountSearchResults,
    activeAccount?.id,
    handleSetActiveAccount,
    gotoAccountDetails
  ])

  const walletsDisplayData: (WalletDisplayData | null)[] = useMemo(() => {
    return [...primaryWalletsDisplayData, importedWalletsDisplayData]
  }, [primaryWalletsDisplayData, importedWalletsDisplayData])

  const toggleWalletExpansion = useCallback((walletId: string) => {
    setExpandedWallets(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }))
  }, [])

  const onRefresh = useCallback(() => {
    // TODO: Implement refresh
    // dispatch(fetchWallets())
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
    return (
      <View
        style={{
          gap: 16
        }}>
        {hasSearch && (
          <SearchBar onTextChanged={setSearchText} searchText={searchText} />
        )}
        {errorMessage && (
          <View
            sx={{
              gap: 8,
              alignItems: 'center',
              flexDirection: 'row',
              marginTop: hasSearch ? 0 : 8
            }}>
            <Icons.Alert.ErrorOutline color={colors.$textDanger} />
            <Text
              variant="buttonMedium"
              sx={{ fontFamily: 'Inter-Medium', color: colors.$textDanger }}>
              {errorMessage}
            </Text>
          </View>
        )}
      </View>
    )
  }, [colors.$textDanger, errorMessage, hasSearch, searchText])

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

  const renderItem = useCallback(
    ({ item }: { item: WalletDisplayData }) => {
      if (!item) {
        return null
      }
      const isExpanded = expandedWallets[item.id] ?? false
      const isActive = getIsActiveWallet(item.id, activeAccount)

      if (searchText && item.accounts.length === 0) {
        return null
      }

      return (
        <WalletCard
          wallet={item}
          isActive={isActive}
          isExpanded={isExpanded}
          searchText={searchText}
          renderBottom={() =>
            item.type !== WalletType.PRIVATE_KEY ? (
              <Button
                size="medium"
                leftIcon={
                  !isAddingAccount ? (
                    <Icons.Content.Add
                      color={colors.$textPrimary}
                      width={24}
                      height={24}
                    />
                  ) : undefined
                }
                type="secondary"
                disabled={isAddingAccount}
                onPress={() => handleAddAccountToWallet(item)}>
                {isAddingAccount ? (
                  <ActivityIndicator size="small" color={colors.$textPrimary} />
                ) : (
                  'Add account'
                )}
              </Button>
            ) : (
              <></>
            )
          }
          onToggleExpansion={() => toggleWalletExpansion(item.id)}
          showMoreButton={item.id !== IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID}
          style={[
            {
              marginHorizontal: 16,
              marginVertical: 6
            },
            walletStyle
          ]}
        />
      )
    },
    [
      activeAccount,
      colors.$textPrimary,
      expandedWallets,
      isAddingAccount,
      searchText,
      handleAddAccountToWallet,
      toggleWalletExpansion,
      walletStyle
    ]
  )

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

  const renderEmpty = useCallback(() => {
    return (
      <ErrorState
        sx={{ flex: 1 }}
        title="No accounts found"
        description="Try a different search term"
      />
    )
  }, [])

  return (
    <ListScreen
      {...props}
      data={walletsDisplayData.filter(Boolean) as WalletDisplayData[]}
      backgroundColor={backgroundColor}
      renderHeader={renderHeader}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      renderHeaderRight={renderHeaderRight}
      renderEmpty={renderEmpty}
      renderItem={renderItem}
    />
  )
}
