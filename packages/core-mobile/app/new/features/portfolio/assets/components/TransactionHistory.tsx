import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Image, SPRING_LINEAR_TRANSITION } from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { getBridgeAssetSymbol } from 'common/utils/bridgeUtils'
import { ActivityList } from 'features/activity/components/ActivityList'
import {
  buildGroupedData,
  getDateGroups,
  isCollectibleTransaction,
  isSupportedNftChainId
} from 'features/activity/utils'
import usePendingBridgeTransactions from 'features/bridge/hooks/usePendingBridgeTransactions'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { FC, useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { LocalTokenWithBalance } from 'store/balance'
import { Transaction, useGetRecentTransactions } from 'store/transaction'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { isPChain } from 'utils/network/isAvalancheNetwork'
import {
  TOKEN_DETAIL_FILTERS,
  TokenDetailFilter,
  useTokenDetailFilterAndSort
} from '../hooks/useTokenDetailFilterAndSort'

const errorIcon = require('../../../../assets/icons/unamused_emoji.png')

interface Props {
  token?: LocalTokenWithBalance
  handleExplorerLink: (explorerLink: string) => void
  handlePendingBridge: (transaction: BridgeTransaction | BridgeTransfer) => void
}

const TransactionHistory: FC<Props> = ({
  token,
  handleExplorerLink,
  handlePendingBridge
}): React.JSX.Element => {
  const { getNetwork } = useNetworks()

  const network = useMemo(() => {
    return getNetwork(token?.networkChainId)
  }, [token, getNetwork])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const pendingBridgeTxs = usePendingBridgeTransactions(token?.networkChainId)
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
    return transactions
      .filter(tx => {
        // Filter collectible transactions that support collectible transactions
        if (
          isCollectibleTransaction(tx) &&
          isTokenCollectibleSupported(Number(tx.chainId), token?.symbol ?? '')
        ) {
          return true
        }

        return (
          !token?.symbol ||
          (tx.tokens[0]?.symbol && token.symbol === tx.tokens[0].symbol) ||
          (tx.tokens[1]?.symbol && token.symbol === tx.tokens[1].symbol)
        )
      })
      .filter(tx => !isPendingBridge(tx))
  }, [token, transactions, isPendingBridge])

  const filters: DropdownGroup[] | undefined = useMemo(() => {
    if (token?.networkChainId) {
      const newFilters = [...(TOKEN_DETAIL_FILTERS[0]?.items ?? [])]
      // Stake filter is only available for P-Chain
      if (isPChain(token?.networkChainId)) {
        newFilters.push({
          id: TokenDetailFilter.Stake,
          title: TokenDetailFilter.Stake
        })
      }

      // Only Avalanche C-Chain and Ethereum are supported for NFTs
      if (
        isSupportedNftChainId(token?.networkChainId) &&
        isTokenCollectibleSupported(
          Number(token?.networkChainId),
          token?.symbol ?? ''
        )
      ) {
        newFilters.push({
          id: TokenDetailFilter.NFT,
          title: TokenDetailFilter.NFT
        })
      }
      return [
        {
          key: 'token-detail-filters',
          items: newFilters
        }
      ]
    }
  }, [token?.networkChainId, token?.symbol])

  const { data, filter, sort } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol,
    filters
  })

  const combinedData = useMemo(() => {
    const filteredPendingBridgeTxs = pendingBridgeTxs
      .toSorted((a, b) => b.sourceStartedAt - a.sourceStartedAt)
      .filter(tx => getBridgeAssetSymbol(tx) === token?.symbol)

    const { todayTxs, monthGroups } = getDateGroups(data)
    return buildGroupedData(todayTxs, monthGroups, filteredPendingBridgeTxs)
  }, [data, pendingBridgeTxs, token?.symbol])

  const renderEmpty = useCallback(() => {
    if (isLoading || isRefreshing) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (isError) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refresh
          }}
        />
      )
    }

    return (
      <ErrorState
        sx={{ height: portfolioTabContentHeight }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No recent transactions"
        description="Interact with this token onchain and see your activity here"
      />
    )
  }, [isError, isLoading, isRefreshing, refresh])

  const renderHeader = useCallback(() => {
    return (
      <DropdownSelections filter={filter} sort={sort} sx={styles.dropdown} />
    )
  }, [filter, sort])

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      layout={SPRING_LINEAR_TRANSITION}
      style={{
        flex: 1
      }}>
      <ActivityList
        data={combinedData}
        handlePendingBridge={handlePendingBridge}
        handleExplorerLink={handleExplorerLink}
        overrideProps={{
          contentContainerStyle: {
            overflow: 'visible',
            paddingBottom: 16
          }
        }}
        renderHeader={renderHeader}
        renderEmpty={renderEmpty}
        isRefreshing={isRefreshing}
        refresh={refresh}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  dropdown: { paddingHorizontal: 16, marginTop: 4, marginBottom: 16 }
})

export default TransactionHistory

function isTokenCollectibleSupported(chainId: number, symbol: string): boolean {
  return (
    (isAvalancheCChainId(chainId) && symbol === 'AVAX') ||
    (isEthereumChainId(chainId) && symbol === 'ETH')
  )
}
