import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import { useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import OvalTagBg from 'components/OvalTagBg'
import AvaButton from 'components/AvaButton'
import { useTokenDetail } from 'screens/watchlist/useTokenDetail'
import SparklineChart from 'components/SparklineChart/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import {
  ViewOnceInformationKey,
  useViewOnceInformation
} from 'store/viewOnceInformation'
import TokenAddress from 'components/TokenAddress'
import AppNavigation from 'navigation/AppNavigation'
import { formatLargeCurrency, formatLargeNumber } from 'utils/Utils'
import { TokenSymbol } from 'store/network'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useSharedValue } from 'react-native-reanimated'
import { styles as AvaTextStyles } from 'components/AvaText'
import { format } from 'date-fns'
import { StarButton } from 'components/StarButton'
import { AnimatedText } from 'components/AnimatedText'
import Delay from 'components/Delay'
import { DataItem } from './DataItem'
import { Overlay } from './Overlay'

const WINDOW_WIDTH = Dimensions.get('window').width
const WINDOW_HEIGHT = Dimensions.get('window').height
export const CHART_HEIGHT = WINDOW_HEIGHT * 0.45
const CHART_WIDTH = WINDOW_WIDTH - 32
const CHART_THICKNESS = 4

type ScreenProps = WalletScreenProps<typeof AppNavigation.Wallet.TokenDetail>

const TokenDetail = () => {
  const {
    theme,
    appHook: { tokenInCurrencyFormatter, currencyFormatter }
  } = useApplicationContext()
  const { saveViewOnceInformation, infoHasBeenShown } = useViewOnceInformation()
  const [showChartInstruction, setShowChartInstruction] = useState(false)
  const tokenId = useRoute<ScreenProps['route']>().params.tokenId
  const buyDisabled = useIsUIDisabled(UI.Buy)

  const animatedDate = useSharedValue('Price')
  const animatedPrice = useSharedValue('')

  const updatePriceAndDate = useCallback(
    p => {
      const amountInCurrency = tokenInCurrencyFormatter(p.value)
      animatedPrice.value = amountInCurrency
      animatedDate.value = format(p.date, 'E, MMM dd, yyyy, H:mm aa')
    },
    [animatedPrice, animatedDate, tokenInCurrencyFormatter]
  )

  const hyperLinkStyle = { color: theme.colorPrimary1 }

  const {
    isFavorite,
    openMoonPay,
    openUrl,
    urlHostname,
    handleFavorite,
    marketTotalSupply,
    twitterHandle,
    marketCirculatingSupply,
    marketVolume,
    marketCapRank,
    marketCap,
    chartData,
    ranges,
    symbol,
    name,
    logoUri,
    priceInCurrency,
    contractAddress,
    changeChartDays
  } = useTokenDetail(tokenId)

  const yRange: [number, number] = [ranges.minPrice, ranges.maxPrice]

  const resetPriceAndDate = useCallback(() => {
    const amountInCurrency = tokenInCurrencyFormatter(priceInCurrency ?? 0)
    animatedPrice.value = amountInCurrency
    animatedDate.value = 'Price'
  }, [animatedPrice, animatedDate, priceInCurrency, tokenInCurrencyFormatter])

  const openTwitter = () => {
    twitterHandle && openUrl(`https://twitter.com/${twitterHandle}`)
  }

  const openWebsite = () => {
    if (urlHostname) {
      openUrl('https://' + urlHostname)
    }
  }

  const formatMarketNumbers = useCallback(
    (value: number) => {
      return value === 0
        ? ' -'
        : formatLargeCurrency(currencyFormatter(value), 1)
    },
    [currencyFormatter]
  )

  useEffect(() => {
    if (!infoHasBeenShown(ViewOnceInformationKey.CHART_INTERACTION)) {
      setShowChartInstruction(true)
      saveViewOnceInformation(ViewOnceInformationKey.CHART_INTERACTION)
    }
  }, [infoHasBeenShown, saveViewOnceInformation])

  const onTabChanged = useCallback(
    (index: number) => {
      changeChartDays(
        index === 0
          ? 1 // one day
          : index === 1
          ? 7 // seven days - 1 week
          : index === 2
          ? 30 // 30 days - 1 month
          : index === 3
          ? 90 // 90 days - 3 months
          : 365 // 365 days - 1 year
      )
    },
    [changeChartDays]
  )

  const onInstructionRead = () => setShowChartInstruction(false)

  const AnimatedDate = useMemo(
    () => (
      <AnimatedText
        text={animatedDate}
        style={[{ color: theme.neutral50 }, AvaTextStyles.body3]}
      />
    ),
    [animatedDate, theme.neutral50]
  )

  const AnimatedPrice = useMemo(
    () => (
      <AnimatedText
        testID="token_detail__price"
        text={animatedPrice}
        style={[
          {
            color: theme.neutral50
          },
          AvaTextStyles.heading4
        ]}
      />
    ),
    [animatedPrice, theme.neutral50]
  )

  return (
    <ScrollView style={styles.container}>
      <View>
        <AvaListItem.Base
          title={<AvaText.Heading5>{name}</AvaText.Heading5>}
          titleAlignment={'flex-start'}
          subtitle={symbol}
          leftComponent={
            name &&
            symbol && (
              <Avatar.Token
                name={name}
                symbol={symbol}
                logoUri={logoUri}
                size={48}
              />
            )
          }
          rightComponent={
            <StarButton onPress={handleFavorite} selected={isFavorite} />
          }
        />

        <AvaListItem.Base
          title={AnimatedDate}
          titleAlignment={'flex-start'}
          testID="token_detail__price_title"
          subtitle={AnimatedPrice}
        />
        <View style={styles.marketMovement}>
          <MarketMovement
            hideCurrencyCode
            priceChange={ranges.diffValue}
            percentChange={ranges.percentChange}
            testID="token_detail__price_movement"
          />
        </View>

        <View style={styles.chartContainer}>
          <View>
            <Delay>
              <SparklineChart
                interactive
                data={chartData ?? []}
                yRange={yRange}
                negative={ranges.diffValue < 0}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                lineThickness={CHART_THICKNESS}
                onPointSelected={updatePriceAndDate}
                onInteractionEnded={resetPriceAndDate}
              />
            </Delay>
          </View>
          <Overlay
            chartData={chartData}
            shouldShowInstruction={showChartInstruction}
            onInstructionRead={onInstructionRead}
          />
        </View>
        {/* this will change once data component purpose and interaction is defined */}
        <TabViewAva
          renderCustomLabel={(title, selected, color) => (
            <AvaText.Heading3 textStyle={{ color }}>{title}</AvaText.Heading3>
          )}
          onTabIndexChange={onTabChanged}>
          <TabViewAva.Item title={'24H'} testID="token_detail__24H" />
          <TabViewAva.Item title={'1W'} testID="token_detail__1W" />
          <TabViewAva.Item title={'1M'} testID="token_detail__1M" />
          <TabViewAva.Item title={'3M'} testID="token_detail__3M" />
          <TabViewAva.Item title={'1Y'} testID="token_detail__1Y" />
        </TabViewAva>

        {/* Market Data & Rank */}
        <AvaListItem.Base
          title={
            <AvaText.Heading2 testID="token_detail__market_data_title">
              Market Data
            </AvaText.Heading2>
          }
          titleAlignment={'flex-start'}
          rightComponent={
            <OvalTagBg
              testID="token_detail__rank_icon"
              color={theme.neutral850}
              style={styles.rank}>
              <AvaText.Body2
                testID="token_detail__rank"
                textStyle={{
                  color: theme.colorText3
                }}>{`Rank: ${marketCapRank}`}</AvaText.Body2>
            </OvalTagBg>
          }
        />
        <Row style={styles.marketCap}>
          <DataItem
            title={'MarketCap'}
            value={formatMarketNumbers(marketCap)}
            testID={'token_detail__market_cap'}
          />
          {contractAddress && (
            <DataItem
              title={'Contract Address'}
              value={
                <TokenAddress address={contractAddress} textType={'Heading'} />
              }
            />
          )}
        </Row>
        <Row style={styles.row}>
          <DataItem
            testID="token_detail__24h_volume"
            title={'24h Volume'}
            value={formatMarketNumbers(marketVolume)}
          />
          <DataItem
            testID={'token_detail__website'}
            title={'Website'}
            value={
              <AvaText.Heading3
                textStyle={hyperLinkStyle}
                onPress={openWebsite}>
                {urlHostname}
              </AvaText.Heading3>
            }
          />
        </Row>
        <Row style={styles.row}>
          <DataItem
            testID={'token_detail__available_supply'}
            title={'Available Supply'}
            value={formatLargeNumber(marketCirculatingSupply)}
          />
          <DataItem
            testID="token_detail__twitter"
            title={'Twitter'}
            value={
              <AvaText.Heading3
                testID={'token_detail__twitter_handle'}
                textStyle={hyperLinkStyle}
                onPress={openTwitter}>
                {twitterHandle ? `@${twitterHandle}` : ''}
              </AvaText.Heading3>
            }
          />
        </Row>
        <Row style={styles.totalSupply}>
          <DataItem
            testID={'token_detail__total_supply'}
            title={'Total Supply'}
            value={formatLargeNumber(marketTotalSupply)}
          />
        </Row>

        {symbol === TokenSymbol.AVAX && !buyDisabled && (
          <AvaButton.SecondaryLarge
            testID="token_detail__buy_button"
            onPress={openMoonPay}
            style={styles.buyBtn}>
            Buy {symbol}
          </AvaButton.SecondaryLarge>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  buyBtn: { marginHorizontal: 16 },
  totalSupply: { paddingHorizontal: 16, paddingVertical: 8, paddingBottom: 16 },
  marketCap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: -4,
    paddingTop: 0,
    paddingBottom: 8
  },
  rank: { height: 21, paddingVertical: 0 },
  chartContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center'
  },
  marketMovement: { marginLeft: 16 }
})

export default TokenDetail
