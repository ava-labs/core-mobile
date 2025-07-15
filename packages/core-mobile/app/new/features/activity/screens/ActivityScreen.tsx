import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import {
  ANIMATED,
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
import { Platform, ViewStyle } from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Transaction } from 'store/transaction'
import { useActivityFilterAndSearch } from '../hooks/useActivityFilterAndSearch'

const errorIcon = require('../../../assets/icons/unamused_emoji.png')

export const ActivityScreen = ({
  isSearchBarFocused,
  searchText,
  containerStyle,
  handleExplorerLink,
  handlePendingBridge
}: {
  isSearchBarFocused: boolean
  searchText: string
  handleExplorerLink: (explorerLink: string) => void
  handlePendingBridge: (transaction: BridgeTransaction | BridgeTransfer) => void
  containerStyle: ViewStyle
}): JSX.Element => {
  const { theme } = useTheme()
  const header = useHeaderMeasurements()

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
    selectedNetwork,
    token
  } = useActivityFilterAndSearch({ searchText })

  const keyboardAvoidingStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withTiming(
            isSearchBarFocused
              ? -header.height + (Platform.OS === 'ios' ? 40 : 32)
              : 0,
            {
              ...ANIMATED.TIMING_CONFIG
            }
          )
        }
      ]
    }
  })

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
      return <LoadingState />
    }

    if (searchText.length > 0) {
      return <ErrorState title="No results found" description="" />
    }

    if (isError) {
      return (
        <ErrorState
          button={{
            title: 'Refresh',
            onPress: refresh
          }}
        />
      )
    }

    return (
      <ErrorState
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No recent transactions"
        description="Interact with this token onchain and see your activity here"
      />
    )
  }, [isError, isLoading, isRefreshing, refresh, searchText.length])

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper
        height={
          Number(containerStyle.minHeight) - (Platform.OS === 'ios' ? 50 : 32)
        }>
        <Animated.View style={keyboardAvoidingStyle}>
          {emptyComponent}
        </Animated.View>
      </CollapsibleTabs.ContentWrapper>
    )
  }, [containerStyle.minHeight, emptyComponent, keyboardAvoidingStyle])

  const renderItem: ListRenderItem<
    Transaction | BridgeTransaction | BridgeTransfer
  > = useCallback(
    ({ item, index }) => {
      if (isPendingBridgeTransaction(item)) {
        return (
          <PendingBridgeTransactionItem
            item={item}
            index={index}
            onPress={() => handlePendingBridge(item)}
          />
        )
      } else {
        const isXpTx =
          isXpTransaction(item.txType) &&
          token &&
          (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token))

        const props = {
          tx: item,
          index,
          onPress: () => handleExplorerLink(item.explorerLink)
        }

        if (isXpTx) {
          return <XpActivityListItem {...props} />
        }

        return <TokenActivityListItem {...props} showTokenLogo />
      }
    },
    [handleExplorerLink, handlePendingBridge, token]
  )

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
        ListEmptyComponent={renderEmpty}
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
