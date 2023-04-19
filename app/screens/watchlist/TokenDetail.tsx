import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import TabViewAva from 'components/TabViewAva'
import { useNavigation, useRoute } from '@react-navigation/native'
import StarSVG from 'components/svg/StarSVG'
import { WalletScreenProps } from 'navigation/types'
import OvalTagBg from 'components/OvalTagBg'
import AvaButton from 'components/AvaButton'
import { useTokenDetail } from 'screens/watchlist/useTokenDetail'
import SparklineChart from 'components/SparklineChart/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import { ViewOnceInformation } from 'Repo'
import TokenAddress from 'components/TokenAddress'
import AppNavigation from 'navigation/AppNavigation'
import { formatLargeCurrency, formatLargeNumber } from 'utils/Utils'
import { TokenSymbol } from 'store/network'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useSharedValue } from 'react-native-reanimated'
import { ReText } from 'react-native-redash'
import { styles as AvaTextStyles } from 'components/AvaText'
import { format } from 'date-fns'

const WINDOW_WIDTH = Dimensions.get('window').width
const WINDOW_HEIGHT = Dimensions.get('window').height
const GOT_IT_BTN_WIDTH = WINDOW_WIDTH - 32
export const CHART_HEIGHT = WINDOW_HEIGHT * 0.45

type ScreenProps = WalletScreenProps<typeof AppNavigation.Wallet.TokenDetail>

const TokenDetail = () => {
  const { theme, appHook } = useApplicationContext()
  const { saveViewOnceInformation, infoHasBeenShown, viewOnceInfo } =
    useApplicationContext().repo.informationViewOnceRepo
  const { setOptions } = useNavigation<ScreenProps['navigation']>()
  const [showChartInstruction, setShowChartInstruction] = useState(false)
  const tokenId = useRoute<ScreenProps['route']>().params.tokenId
  const buyDisabled = useIsUIDisabled(UI.Buy)

  const { tokenInCurrencyFormatter } = useApplicationContext().appHook

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

  const resetPriceAndDate = useCallback(() => {
    const amountInCurrency = tokenInCurrencyFormatter(priceInCurrency ?? 0)
    animatedPrice.value = amountInCurrency
    animatedDate.value = 'Price'
  }, [animatedPrice, animatedDate, priceInCurrency, tokenInCurrencyFormatter])

  function openTwitter() {
    twitterHandle && openUrl(`https://twitter.com/${twitterHandle}`)
  }

  function openWebsite() {
    if (urlHostname) {
      openUrl('https://' + urlHostname)
    }
  }

  function formatMarketNumbers(value: number) {
    return value === 0
      ? ' -'
      : formatLargeCurrency(appHook.currencyFormatter(value), 1)
  }

  useEffect(() => {
    if (!infoHasBeenShown(ViewOnceInformation.CHART_INTERACTION)) {
      setShowChartInstruction(true)
      saveViewOnceInformation([
        ...viewOnceInfo,
        ViewOnceInformation.CHART_INTERACTION
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useLayoutEffect(() => {
    setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerRight: () => (
        <Pressable
          style={{ paddingEnd: 8 }}
          onPress={handleFavorite}
          testID="star_svg">
          <StarSVG selected={isFavorite} />
        </Pressable>
      )
    })
  }, [handleFavorite, isFavorite, setOptions])

  const getOverlayContent = () => {
    // loading chart data
    let content
    if (!chartData) {
      content = <ActivityIndicator />
    }

    // chart data is empty, could not be retrieved
    if (chartData && chartData.length === 0) {
      content = (
        <>
          <AvaText.Heading5>No Chart Data Available</AvaText.Heading5>
          <AvaText.Body2
            textStyle={{
              width: '70%',
              textAlign: 'center',
              marginTop: 10
            }}>
            We are unable to retrieve chart data for this token. Please check
            back later.
          </AvaText.Body2>
        </>
      )
    }

    // if we have data, and it's 1st time user seeing it, show instruction
    if (chartData && showChartInstruction) {
      content = (
        <>
          <AvaText.Heading5>Hold and Drag</AvaText.Heading5>
          <AvaText.Body2
            textStyle={{
              width: '50%',
              textAlign: 'center',
              marginTop: 10,
              marginBottom: 30
            }}>
            Hold and drag over chart for precise price and date
          </AvaText.Body2>
          <AvaButton.PrimaryLarge
            style={{ width: GOT_IT_BTN_WIDTH }}
            onPress={() => setShowChartInstruction(!showChartInstruction)}>
            Got it
          </AvaButton.PrimaryLarge>
        </>
      )
    }

    if (content) {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#00000080'
            }
          ]}>
          {content}
        </View>
      )
    }

    return null
  }

  return (
    <ScrollView style={{ flex: 1 }}>
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
        />
        <AvaListItem.Base
          title={
            <ReText
              text={animatedDate}
              style={[{ color: theme.neutral50 }, AvaTextStyles.body3]}
            />
          }
          titleAlignment={'flex-start'}
          testID="token_detail__price_title"
          subtitle={
            <ReText
              testID="token_detail__price"
              text={animatedPrice}
              style={[{ color: theme.neutral50 }, AvaTextStyles.heading4]}
            />
          }
        />
        <View style={{ marginLeft: 16 }}>
          <MarketMovement
            hideCurrencyCode
            priceChange={ranges.diffValue}
            percentChange={ranges.percentChange}
            testID="token_detail__price_movement"
          />
        </View>

        <Space y={8} />
        <View
          style={{
            height: CHART_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <View>
            <SparklineChart
              interactive
              data={chartData ?? []}
              yRange={[ranges.minPrice, ranges.maxPrice]}
              negative={ranges.diffValue < 0}
              width={WINDOW_WIDTH - 32} // padding
              height={CHART_HEIGHT}
              lineThickness={4}
              onPointSelected={updatePriceAndDate}
              onInteractionEnded={resetPriceAndDate}
            />
          </View>
          {getOverlayContent()}
        </View>
        <Space y={22} />
        {/* this will change once data component purpose and interaction is defined */}
        <TabViewAva
          renderCustomLabel={(title, selected, color) => (
            <AvaText.Heading3 textStyle={{ color }}>{title}</AvaText.Heading3>
          )}
          onTabIndexChange={index => {
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
          }}>
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
              style={{ height: 21, paddingVertical: 0 }}>
              <AvaText.Body2
                testID="token_detail__rank"
                textStyle={{
                  color: theme.colorText3
                }}>{`Rank: ${marketCapRank}`}</AvaText.Body2>
            </OvalTagBg>
          }
        />
        <Row
          style={[
            styles.row,
            { marginTop: -4, paddingTop: 0, paddingBottom: 8 }
          ]}>
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
                textStyle={{ color: '#0A84FF' }}
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
                textStyle={{ color: '#0A84FF' }}
                onPress={openTwitter}>
                {twitterHandle ? `@${twitterHandle}` : ''}
              </AvaText.Heading3>
            }
          />
        </Row>
        <Row style={[styles.row, { paddingBottom: 16 }]}>
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
            style={{ marginHorizontal: 16 }}>
            Buy {symbol}
          </AvaButton.SecondaryLarge>
        )}
      </View>
    </ScrollView>
  )
}

const DataItem = ({
  title,
  value,
  testID
}: {
  title: string
  value: string | React.ReactNode
  testID?: string
}) => {
  const { theme } = useApplicationContext()
  return (
    <View style={{ flex: 1 }}>
      <AvaText.Body2 textStyle={{ color: theme.colorText3 }} testID={testID}>
        {title}
      </AvaText.Body2>
      {typeof value === 'string' ? (
        <AvaText.Heading3>{value}</AvaText.Heading3>
      ) : (
        value
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8
  }
})

export default TokenDetail
