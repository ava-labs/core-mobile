import {
  Card,
  GroupList,
  GroupListItem,
  Icons,
  NavigationTitleHeader,
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
import { useNavigation } from '@react-navigation/native'
import { TokenDetailChart } from 'features/track/components/TokenDetailChart'
import { TokenHeader } from 'features/track/components/TokenHeader'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Animated, {
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useTokenDetails } from 'screens/watchlist/useTokenDetails'
import { formatLargeCurrency } from 'utils/Utils'
import { format } from 'date-fns'
import { LayoutRectangle, StyleSheet } from 'react-native'
import { SelectedChartDataIndicator } from 'features/track/components/SelectedChartDataIndicator'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { getDomainFromUrl } from 'utils/getDomainFromUrl/getDomainFromUrl'
import { isPositiveNumber } from 'utils/isPositiveNumber/isPositiveNumber'
import { copyToClipboard } from 'common/utils/clipboard'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent } from 'react-native'
import { ShareBarButton } from 'common/components/ShareBarButton'
import { FavoriteBarButton } from 'common/components/FavoriteBarButton'
import { TokenDetailFooter } from 'features/track/components/TokenDetailFooter'
import { ScrollView } from 'react-native-gesture-handler'

const TrackTokenDetailScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { tokenId } = useLocalSearchParams<{ tokenId: string }>()
  const [isChartInteracting, setIsChartInteracting] = useState(false)
  const navigation = useNavigation()
  const { navigate } = useRouter()
  const headerOpacity = useSharedValue(1)
  const selectedDataIndicatorOpacity = useDerivedValue(
    () => 1 - headerOpacity.value
  )
  const [selectedData, setSelectedData] = useState<{
    value: number
    date: Date
  }>()
  const { formatCurrency } = useFormatCurrency()
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const {
    chartData,
    ranges,
    changeChartDays,
    tokenInfo,
    isFavorite,
    handleFavorite,
    openUrl
  } = useTokenDetails(tokenId ?? '')

  const selectedSegmentIndex = useSharedValue(0)

  const header = useMemo(
    () => (
      <NavigationTitleHeader title={tokenInfo?.symbol.toUpperCase() ?? ''} />
    ),
    [tokenInfo?.symbol]
  )

  const scrollViewProps = useFadingHeaderNavigation({
    header,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })
  const lastUpdatedDate = chartData?.[chartData.length - 1]?.date

  const formatMarketNumbers = useCallback(
    (value: number) => {
      return value === 0 ? ' -' : formatLargeCurrency(formatCurrency(value))
    },
    [formatCurrency]
  )

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }, [])

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
    tokenInfo?.twitterHandle &&
      openUrl(`https://x.com/${tokenInfo.twitterHandle}`)
  }, [openUrl, tokenInfo?.twitterHandle])

  const handlePressWebsite = useCallback(() => {
    tokenInfo?.urlHostname && openUrl(tokenInfo.urlHostname)
  }, [openUrl, tokenInfo?.urlHostname])

  const handleBuy = useCallback((): void => {
    // navigate(AppNavigation.Wallet.Buy, {
    //   screen: AppNavigation.Buy.Buy,
    //   params: { showAvaxWarning: true }
    // })
  }, [])

  const handleStake = useCallback((): void => {
    // @ts-ignore
    // navigate(AppNavigation.Wallet.Earn, {
    //   screen: AppNavigation.Earn.StakeSetup
    // })
  }, [])

  const handleSwap = useCallback((_?: string): void => {
    // navigate(AppNavigation.Wallet.Swap, {
    //   screen: AppNavigation.Swap.Swap,
    //   params: {
    //     initialTokenIdFrom: AVAX_TOKEN_ID,
    //     initialTokenIdTo
    //   }
    // })
  }, [])

  const handleShare = useCallback(() => {
    navigate({ pathname: '/trackTokenDetail/share', params: { tokenId } })
  }, [navigate, tokenId])

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
            {tokenInfo.contractAddress}
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
    return (
      <View
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginTop: 14,
          marginRight: 18,
          alignItems: 'center'
        }}>
        <FavoriteBarButton isFavorite={isFavorite} onPress={handleFavorite} />
        <ShareBarButton onPress={handleShare} />
      </View>
    )
  }, [isFavorite, handleFavorite, handleShare])

  useEffect(() => {
    headerOpacity.value = withTiming(isChartInteracting ? 0 : 1, {
      duration: 300
    })
  }, [isChartInteracting, headerOpacity])

  useEffect(() => {
    navigation.setOptions({
      headerRight: renderHeaderRight
    })
  }, [renderHeaderRight, navigation])

  if (!tokenId || !tokenInfo) {
    return <LoadingState sx={styles.container} />
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.scrollviewContent}
        {...scrollViewProps}>
        <View style={styles.chartContainer}>
          <Animated.View
            style={{ opacity: headerOpacity }}
            onLayout={handleHeaderLayout}>
            <TokenHeader
              logoUri={tokenInfo.logoUri}
              symbol={tokenInfo.symbol ?? ''}
              currentPrice={tokenInfo.currentPrice}
              ranges={
                ranges.minDate === 0 && ranges.maxDate === 0
                  ? undefined
                  : ranges
              }
              rank={tokenInfo?.marketCapRank}
            />
          </Animated.View>
          {isChartInteracting && (
            <>
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
            </>
          )}
        </View>
        <TokenDetailChart
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
        <SegmentedControl
          type="thin"
          dynamicItemWidth={false}
          items={SEGMENT_ITEMS}
          style={styles.segmentedControl}
          selectedSegmentIndex={selectedSegmentIndex}
          onSelectSegment={handleSelectSegment}
        />
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
          {marketData.length > 0 && <GroupList data={marketData} />}
          {metaData.length > 0 && <GroupList data={metaData} />}
        </View>
      </ScrollView>
      <TokenDetailFooter
        tokenId={tokenId}
        tokenInfo={tokenInfo}
        onBuy={handleBuy}
        onStake={handleStake}
        onSwap={handleSwap}
      />
    </View>
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
