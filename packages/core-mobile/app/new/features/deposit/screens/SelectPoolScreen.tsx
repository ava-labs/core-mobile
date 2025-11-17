import React, { useCallback, useMemo } from 'react'
import { ListScreen } from 'common/components/ListScreen'
import {
  Icons,
  Image,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { ErrorState } from 'common/components/ErrorState'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { Address } from 'viem'
import errorIcon from '../../../assets/icons/melting_face.png'
import { DefiMarket } from '../types'
import { DefiMarketLogo } from '../components/DefiMarketLogo'
import { useDepositSelectedMarket } from '../store'
import { useAvailableMarkets } from '../hooks/useAvailableMarkets'

export const SelectPoolScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { contractAddress, symbol } = useLocalSearchParams<{
    contractAddress?: Address
    symbol: string
  }>()
  const {
    theme: { colors }
  } = useTheme()
  const { data: markets, isPending: isLoadingMarkets } = useAvailableMarkets({})
  const [, setSelectedMarket] = useDepositSelectedMarket()
  const filteredAvailableMarkets = useMemo(() => {
    return markets.filter(market => {
      if (contractAddress) {
        return (
          market.asset.contractAddress?.toLowerCase() ===
          contractAddress?.toLowerCase()
        )
      }
      if (symbol) {
        return market.asset.symbol.toLowerCase() === symbol.toLowerCase()
      }
      return true
    })
  }, [markets, contractAddress, symbol])

  const handleSelectPool = useCallback(
    (market: DefiMarket) => {
      setSelectedMarket(market)
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/deposit/selectAmount',
        params: {}
      })
    },
    [navigate, setSelectedMarket]
  )

  const renderItem = useCallback(
    ({ item }: { item: DefiMarket }) => {
      const data = [
        {
          value: `${item.supplyApyPercent.toFixed(2)}%`,
          label: 'APY'
        },
        {
          value: item.historicalApyPercent
            ? `${item.historicalApyPercent.toFixed(2)}%`
            : '--',
          label: '30-day APY'
        },
        {
          value: item.totalDeposits
            ? formatNumber(item.totalDeposits.toNumber())
            : '--',
          label: 'Deposits'
        }
      ]
      return (
        <TouchableOpacity
          sx={{ marginHorizontal: 16, marginTop: 10 }}
          onPress={() => handleSelectPool(item)}>
          <View
            sx={{
              paddingLeft: 16,
              paddingRight: 8,
              paddingVertical: 12,
              backgroundColor: colors.$surfaceSecondary,
              borderRadius: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
            <DefiMarketLogo item={item} />
            <View
              sx={{
                marginLeft: 15,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10
              }}>
              {data.map((entry, index) => (
                <View
                  key={index}
                  sx={{
                    flex: 1,
                    alignItems:
                      index === data.length - 1 ? 'flex-end' : 'flex-start'
                  }}>
                  <Text
                    variant="body2"
                    sx={{ color: colors.$textPrimary, fontWeight: 500 }}>
                    {entry.value}
                  </Text>
                  <Text
                    variant="subtitle2"
                    sx={{ color: colors.$textSecondary, fontWeight: 500 }}>
                    {entry.label}
                  </Text>
                </View>
              ))}
            </View>
            <Icons.Navigation.ChevronRight color={colors.$textSecondary} />
          </View>
        </TouchableOpacity>
      )
    },
    [colors, handleSelectPool]
  )

  const renderEmpty = useCallback(() => {
    if (isLoadingMarkets) {
      return <LoadingState sx={{ flex: 1 }} />
    }

    return (
      <ErrorState
        sx={{ flex: 1 }}
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No pools found"
        description=""
      />
    )
  }, [isLoadingMarkets])

  return (
    <ListScreen
      title={`Choose a pool to\nstart earning`}
      data={isLoadingMarkets ? [] : filteredAvailableMarkets}
      renderItem={renderItem}
      renderEmpty={renderEmpty}
      keyExtractor={item => item.uniqueMarketId}
    />
  )
}
