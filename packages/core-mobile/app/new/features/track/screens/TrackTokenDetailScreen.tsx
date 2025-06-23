import {
  Card,
  GroupList,
  GroupListItem,
  Icons,
  SegmentedControl,
  showAlert,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { LoadingState } from 'common/components/LoadingState'
import { useLocalSearchParams, useRouter } from 'expo-router'
/**
 * Temporarily import "useNavigation" from @react-navigation/native.
 * This is a workaround due to a render bug in the expo-router version.
 * See: https://github.com/expo/expo/issues/35383
 * TODO: Adjust import back to expo-router once the bug is resolved.
 */
import { truncateAddress } from '@avalabs/core-utils-sdk'
import { FavoriteBarButton } from 'common/components/FavoriteBarButton'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { ShareBarButton } from 'common/components/ShareBarButton'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { copyToClipboard } from 'common/utils/clipboard'
import { format } from 'date-fns'
import { useAddStake } from 'features/stake/hooks/useAddStake'
import { AVAX_TOKEN_ID } from 'common/consts/swap'
import { useNavigateToSwap } from 'features/swap/hooks/useNavigateToSwap'
import { SelectedChartDataIndicator } from 'features/track/components/SelectedChartDataIndicator'
import { TokenDetailChart } from 'features/track/components/TokenDetailChart'
import { TokenDetailFooter } from 'features/track/components/TokenDetailFooter'
import { TokenHeader } from 'features/track/components/TokenHeader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { getDomainFromUrl } from 'utils/getDomainFromUrl/getDomainFromUrl'
import { isPositiveNumber } from 'utils/isPositiveNumber/isPositiveNumber'
import { formatLargeCurrency } from 'utils/Utils'
import { useTokenDetails } from 'common/hooks/useTokenDetails'
import { useGetPrices } from 'hooks/watchlist/useGetPrices'
import { useIsFocused } from '@react-navigation/native'
import { MarketType } from 'store/watchlist'
import { AVAX_COINGECKO_ID } from 'consts/coingecko'
import { useIsSwapListLoaded } from 'common/hooks/useIsSwapListLoaded'
import { useBuy } from 'features/meldOnramp/hooks/useBuy'

const MAX_VALUE_WIDTH = '80%'

const TrackTokenDetailScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { tokenId, marketType } = useLocalSearchParams<{
    tokenId: string
    marketType: MarketType
  }>()
  const { back, navigate } = useRouter()
  const [isChartInteracting, setIsChartInteracting] = useState(false)
  const { navigateToSwap } = useNavigateToSwap()
  const { addStake } = useAddStake()
  const headerOpacity = useSharedValue(1)
  const selectedDataIndicatorOpacity = useDerivedValue(
    () => 1 - headerOpacity.value
  )
  const [selectedData, setSelectedData] = useState<{
    value: number
    date: Date
  }>()
  const { formatCurrency } = useFormatCurrency()
  const {
    chartData,
    ranges,
    changeChartDays,
    tokenInfo,
    isFavorite,
    handleFavorite,
    openUrl,
    coingeckoId,
    chainId
  } = useTokenDetails({ tokenId: tokenId, marketType })
  const isFocused = useIsFocused()
  const { navigateToBuy } = useBuy()

  const { data: prices } = useGetPrices({
    coingeckoIds: [coingeckoId],
    enabled:
      isFocused &&
      tokenInfo !== undefined &&
      tokenInfo.currentPrice === undefined &&
      coingeckoId.length > 0
  })

  const isSwapListLoaded = useIsSwapListLoaded()

  const selectedSegmentIndex = useSharedValue(0)

  const lastUpdatedDate = chartData?.[chartData.length - 1]?.date

  const formatMarketNumbers = useCallback(
    (value: number) => {
      return value === 0
        ? ' -'
        : formatLargeCurrency(formatCurrency({ amount: value }))
    },
    [formatCurrency]
  )

  const handleDataSelected = useCallback(
    (point: { value: number; date: Date }): void => {
      setSelectedData(point)
    },
    []
  )

  const handleSelectSegment = useCallback(
    (index: number) => {
      selectedSegmentIndex.value = index

      changeChartDays(
        SEGMENT_INDEX_MAP[index] ?? 1 // default to 1 day if index is not found
      )
    },
    [selectedSegmentIndex, changeChartDays]
  )

  const handleChartGestureStart = useCallback((): void => {
    setIsChartInteracting(true)
  }, [])

  const handleChartGestureEnd = useCallback((): void => {
    setIsChartInteracting(false)
  }, [])

  const handlePressAbout = useCallback((): void => {
    showAlert({
      title: `About ${tokenInfo?.symbol.toUpperCase()}`,
      description: tokenInfo?.description,
      buttons: [
        {
          text: 'Close'
        }
      ]
    })
  }, [tokenInfo?.symbol, tokenInfo?.description])

  const handleMarketCapIconPress = useCallback((): void => {
    showAlert({
      title: 'Market cap',
      description: `Total market value of a cryptocurrency's circulating supply. Similar to the stock market's measurement of multiplying price per share by shares readily available in the market.`,
      buttons: [
        {
          text: 'Got it'
        }
      ]
    })
  }, [])

  const handlePressTwitter = useCallback(() => {
    if (tokenInfo?.twitterHandle) {
      back()
      openUrl({
        url: `https://x.com/${tokenInfo.twitterHandle}`,
        title: 'X'
      })
    }
  }, [openUrl, tokenInfo?.twitterHandle, back])

  const handlePressWebsite = useCallback(() => {
    if (tokenInfo?.urlHostname) {
      back()
      openUrl({
        url: tokenInfo.urlHostname,
        title: 'Website'
      })
    }
  }, [openUrl, tokenInfo?.urlHostname, back])

  const handleBuy = useCallback(
    (contractAddress?: string): void => {
      if (contractAddress === undefined) return
      navigateToBuy({
        showAvaxWarning: true,
        address: contractAddress
      })
    },
    [navigateToBuy]
  )

  const handleSwap = useCallback(
    (initialTokenIdTo?: string): void => {
      navigateToSwap(AVAX_TOKEN_ID, initialTokenIdTo)
    },
    [navigateToSwap]
  )

  const handleShare = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/trackTokenDetail/share',
      params: { tokenId, marketType }
    })
  }, [navigate, marketType, tokenId])

  const marketData = useMemo(() => {
    const data: GroupListItem[] = []

    if (isPositiveNumber(tokenInfo?.marketCap)) {
      data.push({
        title: 'Market cap',
        rightIcon: (
          <TouchableOpacity onPress={handleMarketCapIconPress}>
            <Icons.Alert.AlertCircle color={theme.colors.$textPrimary} />
          </TouchableOpacity>
        ),
        value: formatMarketNumbers(tokenInfo.marketCap)
      })
    }

    if (isPositiveNumber(tokenInfo?.marketVolume)) {
      data.push({
        title: '24-hr volume',
        value: formatMarketNumbers(tokenInfo?.marketVolume)
      })
    }

    if (isPositiveNumber(tokenInfo?.marketCirculatingSupply)) {
      data.push({
        title: 'Available supply',
        value: formatMarketNumbers(tokenInfo.marketCirculatingSupply)
      })
    }

    if (isPositiveNumber(tokenInfo?.marketTotalSupply)) {
      data.push({
        title: 'Total supply',
        value: formatMarketNumbers(tokenInfo.marketTotalSupply)
      })
    }

    return data
  }, [tokenInfo, formatMarketNumbers, theme, handleMarketCapIconPress])

  const metaData = useMemo(() => {
    const data: GroupListItem[] = []

    if (tokenInfo?.contractAddress) {
      data.push({
        title: 'Contract address',
        accessory: (
          <Text
            selectable
            variant="body1"
            ellipsizeMode={'middle'}
            sx={{
              color: '$textSecondary',
              maxWidth: 120,
              fontFamily: 'DejaVuSansMono'
            }}
            numberOfLines={1}
            testID="account_address">
            {truncateAddress(tokenInfo.contractAddress, 8)}
          </Text>
        ),
        onPress: () =>
          copyToClipboard(tokenInfo.contractAddress, 'Contract address copied'),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onLongPress: () => {}
      })
    }

    if (tokenInfo?.urlHostname) {
      data.push({
        title: 'Website',
        value: getDomainFromUrl(tokenInfo.urlHostname),
        accessory: <Icons.Custom.Outbound color={theme.colors.$textPrimary} />,
        onPress: handlePressWebsite
      })
    }

    if (tokenInfo?.twitterHandle) {
      data.push({
        title: 'X / Twitter',
        value: `@${tokenInfo.twitterHandle}`,
        accessory: <Icons.Custom.Outbound color={theme.colors.$textPrimary} />,
        onPress: handlePressTwitter
      })
    }

    return data
  }, [tokenInfo, theme, handlePressWebsite, handlePressTwitter])

  const renderHeaderRight = useCallback(() => {
    // favorite feature is only available for tokens that exist in our database
    const showFavoriteButton = marketType !== MarketType.SEARCH

    return (
      <View
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginTop: 14,
          marginRight: 18,
          alignItems: 'center'
        }}>
        {showFavoriteButton && (
          <FavoriteBarButton isFavorite={isFavorite} onPress={handleFavorite} />
        )}
        <ShareBarButton onPress={handleShare} />
      </View>
    )
  }, [isFavorite, handleFavorite, handleShare, marketType])

  useEffect(() => {
    headerOpacity.value = withTiming(isChartInteracting ? 0 : 1, {
      duration: 300
    })
  }, [isChartInteracting, headerOpacity])

  const renderFooter = useCallback(() => {
    return (
      <TokenDetailFooter
        isAVAX={coingeckoId === AVAX_COINGECKO_ID}
        marketType={marketType}
        contractAddress={tokenInfo?.contractAddress}
        chainId={chainId}
        onBuy={() => handleBuy(tokenInfo?.contractAddress)}
        onStake={addStake}
        onSwap={handleSwap}
      />
    )
  }, [
    coingeckoId,
    tokenInfo?.contractAddress,
    chainId,
    marketType,
    handleBuy,
    addStake,
    handleSwap
  ])

  const renderHeader = useCallback(() => {
    if (!tokenInfo) {
      return <></>
    }
    return (
      <TokenHeader
        logoUri={tokenInfo.logoUri}
        symbol={tokenInfo.symbol ?? ''}
        currentPrice={
          tokenInfo.currentPrice ?? prices?.[coingeckoId]?.priceInCurrency
        }
        ranges={
          ranges.minDate === 0 && ranges.maxDate === 0 ? undefined : ranges
        }
        rank={tokenInfo?.marketCapRank}
      />
    )
  }, [tokenInfo, prices, ranges, coingeckoId])

  const showLoading =
    !tokenId ||
    !tokenInfo ||
    // the token's swapability depends on the swap list
    // thus, we need to wait for the swap list to load
    // so that we can display the swap button accordingly
    !isSwapListLoaded

  if (showLoading) {
    return <LoadingState sx={styles.container} />
  }

  return (
    <ScrollScreen
      renderFooter={renderFooter}
      navigationTitle={tokenInfo?.symbol.toUpperCase() ?? ''}
      isModal
      renderHeaderRight={renderHeaderRight}>
      <View style={styles.chartContainer}>
        <Animated.View style={{ opacity: headerOpacity }}>
          {renderHeader()}
        </Animated.View>
        {isChartInteracting && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                alignItems: 'center',
                justifyContent: 'center',
                opacity: selectedDataIndicatorOpacity
              }
            ]}>
            <SelectedChartDataIndicator
              selectedData={selectedData}
              currentPrice={chartData?.[0]?.value}
            />
          </Animated.View>
        )}
      </View>
      <TokenDetailChart
        ranges={ranges}
        chartData={chartData}
        negative={ranges.diffValue < 0}
        onDataSelected={handleDataSelected}
        onGestureStart={handleChartGestureStart}
        onGestureEnd={handleChartGestureEnd}
      />
      <View sx={styles.lastUpdatedContainer}>
        {lastUpdatedDate && (
          <Animated.View
            style={{
              alignSelf: 'center',
              position: 'absolute',
              opacity: headerOpacity
            }}>
            <Text
              variant="caption"
              sx={{
                color: '$textSecondary'
              }}>
              Last updated:{' '}
              {format(lastUpdatedDate, 'E, MMM dd, yyyy, h:mm aa')}
            </Text>
          </Animated.View>
        )}
      </View>
      {tokenInfo?.has24hChartDataOnly === false && (
        <SegmentedControl
          type="thin"
          dynamicItemWidth={false}
          items={SEGMENT_ITEMS}
          style={styles.segmentedControl}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={handleSelectSegment}
        />
      )}
      <View sx={styles.aboutContainer}>
        {tokenInfo?.description && (
          <TouchableOpacity onPress={handlePressAbout}>
            <Card sx={styles.aboutCard}>
              <Text variant="heading4">About</Text>
              <Text
                variant="subtitle2"
                sx={{ color: '$textSecondary' }}
                numberOfLines={6}>
                {tokenInfo?.description}
              </Text>
            </Card>
          </TouchableOpacity>
        )}
        {marketData.length > 0 && (
          <GroupList
            data={marketData}
            valueSx={{
              maxWidth: MAX_VALUE_WIDTH
            }}
          />
        )}
        {metaData.length > 0 && (
          <GroupList
            data={metaData}
            valueSx={{
              maxWidth: MAX_VALUE_WIDTH
            }}
          />
        )}
      </View>
    </ScrollScreen>
  )
}

const SEGMENT_INDEX_MAP: Record<number, number> = {
  0: 1, // 24H
  1: 7, // 1W
  2: 30, // 1M
  3: 90, // 3M
  4: 365 // 1Y
}

const SEGMENT_ITEMS = ['24H', '1W', '1M', '3M', '1Y']

const styles = StyleSheet.create({
  container: { flex: 1 },
  aboutContainer: { paddingHorizontal: 16, marginTop: 25, gap: 20 },
  aboutCard: { alignItems: undefined, gap: 3 },
  segmentedControl: { marginHorizontal: 16 },
  scrollviewContent: { paddingBottom: 60 },
  chartContainer: { paddingHorizontal: 16, paddingBottom: 4 },
  lastUpdatedContainer: { paddingTop: 40, marginTop: 8 }
})

export default TrackTokenDetailScreen
