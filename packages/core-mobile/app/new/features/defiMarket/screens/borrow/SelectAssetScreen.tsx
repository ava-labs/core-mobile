import React, { useCallback, useMemo } from 'react'
import {
  Icons,
  Image,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { useRouter } from 'expo-router'
import { ListScreen } from 'common/components/ListScreen'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { DefiMarket, MarketNames } from '../../types'
import { DefiAssetLogo } from '../../components/DefiAssetLogo'
import { useBorrowProtocol } from '../../hooks/useBorrowProtocol'
import { useAvailableMarkets } from '../../hooks/useAvailableMarkets'
import errorIcon from '../../../../assets/icons/melting_face.png'

const PROTOCOL_DISPLAY_NAMES: Record<string, string> = {
  [MarketNames.aave]: 'AAVE',
  [MarketNames.benqi]: 'Benqi'
}

export const SelectAssetScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { theme } = useTheme()
  const { selectedProtocol } = useBorrowProtocol()
  const {
    data: markets,
    isPending: isLoading,
    refresh,
    isRefreshing
  } = useAvailableMarkets()

  // Filter markets by selected protocol and borrowing enabled, sorted by borrow APY (lowest first)
  const borrowableMarkets = useMemo(() => {
    if (!markets) return []
    return markets
      .filter(
        market =>
          market.marketName === selectedProtocol && market.borrowingEnabled
      )
      .sort((a, b) => (a.borrowApyPercent ?? 0) - (b.borrowApyPercent ?? 0))
  }, [markets, selectedProtocol])

  const handleSelectAsset = useCallback(
    (market: DefiMarket) => {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/borrow/enterAmount',
        params: {
          uniqueMarketId: market.uniqueMarketId
        }
      })
    },
    [navigate]
  )

  const formatApyPercent = useCallback((value: number | undefined): string => {
    if (value === undefined || Number.isNaN(value)) return '-'
    return `${value.toFixed(2)}%`
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: DefiMarket }) => {
      return (
        <TouchableOpacity onPress={() => handleSelectAsset(item)}>
          <View
            sx={{
              marginHorizontal: 16,
              marginTop: 10,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: theme.colors.$surfaceSecondary,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
            <DefiAssetLogo
              asset={item.asset}
              network={item.network}
              width={36}
            />
            <View sx={{ flex: 1 }}>
              <Text
                variant="body2"
                sx={{ color: theme.colors.$textPrimary, fontWeight: 500 }}>
                {item.asset.symbol}
              </Text>
            </View>
            <View sx={{ flex: 0.9 }}>
              <Text
                variant="body2"
                sx={{ color: theme.colors.$textPrimary, fontWeight: 500 }}>
                {formatApyPercent(item.borrowApyPercent)}
              </Text>
              <Text
                variant="subtitle2"
                sx={{ color: theme.colors.$textSecondary, fontWeight: 500 }}>
                APY
              </Text>
            </View>
            <View sx={{ flex: 1 }}>
              <Text
                variant="body2"
                sx={{ color: theme.colors.$textPrimary, fontWeight: 500 }}>
                {formatApyPercent(item.historicalBorrowApyPercent)}
              </Text>
              <Text
                variant="subtitle2"
                sx={{ color: theme.colors.$textSecondary, fontWeight: 500 }}>
                30-day APY
              </Text>
            </View>
            <Icons.Navigation.ChevronRight
              color={theme.colors.$textSecondary}
              width={20}
              height={20}
            />
          </View>
        </TouchableOpacity>
      )
    },
    [theme.colors, formatApyPercent, handleSelectAsset]
  )

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return <LoadingState sx={{ flex: 1 }} />
    }
    return (
      <ErrorState
        sx={{ flex: 1 }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No borrowable assets"
        description={`No assets available to borrow on ${
          PROTOCOL_DISPLAY_NAMES[selectedProtocol] ?? selectedProtocol
        }`}
      />
    )
  }, [isLoading, selectedProtocol])

  return (
    <ListScreen
      title={`Choose an asset to borrow`}
      isModal
      data={borrowableMarkets}
      renderItem={renderItem}
      renderEmpty={renderEmpty}
      keyExtractor={item => item.uniqueMarketId}
      onRefresh={refresh}
      refreshing={isRefreshing}
    />
  )
}
