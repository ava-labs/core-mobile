import React, { useEffect } from 'react'
import { FlatList, ListRenderItemInfo, View } from 'react-native'
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
import { LocalTokenWithBalance } from 'store/balance'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { getSelectedToken } from 'utils/getSelectedToken'
import TabViewAva from 'components/TabViewAva'
import AvaText from 'components/AvaText'
import ActivityList from 'screens/shared/ActivityList/ActivityList'
import { Transaction } from 'store/transaction'
import usePendingBridgeTransactions from 'screens/bridge/hooks/usePendingBridgeTransactions'
import { selectActiveNetwork } from 'store/network'
import { useSelector } from 'react-redux'
import TopRightBadge from 'components/TopRightBadge'
import AnalyticsService from 'services/analytics/AnalyticsService'
import NetworkTokensHeader from './components/NetworkTokensHeader'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.NetworkTokens
>

const NetworkTokens = (): JSX.Element => {
  const { params } = useRoute<NavigationProp['route']>()
  const { navigate, getParent, setParams } =
    useNavigation<NavigationProp['navigation']>()
  const { theme } = useApplicationContext()
  const {
    isLoading,
    isRefetching,
    filteredTokenList: tokenList,
    refetch
  } = useSearchableTokenList()

  const manageDisabled = useIsUIDisabled(UI.ManageTokens)
  const manageBtnColor = theme.colorPrimary1

  const activeNetwork = useSelector(selectActiveNetwork)
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

  const openTransactionDetails = (item: Transaction): void => {
    navigate(AppNavigation.Wallet.ActivityDetail, {
      tx: item
    })
  }

  const openTransactionStatus = (
    statusParams: BridgeTransactionStatusParams
  ): void => {
    navigate(AppNavigation.Bridge.BridgeTransactionStatus, statusParams)
  }

  function capturePosthogEvents(tabIndex: number): void {
    if (tabIndex === NetworkTokensTabs.Activity) {
      // capture event only for the activity tab with old event name, by request from product
      AnalyticsService.capture('PortfolioActivityClicked')
    }
  }

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
      <View style={{ paddingHorizontal: 16, flex: 1, marginTop: -160 }}>
        <ZeroState.NetworkTokens goToReceive={goToReceive} />
      </View>
    )
  }

  const renderTokenTab = (): JSX.Element => {
    if (tokenList.length === 0) return renderZeroState()

    return renderTokens()
  }

  const renderActivityTab = (): JSX.Element => {
    return (
      <ActivityList
        openTransactionDetails={openTransactionDetails}
        openTransactionStatus={openTransactionStatus}
      />
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <NetworkTokensHeader />
      <TabViewAva
        renderCustomLabel={renderTabViewLabel}
        currentTabIndex={params?.tabIndex}
        onTabIndexChange={tabIndex => {
          setParams({ tabIndex })
          capturePosthogEvents(tabIndex)
        }}>
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
