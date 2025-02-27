import React, { FC } from 'react'
import { Dimensions, View } from 'react-native'
import { Button } from '@avalabs/k2-mobile'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { Space } from 'components/Space'
import SparklineChart from 'components/SparklineChart/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import { MarketToken } from 'store/watchlist'
import { ChartData } from 'services/token/types'
import { WatchListType } from '../types'

const DEVICE_WIDTH = Dimensions.get('window').width
const RIGHT_COMPONENT_MAX_WIDTH = DEVICE_WIDTH * 0.6
const RIGHT_COMPONENT_MAX_WIDTH_FOR_TRENDING = DEVICE_WIDTH * 0.55
const CHART_WIDTH = DEVICE_WIDTH * 0.2

interface Props {
  index: number
  type: WatchListType
  token: MarketToken
  chartData: ChartData
  value?: string
  onPress?: () => void
  testID?: string
}

const WatchListItem: FC<Props> = ({
  index,
  type,
  token,
  chartData,
  value = '0',
  onPress,
  testID
}) => {
  const { symbol, name } = token

  if (type === WatchListType.TRENDING) {
    return (
      <AvaListItem.Base
        title={
          <AvaText.Heading2 ellipsizeMode={'tail'}>
            {`${index + 1}. ${symbol.toUpperCase()}`}
          </AvaText.Heading2>
        }
        testID={testID}
        titleAlignment={'flex-start'}
        subtitle={name}
        embedInCard={false}
        rightComponentMaxWidth={RIGHT_COMPONENT_MAX_WIDTH_FOR_TRENDING}
        leftComponent={<TokenLogo token={token} testID={testID} />}
        rightComponent={<PriceAndBuyButton token={token} value={value} />}
        onPress={onPress}
      />
    )
  }

  return (
    <AvaListItem.Base
      title={
        <AvaText.Heading2 ellipsizeMode={'tail'}>
          {symbol.toUpperCase()}
        </AvaText.Heading2>
      }
      testID={testID}
      titleAlignment={'flex-start'}
      subtitle={name}
      embedInCard={false}
      rightComponentMaxWidth={RIGHT_COMPONENT_MAX_WIDTH}
      leftComponent={<TokenLogo token={token} testID={testID} />}
      rightComponent={
        <ChartAndPrice token={token} chartData={chartData} value={value} />
      }
      onPress={onPress}
    />
  )
}

type TokenLogoProps = {
  token: MarketToken
  testID?: string
}

const TokenLogo = ({ token, testID }: TokenLogoProps): JSX.Element => {
  const { logoUri, symbol, name } = token
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      <Avatar.Token
        name={name}
        symbol={symbol}
        logoUri={logoUri}
        size={32}
        testID={`${name}`}
        backgroundColor={'white'}
        showBorder
      />
    </View>
  )
}

type ChartAndPriceProps = {
  token: MarketToken
  chartData: ChartData
  value?: string
}

const ChartAndPrice = ({
  token,
  chartData,
  value
}: ChartAndPriceProps): JSX.Element | null => {
  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency } = appHook
  const { dataPoints, ranges } = chartData

  const renderChart = (): JSX.Element | null => {
    // If there are less than 2 data points, don't render the sparkline
    if (dataPoints.length < 2) return null

    return <Chart dataPoints={dataPoints} ranges={ranges} />
  }

  if (!value) return null

  return (
    <Row style={{ alignItems: 'center' }}>
      {renderChart()}
      <View
        style={{
          alignItems: 'flex-end',
          flex: 1
        }}>
        <Row style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading3 testID="watchlist_price" ellipsizeMode={'tail'}>
            {value.replace(selectedCurrency, '')}
          </AvaText.Heading3>
          <Space x={4} />
          <AvaText.Body3
            textStyle={{ color: theme.colorText2, lineHeight: 22 }}>
            {selectedCurrency}
          </AvaText.Body3>
        </Row>
        <MarketMovement
          hideCurrencyCode
          priceChange={token.priceChange24h ?? 0}
          percentChange={token.priceChangePercentage24h ?? 0}
          testID={`price_movement_change__${token.symbol}`}
        />
      </View>
    </Row>
  )
}

type ChartProps = {
  dataPoints: ChartData['dataPoints']
  ranges: ChartData['ranges']
}

const Chart = ({ dataPoints, ranges }: ChartProps): JSX.Element => {
  return (
    <View
      style={{
        width: 90,
        alignItems: 'flex-end'
      }}>
      <SparklineChart
        width={CHART_WIDTH}
        height={30}
        interactive={false}
        lineThickness={3}
        data={dataPoints}
        negative={ranges.diffValue < 0}
      />
    </View>
  )
}

type PriceAndBuyButtonProps = {
  token: MarketToken
  value?: string
}

const PriceAndBuyButton = ({
  token,
  value
}: PriceAndBuyButtonProps): JSX.Element | null => {
  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency } = appHook

  if (!value) return null

  return (
    <Row style={{ alignItems: 'center' }}>
      <View
        style={{
          alignItems: 'flex-end',
          flex: 1
        }}>
        <Row style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading3 testID="watchlist_price" ellipsizeMode={'tail'}>
            {value.replace(selectedCurrency, '')}
          </AvaText.Heading3>
          <Space x={4} />
          <AvaText.Body3
            textStyle={{ color: theme.colorText2, lineHeight: 22 }}>
            {selectedCurrency}
          </AvaText.Body3>
        </Row>
        <MarketMovement
          hideCurrencyCode
          priceChange={token.priceChange24h ?? 0}
          percentChange={token.priceChangePercentage24h ?? 0}
          testID={`price_movement_change__${token.symbol}`}
        />
      </View>
      <View style={{ marginLeft: 16 }}>
        <Button
          type={'secondary'}
          size={'small'}
          style={{ paddingVertical: 6 }}>
          Buy
        </Button>
      </View>
    </Row>
  )
}

export default React.memo(WatchListItem)
