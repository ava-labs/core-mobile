import { Icons, SearchBar, useTheme } from '@avalabs/k2-alpine'
import { CoreAccountType } from '@avalabs/types'
import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import NavigationBarButton from 'common/components/NavigationBarButton'
import WalletCard from 'common/components/WalletCard'
import { WalletDisplayData } from 'common/types'
import { useRouter } from 'expo-router'
import { IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID } from 'features/accountSettings/consts'
import { useWalletsDisplayData } from 'features/accountSettings/hooks/useWalletsDisplayData'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { selectActiveWalletId, selectWallets } from 'store/wallet/slice'

export const ManageAccounts = (): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { navigate } = useRouter()
  const [searchText, setSearchText] = useState('')
  const allWallets = useSelector(selectWallets)
  const activeWalletId = useSelector(selectActiveWalletId)
  const activeAccount = useSelector(selectActiveAccount)

  const walletsDisplayData = useWalletsDisplayData(searchText)

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

  const renderItem = useCallback(
    ({ item }: { item: WalletDisplayData }) => {
      if (!item) {
        return null
      }
      const isExpanded = expandedWallets[item.id] ?? false

      if (searchText && item.accounts.length === 0) {
        return null
      }

      return (
        <WalletCard
          wallet={item}
          isExpanded={isExpanded}
          searchText={searchText}
          onToggleExpansion={() => toggleWalletExpansion(item.id)}
          showMoreButton={item.id !== IMPORTED_ACCOUNTS_VIRTUAL_WALLET_ID}
          style={{
            marginHorizontal: 16,
            marginTop: 12
          }}
        />
      )
    },
    [expandedWallets, searchText, toggleWalletExpansion]
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

  return (
    <ListScreen
      title="Manage accounts"
      isModal
      renderHeader={renderHeader}
      renderHeaderRight={renderHeaderRight}
      renderEmpty={renderEmpty}
      data={walletsDisplayData}
      keyExtractor={item => item.id}
      renderItem={renderItem}
    />
  )
}
