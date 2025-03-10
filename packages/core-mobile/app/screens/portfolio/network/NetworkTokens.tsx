import React, { useCallback, useEffect } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import AppNavigation from 'navigation/AppNavigation'
import PortfolioListItem from 'components/PortfolioListItem'
import ZeroState from 'components/ZeroState'
import AvaButton from 'components/AvaButton'
import {
  BridgeTransactionStatusParams,
  PortfolioScreenProps
} from 'navigation/types'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { LocalTokenWithBalance } from 'store/balance/types'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { getSelectedToken } from 'utils/getSelectedToken'
import TabViewAva from 'components/TabViewAva'
import AvaText from 'components/AvaText'
import ActivityList from 'screens/shared/ActivityList/ActivityList'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import TopRightBadge from 'components/TopRightBadge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useNetworks } from 'hooks/networks/useNetworks'
import { isAvmNetwork, isPvmNetwork } from 'utils/network/isAvalancheNetwork'
import { View } from '@avalabs/k2-mobile'
import { isTokenMalicious } from 'utils/isTokenMalicious'
import { XChainAssetList } from '../home/components/Cards/ActiveNetworkCard/XChainAssetList'
import { PChainAssetList } from '../home/components/Cards/ActiveNetworkCard/PChainAssetList'
import NetworkTokensHeader from './components/NetworkTokensHeader'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.NetworkTokens
>

const NetworkTokens = (): JSX.Element => {
  const { params } = useRoute<NavigationProp['route']>()
  const { navigate, getParent } = useNavigation<NavigationProp['navigation']>()
  const { theme } = useApplicationContext()
  const {
    isLoading,
    isRefetching,
    filteredTokenList: tokenList,
    refetch
  } = useSearchableTokenList()

  const manageDisabled = useIsUIDisabled(UI.ManageTokens)
  const manageBtnColor = theme.colorPrimary1
  const { activeNetwork } = useNetworks()
  const pendingBridgeTxs = usePendingBridgeTransactions(activeNetwork)

  useEffect(() => {
    setTimeout(() => {
      getParent()?.setParams({ showBackButton: true })
    }, 300)

    return () => {
      getParent()?.setParams({ showBackButton: false })
    }
  }, [getParent])

  const goToReceive = (): void => navigate(AppNavigation.Wallet.ReceiveTokens)

  const selectToken = (token: LocalTokenWithBalance): void => {
    navigate(AppNavigation.Wallet.OwnedTokenDetail, {
      chainId: activeNetwork.chainId,
      tokenId: token.localId
    })

    AnalyticsService.capture('TokenListTokenSelected', {
      selectedToken: getSelectedToken(token)
    })

    AnalyticsService.capture('PortfolioTokenSelected', {
      selectedToken: getSelectedToken(token)
    })
  }

  const manageTokens = (): void => {
    navigate(AppNavigation.Wallet.TokenManagement)
  }

  const openTransactionStatus = (
    statusParams: BridgeTransactionStatusParams
  ): void => {
    navigate(AppNavigation.Bridge.BridgeTransactionStatus, statusParams)
  }

  const capturePosthogEvents = useCallback((tabIndex: number): void => {
    if (tabIndex === NetworkTokensTabs.Activity) {
      // capture event only for the activity tab with old event name, by request from product
      AnalyticsService.capture('PortfolioActivityClicked')
    }
  }, [])

  const renderTabViewLabel = (
    title: string,
    selected: boolean,
    color: string
  ): JSX.Element => {
    return (
      <View>
        <AvaText.Heading3 textStyle={{ color }} ellipsizeMode="tail">
          {title}
        </AvaText.Heading3>
        {title === TabLabel.Activity && pendingBridgeTxs.length > 0 && (
          <TopRightBadge
            text={pendingBridgeTxs.length.toString()}
            style={{
              borderColor: theme.background,
              borderWidth: 2
            }}
            offset={{ x: 4, y: -4 }}
          />
        )}
      </View>
    )
  }

  const renderItem = (
    item: ListRenderItemInfo<LocalTokenWithBalance>
  ): JSX.Element => {
    const token = item.item
    return (
      <PortfolioListItem
        testID={`${token.name}_portfolio_list_item`}
        showLoading={isLoading || isRefetching}
        tokenName={token.name}
        tokenPrice={token.balanceDisplayValue ?? '0'}
        tokenPriceInCurrency={token.balanceInCurrency}
        image={token?.logoUri}
        symbol={token.symbol}
        onPress={() => selectToken(token)}
        isMalicious={isTokenMalicious(token)}
      />
    )
  }

  const renderManageButton = (): JSX.Element => (
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

  const renderTokens = (): JSX.Element => (
    <FlatList
      testID="portfolio_token_list"
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

  const renderZeroState = (): JSX.Element => {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          flex: 1,
          marginTop: -160,
          zIndex: -100
        }}>
        <ZeroState.NetworkTokens goToReceive={goToReceive} />
      </View>
    )
  }

  const renderTokenTab = (): JSX.Element => {
    if (tokenList.length === 0)
      return (
        <>
          {renderManageButton()}
          {renderZeroState()}
        </>
      )

    if (isPvmNetwork(activeNetwork)) {
      return (
        <PChainAssetList
          scrollEnabled
          sx={{
            marginTop: 16,
            marginHorizontal: 16,
            padding: 16,
            borderRadius: 8
          }}
        />
      )
    }
    if (isAvmNetwork(activeNetwork)) {
      return (
        <XChainAssetList
          scrollEnabled
          sx={{
            marginBottom: 0,
            marginTop: 16,
            marginHorizontal: 16,
            padding: 16,
            borderRadius: 8
          }}
        />
      )
    }

    return renderTokens()
  }

  const renderActivityTab = (): JSX.Element => {
    return <ActivityList openTransactionStatus={openTransactionStatus} />
  }

  return (
    <View style={{ flex: 1 }}>
      <NetworkTokensHeader />
      <TabViewAva
        renderLabel={renderTabViewLabel}
        currentTabIndex={params?.tabIndex}
        onTabIndexChange={capturePosthogEvents}>
        <TabViewAva.Item title={TabLabel.Tokens}>
          {renderTokenTab()}
        </TabViewAva.Item>
        <TabViewAva.Item title={TabLabel.Activity}>
          {renderActivityTab()}
        </TabViewAva.Item>
      </TabViewAva>
    </View>
  )
}

enum TabLabel {
  Tokens = 'Tokens',
  Activity = 'Activity'
}

export enum NetworkTokensTabs {
  Tokens,
  Activity
}

export default NetworkTokens
