import React, { FC, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { Space } from 'components/Space'
import { WatchlistFilter } from 'screens/watchlist/WatchlistView'
import SparklineChart from 'components/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'

interface Props {
  tokenName: string
  value?: string
  tokenAddress: string
  image?: string
  symbol?: string
  onPress?: () => void
  rank?: number
  filterBy: WatchlistFilter
}

const WatchListItem: FC<Props> = ({
  tokenName,
  value = '0',
  image,
  symbol,
  onPress,
  rank,
  tokenAddress,
  filterBy
}) => {
  const { theme, repo, appHook } = useApplicationContext()
  const { getCharData } = repo.coingeckoRepo
  const { selectedCurrency } = appHook
  const [ranges, setRanges] = useState<{
    minDate: number
    maxDate: number
    minPrice: number
    maxPrice: number
    diffValue: number
    percentChange: number
  }>({
    minDate: 0,
    maxDate: 0,
    minPrice: 0,
    maxPrice: 0,
    diffValue: 0,
    percentChange: 0
  })
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>()
  const [isLoadingChartData, setIsLoadingChartData] = useState(true)

  // get coingecko chart data.
  useEffect(() => {
    if (tokenAddress) {
      ;(async () => {
        const result = await getCharData(tokenAddress, 1)
        if (result) {
          setChartData(result.dataPoints)
          setRanges(result.ranges)
        }
        setIsLoadingChartData(false)
      })()
    }
  }, [])

  const usdBalance = useMemo(() => {
    if (value) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isLoadingChartData ? (
            <ActivityIndicator
              style={{ alignSelf: 'center' }}
              color={theme.colorPrimary1}
            />
          ) : (
            <View style={{ position: 'absolute', left: -40, flex: 1 }}>
              <SparklineChart
                width={90}
                height={80}
                animated={false}
                data={chartData}
                yRange={[ranges.minPrice, ranges.maxPrice]}
                xRange={[ranges.minDate, ranges.maxDate]}
                negative={ranges.diffValue < 0}
              />
            </View>
          )}
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Row style={{ alignItems: 'flex-end' }}>
              <AvaText.Heading3 ellipsizeMode={'tail'}>
                {value}
              </AvaText.Heading3>
              <Space x={4} />
              <AvaText.Body3
                textStyle={{ color: theme.colorText2, lineHeight: 20 }}>
                {selectedCurrency.toUpperCase()}
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

    return null
  }, [isLoadingChartData, chartData, ranges])

  return (
    <AvaListItem.Base
      title={
        <AvaText.Heading2 ellipsizeMode={'tail'}>{symbol}</AvaText.Heading2>
      }
      titleAlignment={'flex-start'}
      subtitle={tokenName}
      embedInCard={false}
      leftComponent={
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
          <Avatar.Custom
            name={tokenName}
            symbol={symbol}
            logoUri={image}
            size={32}
          />
        </View>
      }
      rightComponent={usdBalance}
      onPress={onPress}
    />
  )
}

export default React.memo(WatchListItem)
