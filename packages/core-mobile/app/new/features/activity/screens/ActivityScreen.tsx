import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import {
  Chip,
  Image,
  Separator,
  SimpleDropdown,
  SPRING_LINEAR_TRANSITION,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { isPendingBridgeTransaction } from 'common/utils/bridgeUtils'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import { PendingBridgeTransactionItem } from 'features/portfolio/assets/components/PendingBridgeTransactionItem'
import { TokenActivityListItem } from 'features/portfolio/assets/components/TokenActivityListItem'
import { XpActivityListItem } from 'features/portfolio/assets/components/XpActivityListItem'
import { ErrorState } from 'new/common/components/ErrorState'
import { LoadingState } from 'new/common/components/LoadingState'
import React, { useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { Transaction } from 'store/transaction'
import { useActivityFilterAndSearch } from '../hooks/useActivityFilterAndSearch'

const errorIcon = require('../../../assets/icons/unamused_emoji.png')

export const ActivityScreen = ({
  searchText,
  containerStyle,
  handleExplorerLink,
  handlePendingBridge
}: {
  searchText: string
  handleExplorerLink: (explorerLink: string) => void
  handlePendingBridge: (transaction: BridgeTransaction | BridgeTransfer) => void
  containerStyle: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const {
    data,
    filter,
    sort,
    isLoading,
    isRefreshing,
    isError,
    refresh,
    network,
    networkOption,
    networkDropdown,
    selectedNetwork
  } = useActivityFilterAndSearch({ searchText })

  const renderItem: ListRenderItem<
    Transaction | BridgeTransaction | BridgeTransfer
  > = useCallback(
    ({ item, index }) => {
      if (isPendingBridgeTransaction(item)) {
        return (
          <PendingBridgeTransactionItem
            key={item.sourceTxHash}
            item={item}
            index={index}
            onPress={() => handlePendingBridge(item)}
          />
        )
      } else {
        const isXpTx = isXpTransaction(item.txType)
        // TODO: After fixing the token issue, we can remove this
        // token &&
        // (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token))

        const props = {
          tx: item,
          index,
          onPress: () => handleExplorerLink(item.explorerLink)
        }

        if (isXpTx) {
          return <XpActivityListItem {...props} key={item.hash} />
        }
        return <TokenActivityListItem {...props} key={item.hash} />
      }
    },
    [handleExplorerLink, handlePendingBridge]
  )

  const dropdowns = useMemo(() => {
    return (
      <View
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 4,
          marginBottom: 16,
          paddingHorizontal: 16
        }}>
        <DropdownSelections filter={filter} sort={sort} />

        <SimpleDropdown
          from={
            <Chip
              renderLeft={() => (
                <NetworkLogoWithChain
                  network={network as Network}
                  networkSize={18}
                  outerBorderColor={theme.colors.$surfaceSecondary}
                  showChainLogo={false}
                />
              )}
              style={{
                paddingLeft: 6,
                paddingRight: 10,
                gap: 4
              }}
              size="large"
              hitSlop={8}
              testID="network_dropdown_btn">
              {networkOption?.filterName}
            </Chip>
          }
          sections={networkDropdown.data}
          selectedRows={[selectedNetwork]}
          onSelectRow={networkDropdown.onSelected}
          scrollContentMaxHeight={networkDropdown.scrollContentMaxHeight}
        />
      </View>
    )
  }, [
    filter,
    network,
    networkDropdown.data,
    networkDropdown.onSelected,
    networkDropdown.scrollContentMaxHeight,
    networkOption?.filterName,
    selectedNetwork,
    sort,
    theme.colors.$surfaceSecondary
  ])

  const emptyComponent = useMemo(() => {
    if (isRefreshing || isLoading) {
      return (
        <CollapsibleTabs.ContentWrapper
          height={Number(containerStyle.minHeight)}>
          <LoadingState />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    if (searchText.length > 0) {
      return (
        <CollapsibleTabs.ContentWrapper
          height={Number(containerStyle.minHeight)}>
          <ErrorState title="No results found" description="" />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    if (isError) {
      return (
        <CollapsibleTabs.ContentWrapper
          height={Number(containerStyle.minHeight)}>
          <ErrorState
            button={{
              title: 'Refresh',
              onPress: refresh
            }}
          />
        </CollapsibleTabs.ContentWrapper>
      )
    }

    return (
      <CollapsibleTabs.ContentWrapper height={Number(containerStyle.minHeight)}>
        <ErrorState
          icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
          title="No recent transactions"
          description="Interact with this token onchain and see your activity here"
        />
      </CollapsibleTabs.ContentWrapper>
    )
  }, [
    containerStyle.minHeight,
    isError,
    isLoading,
    isRefreshing,
    refresh,
    searchText.length
  ])

  const renderSeparator = useCallback((): JSX.Element => {
    return <Separator sx={{ marginLeft: 68 }} />
  }, [])

  const overrideProps = {
    contentContainerStyle: {
      ...containerStyle
    }
  }

  const keyExtractor = useCallback(
    (item: Transaction | BridgeTransaction | BridgeTransfer) => {
      if (isPendingBridgeTransaction(item)) {
        return item.sourceTxHash
      }

      return `${item.hash}`
    },
    []
  )

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(5)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <CollapsibleTabs.FlashList
        overrideProps={overrideProps}
        data={data}
        renderItem={renderItem}
        ListHeaderComponent={dropdowns}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        keyExtractor={keyExtractor}
        estimatedItemSize={60}
        refreshing={isRefreshing}
        onRefresh={refresh}
      />
    </Animated.View>
  )
}
