import React, { FC } from 'react'
import { Dimensions, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { Space } from 'components/Space'
import { WatchlistFilter } from 'screens/watchlist/types'
import SparklineChart from 'components/SparklineChart/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import { MarketToken } from 'store/watchlist'
import { ChartData } from 'services/token/types'

const DEVICE_WIDTH = Dimensions.get('window').width
const RIGHT_COMPONENT_MAX_WIDTH = DEVICE_WIDTH * 0.6
const CHART_WIDTH = DEVICE_WIDTH * 0.2

interface Props {
  token: MarketToken
  chartData: ChartData
  value?: string
  onPress?: () => void
  rank?: number
  filterBy: WatchlistFilter
  testID?: string
}

const WatchListItem: FC<Props> = ({
  token,
  chartData,
  value = '0',
  onPress,
  rank,
  filterBy,
  testID
}) => {
  const { symbol, name } = token

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
      leftComponent={
        <LeftComponent token={token} rank={rank} testID={testID} />
      }
      rightComponent={
        <RightComponent
          token={token}
          chartData={chartData}
          value={value}
          filterBy={filterBy}
        />
      }
      onPress={onPress}
    />
  )
}

type LeftComponentProps = {
  token: MarketToken
  rank?: number
  testID?: string
}

const LeftComponent = ({
  token,
  rank,
  testID
}: LeftComponentProps): JSX.Element => {
  const { logoUri, symbol, name } = token
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
      {rank && (
        <>
          <AvaText.Heading3 testID={testID}>{rank}</AvaText.Heading3>
          <Space x={9} />
        </>
      )}
      <Avatar.Custom
        name={name}
        symbol={symbol}
        logoUri={logoUri}
        size={32}
        testID={`${name}`}
      />
    </View>
  )
}

type RightComponentProps = {
  token: MarketToken
  chartData: ChartData
  value?: string
  filterBy: WatchlistFilter
}

const RightComponent = ({
  token,
  chartData,
  value,
  filterBy
}: RightComponentProps): JSX.Element | null => {
  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency } = appHook
  const { dataPoints, ranges } = chartData

  const renderMiddleComponent = (): JSX.Element | null => {
    if (dataPoints.length === 0) return null

    return <MiddleComponent dataPoints={dataPoints} ranges={ranges} />
  }

  if (!value) return null

  return (
    <Row style={{ alignItems: 'center' }}>
      {renderMiddleComponent()}
      <View
        style={{
          alignItems: 'flex-end',
          flex: 1
        }}>
        <Row style={{ alignItems: 'flex-end' }}>
          <AvaText.Heading3 ellipsizeMode={'tail'}>
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
          filterBy={filterBy}
        />
      </View>
    </Row>
  )
}

type MiddleComponentProps = {
  dataPoints: ChartData['dataPoints']
  ranges: ChartData['ranges']
}

const MiddleComponent = ({
  dataPoints,
  ranges
}: MiddleComponentProps): JSX.Element => {
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

export default React.memo(WatchListItem)
