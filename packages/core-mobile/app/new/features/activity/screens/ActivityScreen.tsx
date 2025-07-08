import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { ChainId, Network } from '@avalabs/core-chains-sdk'
import {
  Chip,
  Image,
  IndexPath,
  Separator,
  SimpleDropdown,
  SPRING_LINEAR_TRANSITION,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import { ListRenderItem } from '@shopify/flash-list'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { NetworkLogoWithChain } from 'common/components/NetworkLogoWithChain'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import {
  getBridgeAssetSymbol,
  isPendingBridgeTransaction
} from 'common/utils/bridgeUtils'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import usePendingBridgeTransactions from 'features/bridge/hooks/usePendingBridgeTransactions'
import { PendingBridgeTransactionItem } from 'features/portfolio/assets/components/PendingBridgeTransactionItem'
import { TokenActivityListItem } from 'features/portfolio/assets/components/TokenActivityListItem'
import { XpActivityListItem } from 'features/portfolio/assets/components/XpActivityListItem'
import { useTokenDetailFilterAndSort } from 'features/portfolio/assets/hooks/useTokenDetailFilterAndSort'
import { useNetworks } from 'hooks/networks/useNetworks'
import { ErrorState } from 'new/common/components/ErrorState'
import { LoadingState } from 'new/common/components/LoadingState'
import React, { useCallback, useMemo, useState } from 'react'
import { ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { Transaction } from 'store/transaction'
import { useGetAllTransactions } from 'store/transaction/hooks/useGetAllTransactions'

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
  const { enabledNetworks, getNetwork } = useNetworks()

  const [selectedNetwork, setSelectedNetwork] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const erc20ContractTokens = useErc20ContractTokens()
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens
  })

  const networkFilters = useMemo(() => {
    return enabledNetworks.map(network => ({
      filterName: network.chainName,
      chainId: network.chainId
    }))
  }, [enabledNetworks])

  const networkOption = useMemo(() => {
    return [networkFilters]?.[selectedNetwork.section]?.[selectedNetwork.row]
  }, [networkFilters, selectedNetwork.row, selectedNetwork.section])

  const network = useMemo(() => {
    return getNetwork(networkOption?.chainId)
  }, [getNetwork, networkOption?.chainId])

  const token = useMemo(() => {
    return filteredTokenList.find(
      tk => Number(tk.localId) === Number(network?.chainId)
      // TODO: Fix this, is localId the same as chainId?
      // Number(tk.localId) === Number(networkOption?.chainId)
    )
  }, [filteredTokenList, network?.chainId])

  const networkDropdown = useMemo(() => {
    return {
      title: 'Network',
      data: [
        networkFilters.map(f => {
          if (f.chainId === ChainId.AVALANCHE_MAINNET_ID) {
            return 'Avalanche C-Chain'
          }
          return f.filterName
        })
      ],
      selected: selectedNetwork,
      onSelected: setSelectedNetwork,
      scrollContentMaxHeight: 250
    }
  }, [networkFilters, selectedNetwork])

  const {
    data: allTransactions,
    refresh,
    isLoading,
    isRefreshing,
    isError
  } = useGetAllTransactions(network)

  const pendingBridgeTxs = usePendingBridgeTransactions(network?.chainId)
  const isPendingBridge = useCallback(
    (tx: Transaction) => {
      return (
        tx.txType === TransactionType.BRIDGE &&
        pendingBridgeTxs.some(
          bridge =>
            (bridge.sourceTxHash === tx.hash ||
              (!!bridge.targetTxHash && bridge.targetTxHash === tx.hash)) &&
            Boolean(bridge.completedAt) === false
        )
      )
    },
    [pendingBridgeTxs]
  )

  const transactionsBySymbol = useMemo(() => {
    return allTransactions.transactions
      .filter(tx => {
        return (
          !token?.symbol ||
          (tx.tokens[0]?.symbol && token.symbol === tx.tokens[0].symbol)
        )
      })
      .filter(tx => !isPendingBridge(tx))
  }, [allTransactions.transactions, token?.symbol, isPendingBridge])

  const { data, filter, sort } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol
  })

  const filteredPendingBridgeTxs = useMemo(
    () =>
      pendingBridgeTxs
        .filter(tx => getBridgeAssetSymbol(tx) === token?.symbol)
        .sort(
          (a, b) => b.sourceStartedAt - a.sourceStartedAt // descending
        ),
    [pendingBridgeTxs, token?.symbol]
  )

  const combinedData = useMemo(() => {
    return [
      ...filteredPendingBridgeTxs.filter(tx => {
        return (
          tx.sourceTxHash.toLowerCase().includes(searchText.toLowerCase()) ||
          tx.targetTxHash?.toLowerCase().includes(searchText.toLowerCase())
        )
      }),
      ...data.filter(tx => {
        return (
          tx.tokens[0]?.symbol
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          tx.tokens[0]?.name.toLowerCase().includes(searchText.toLowerCase()) ||
          tx.hash.toLowerCase().includes(searchText.toLowerCase()) ||
          tx.to.toLowerCase().includes(searchText.toLowerCase()) ||
          tx.from.toLowerCase().includes(searchText.toLowerCase())
        )
      })
    ]
  }, [data, filteredPendingBridgeTxs, searchText])

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
        />
      </View>
    )
  }, [
    filter,
    network,
    networkDropdown.data,
    networkDropdown.onSelected,
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
  }, [containerStyle.minHeight, isError, isLoading, isRefreshing, refresh])

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
      return item.hash
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
        contentContainerStyle={{
          paddingBottom: 16
        }}
        data={combinedData}
        renderItem={renderItem}
        ListHeaderComponent={dropdowns}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        estimatedItemSize={60}
      />
    </Animated.View>
  )
}
