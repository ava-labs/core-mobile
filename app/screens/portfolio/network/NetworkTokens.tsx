import React, { useEffect } from 'react'
import { FlatList, ListRenderItemInfo, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import PortfolioListItem from 'components/PortfolioListItem'
import ZeroState from 'components/ZeroState'
import AvaButton from 'components/AvaButton'
import { PortfolioScreenProps } from 'navigation/types'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { LocalTokenWithBalance } from 'store/balance'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { getSelectedToken } from 'utils/getSelectedToken'
import NetworkTokensHeader from './components/NetworkTokensHeader'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.NetworkTokens
>['navigation']

const NetworkTokens = () => {
  const { theme } = useApplicationContext()
  const { capture } = usePostCapture()
  const { navigate, getParent } = useNavigation<NavigationProp>()
  const {
    isLoading,
    isRefetching,
    filteredTokenList: tokenList,
    refetch
  } = useSearchableTokenList()

  const manageDisabled = useIsUIDisabled(UI.ManageTokens)
  const manageBtnColor = theme.colorPrimary1

  useEffect(() => {
    setTimeout(() => {
      getParent()?.setParams({ showBackButton: true })
    }, 300)

    return () => {
      getParent()?.setParams({ showBackButton: false })
    }
  }, [getParent])

  const goToReceive = () => navigate(AppNavigation.Wallet.ReceiveTokens)

  const selectToken = (token: LocalTokenWithBalance) => {
    navigate(AppNavigation.Wallet.OwnedTokenDetail, {
      tokenId: token.localId
    })

    capture('TokenListTokenSelected', {
      selectedToken: getSelectedToken(token)
    })

    capture('PortfolioTokenSelected', {
      selectedToken: getSelectedToken(token)
    })
  }

  const manageTokens = () => {
    navigate(AppNavigation.Wallet.TokenManagement)
  }

  const renderItem = (item: ListRenderItemInfo<LocalTokenWithBalance>) => {
    const token = item.item
    return (
      <PortfolioListItem
        showLoading={isLoading || isRefetching}
        tokenName={token.name}
        tokenPrice={token.balanceDisplayValue ?? '0'}
        tokenPriceInCurrency={token.balanceInCurrency}
        image={token?.logoUri}
        symbol={token.symbol}
        onPress={() => selectToken(token)}
      />
    )
  }

  const renderManageButton = () => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}>
      <AvaButton.TextLink
        textColor={manageBtnColor}
        onPress={manageTokens}
        disabled={manageDisabled}>
        Manage
      </AvaButton.TextLink>
    </View>
  )

  const renderTokens = () => (
    <FlatList
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 100,
        flexGrow: 1
      }}
      data={tokenList}
      renderItem={renderItem}
      keyExtractor={(item: LocalTokenWithBalance) => item.localId}
      onRefresh={refetch}
      refreshing={isRefetching}
      scrollEventThrottle={16}
      ListHeaderComponent={renderManageButton()}
    />
  )

  const renderZeroState = () => {
    return (
      <View style={{ paddingHorizontal: 16, flex: 1, marginTop: -160 }}>
        <ZeroState.NetworkTokens goToReceive={goToReceive} />
      </View>
    )
  }

  const renderContent = () => {
    if (tokenList.length === 0) return renderZeroState()

    return renderTokens()
  }

  return (
    <View style={{ flex: 1 }}>
      <NetworkTokensHeader />
      {renderContent()}
    </View>
  )
}

export default NetworkTokens
