import React, { useEffect, useLayoutEffect, useState } from 'react'
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
import SparklineChart from 'components/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import { ViewOnceInformation } from 'Repo'
import TokenAddress from 'components/TokenAddress'
import AppNavigation from 'navigation/AppNavigation'
import { formatLargeCurrency, formatLargeNumber } from 'utils/Utils'
import { TokenSymbol } from 'store/network'
import { ActivityIndicator } from 'components/ActivityIndicator'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'

const WINDOW_WIDTH = Dimensions.get('window').width
const WINDOW_HEIGHT = Dimensions.get('window').height
const CHART_HEIGHT = WINDOW_HEIGHT * 0.18

type ScreenProps = WalletScreenProps<typeof AppNavigation.Wallet.TokenDetail>

const TokenDetail = () => {
  const { theme, appHook } = useApplicationContext()
  const { saveViewOnceInformation, infoHasBeenShown, viewOnceInfo } =
    useApplicationContext().repo.informationViewOnceRepo
  const { setOptions } = useNavigation<ScreenProps['navigation']>()
  const [showChartInstruction, setShowChartInstruction] = useState(false)
  const tokenId = useRoute<ScreenProps['route']>().params.tokenId
  const buyDisabled = useIsUIDisabled(UI.Buy)

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
        <Pressable style={{ paddingEnd: 8 }} onPress={handleFavorite}>
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
          <AvaText.Heading2 color={'white'}>
            No chart data available
          </AvaText.Heading2>
          <AvaText.Body3 color={'white'}>
            We are unable to retrieve chart data for this token at this time.
          </AvaText.Body3>
        </>
      )
    }

    // if we have data, and it's 1st time user seeing it, show instruction
    if (chartData && showChartInstruction) {
      content = (
        <>
          <AvaText.Heading2 color={'white'}>Hold and Drag</AvaText.Heading2>
          <AvaText.Body3
            color={'white'}
            textStyle={{ textAlignVertical: 'center' }}>
            Hold and drag over chart for precise price and date
          </AvaText.Body3>
          <AvaButton.PrimaryMedium
            onPress={() => setShowChartInstruction(!showChartInstruction)}>
            Got it
          </AvaButton.PrimaryMedium>
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
              backgroundColor: '#00000080',
              marginHorizontal: 32
            }
          ]}>
          {content}
        </View>
      )
    }

    return null
  }

  return (
    <ScrollView style={{ paddingHorizontal: 8, flex: 1 }}>
      <View>
        <AvaListItem.Base
          title={<AvaText.Heading1>{name}</AvaText.Heading1>}
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
          title={<AvaText.Body2>Price</AvaText.Body2>}
          titleAlignment={'flex-start'}
          subtitle={
            <Row style={{ alignItems: 'center' }}>
              <AvaText.Heading3 tokenInCurrency textStyle={{ marginEnd: 8 }}>
                {priceInCurrency}
              </AvaText.Heading3>
              <MarketMovement
                hideCurrencyCode
                priceChange={ranges.diffValue}
                percentChange={ranges.percentChange}
              />
            </Row>
          }
        />
        <Space y={8} />
        <View
          style={{
            height: CHART_HEIGHT,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
          <View>
            <AvaText.Caption
              tokenInCurrency
              textStyle={{
                alignSelf: 'flex-end',
                color: theme.colorText1,
                marginBottom: -10
              }}>
              {ranges.maxPrice}
            </AvaText.Caption>
            <SparklineChart
              interactive
              data={chartData ?? []}
              yRange={[ranges.minPrice, ranges.maxPrice]}
              xRange={[ranges.minDate, ranges.maxDate]}
              negative={ranges.diffValue < 0}
              width={WINDOW_WIDTH - 32} // padding
              height={CHART_HEIGHT}
            />
            <AvaText.Caption
              tokenInCurrency
              textStyle={{ alignSelf: 'flex-end', color: theme.colorText1 }}>
              {ranges.minPrice}
            </AvaText.Caption>
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
          <TabViewAva.Item title={'24H'} />
          <TabViewAva.Item title={'1W'} />
          <TabViewAva.Item title={'1M'} />
          <TabViewAva.Item title={'3M'} />
          <TabViewAva.Item title={'1Y'} />
        </TabViewAva>

        {/* Market Data & Rank */}
        <AvaListItem.Base
          title={<AvaText.Heading2>Market Data</AvaText.Heading2>}
          titleAlignment={'flex-start'}
          rightComponent={
            <OvalTagBg
              color={theme.neutral850}
              style={{ height: 21, paddingVertical: 0 }}>
              <AvaText.Body2
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
            title={'24h Volume'}
            value={formatMarketNumbers(marketVolume)}
          />
          <DataItem
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
            title={'Available Supply'}
            value={formatLargeNumber(marketCirculatingSupply)}
          />
          <DataItem
            title={'Twitter'}
            value={
              <AvaText.Heading3
                textStyle={{ color: '#0A84FF' }}
                onPress={openTwitter}>
                {twitterHandle ? `@${twitterHandle}` : ''}
              </AvaText.Heading3>
            }
          />
        </Row>
        <Row style={[styles.row, { paddingBottom: 16 }]}>
          <DataItem
            title={'Total Supply'}
            value={formatLargeNumber(marketTotalSupply)}
          />
        </Row>

        {symbol === TokenSymbol.AVAX && !buyDisabled && (
          <AvaButton.SecondaryLarge
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
  value
}: {
  title: string
  value: string | React.ReactNode
}) => {
  const { theme } = useApplicationContext()
  return (
    <View style={{ flex: 1 }}>
      <AvaText.Body2 textStyle={{ color: theme.colorText3 }}>
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
