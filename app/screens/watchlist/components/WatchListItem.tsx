import React, { FC, useEffect, useRef, useState } from 'react'
import { View, Dimensions } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { Space } from 'components/Space'
import { WatchlistFilter } from 'screens/watchlist/types'
import SparklineChart from 'components/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import TokenService from 'services/token/TokenService'
import { TokenType, TokenWithBalance } from 'store/balance'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { selectActiveNetwork } from 'store/network'
import { useSelector } from 'react-redux'
import { ActivityIndicator } from 'components/ActivityIndicator'

const deviceWidth = Dimensions.get('window').width

interface Props {
  token: TokenWithBalance
  chartDays: number
  value?: string
  onPress?: () => void
  rank?: number
  filterBy: WatchlistFilter
}

const WatchListItem: FC<Props> = ({
  token,
  chartDays,
  value = '0',
  onPress,
  rank,
  filterBy
}) => {
  const { symbol, name } = token

  return (
    <AvaListItem.Base
      title={
        <AvaText.Heading2 ellipsizeMode={'tail'}>{symbol}</AvaText.Heading2>
      }
      titleAlignment={'flex-start'}
      subtitle={name}
      embedInCard={false}
      rightComponentMaxWidth={deviceWidth * 0.55}
      leftComponent={<LeftComponent token={token} rank={rank} />}
      rightComponent={
        <RightComponent
          token={token}
          chartDays={chartDays}
          value={value}
          filterBy={filterBy}
        />
      }
      onPress={onPress}
    />
  )
}

type LeftComponentProps = {
  token: TokenWithBalance
  rank?: number
}

const LeftComponent = ({ token, rank }: LeftComponentProps) => {
  const { logoUri, symbol, name } = token

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      {rank && (
        <>
          <AvaText.Heading3>{rank}</AvaText.Heading3>
          <Space x={9} />
        </>
      )}
      <Avatar.Custom name={name} symbol={symbol} logoUri={logoUri} size={32} />
    </View>
  )
}

type RightComponentProps = {
  token: TokenWithBalance
  chartDays: number
  value?: string
  filterBy: WatchlistFilter
}

type ChartData = { x: number; y: number }[]

type Ranges = {
  minDate: number
  maxDate: number
  minPrice: number
  maxPrice: number
  diffValue: number
  percentChange: number
}

const initialRanges = {
  minDate: 0,
  maxDate: 0,
  minPrice: 0,
  maxPrice: 0,
  diffValue: 0,
  percentChange: 0
}

const emptyArr: ChartData = []

const RightComponent = ({
  token,
  chartDays,
  value,
  filterBy
}: RightComponentProps) => {
  const lastItemId = useRef(token.id)
  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency } = appHook
  const network = useSelector(selectActiveNetwork)
  const [ranges, setRanges] = useState<Ranges>(initialRanges)
  const [chartData, setChartData] = useState<ChartData>(emptyArr)
  const [isLoadingChartData, setIsLoadingChartData] = useState(false)
  const assetPlatformId =
    network.pricingProviders?.coingecko.assetPlatformId ?? ''
  const currency = selectedCurrency.toLowerCase() as VsCurrencyType

  // need to reset chart data whenever token changes
  // or else tokens will show wrong charts as the user scrolls up/down
  // this is a limitation of flashlist
  // more info here
  // https://github.com/Shopify/flash-list/pull/529
  if (token.id !== lastItemId.current) {
    lastItemId.current = token.id
    setRanges(initialRanges)
    setChartData(emptyArr)
    setIsLoadingChartData(false)
  }

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoadingChartData(true)

      let result
      if (token.type === TokenType.NATIVE) {
        result = await TokenService.getChartDataForCoinId({
          coingeckoId: token.coingeckoId,
          days: chartDays,
          currency
        })
      } else if (token.type === TokenType.ERC20) {
        result = await TokenService.getChartDataForAddress({
          assetPlatformId,
          address: token.address,
          days: chartDays,
          currency
        })
      }

      // only set data if token has not changed
      if (result && token.id === lastItemId.current) {
        setChartData(result.dataPoints)
        setRanges(result.ranges)
      }

      setIsLoadingChartData(false)
    }

    fetchChartData()
  }, [assetPlatformId, chartDays, currency, token])

  if (!value) return null

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MiddleComponent
        chartData={chartData}
        ranges={ranges}
        isLoadingChartData={isLoadingChartData}
      />
      <View
        style={{
          alignItems: 'flex-end',
          flex: 1
        }}>
        <Row style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading3 ellipsizeMode={'tail'}>{value}</AvaText.Heading3>
          <Space x={4} />
          <AvaText.Body3
            textStyle={{ color: theme.colorText2, lineHeight: 22 }}>
            {selectedCurrency}
          </AvaText.Body3>
        </Row>
        <MarketMovement
          priceChange={ranges.diffValue}
          percentChange={ranges.percentChange}
          filterBy={filterBy}
        />
      </View>
    </View>
  )
}

type MiddleComponentProps = {
  chartData: ChartData
  ranges: Ranges
  isLoadingChartData: boolean
}

const MiddleComponent = ({
  chartData,
  ranges,
  isLoadingChartData
}: MiddleComponentProps) => {
  return (
    <View
      style={{
        width: 90,
        alignItems: 'flex-end'
      }}>
      {isLoadingChartData ? (
        <ActivityIndicator style={{ alignSelf: 'center' }} />
      ) : (
        <SparklineChart
          width={90}
          height={80}
          animated={false}
          data={chartData}
          yRange={[ranges.minPrice, ranges.maxPrice]}
          xRange={[ranges.minDate, ranges.maxDate]}
          negative={ranges.diffValue < 0}
        />
      )}
    </View>
  )
}

export default React.memo(WatchListItem)
