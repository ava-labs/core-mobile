import React, { FC } from 'react'
import { Dimensions, Pressable, View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import Avatar from 'components/Avatar'
import { Space } from 'components/Space'
import { WatchlistFilter } from 'screens/watchlist/types'
import SparklineChart from 'components/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'

import { MarketToken } from 'store/watchlist'
import { ChartData } from 'services/token/types'
import DragHandleSVG from 'components/svg/DragHandleSVG'

const deviceWidth = Dimensions.get('window').width

interface Props {
  token: MarketToken
  chartData: ChartData
  value?: string
  onPress?: () => void
  onDragPress?: () => void
  rank?: number
  filterBy: WatchlistFilter
  testID?: string
}

const WatchListItem: FC<Props> = ({
  token,
  chartData,
  value = '0',
  onPress,
  onDragPress,
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
      rightComponentMaxWidth={deviceWidth * 0.6}
      leftComponent={
        <LeftComponent token={token} rank={rank} testID={testID} />
      }
      rightComponent={
        <RightComponent
          token={token}
          chartData={chartData}
          value={value}
          filterBy={filterBy}
          onPress={onPress}
          testID={testID}
          onDragPress={onDragPress}
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

const LeftComponent = ({ token, rank, testID }: LeftComponentProps) => {
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
  testID?: string
  onPress?: () => void
  onDragPress?: () => void
}

const RightComponent = ({
  chartData,
  value,
  filterBy,
  onPress,
  onDragPress
}: RightComponentProps) => {
  const { theme, appHook } = useApplicationContext()
  const { selectedCurrency } = appHook
  const { dataPoints, ranges } = chartData

  const renderMiddleComponent = () => {
    if (dataPoints.length === 0) return null

    return (
      <MiddleComponent
        dataPoints={dataPoints}
        ranges={ranges}
        onPress={onPress}
      />
    )
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
          priceChange={ranges.diffValue}
          percentChange={ranges.percentChange}
          filterBy={filterBy}
        />
      </View>
      {onDragPress && (
        <>
          <Pressable
            onTouchStart={onDragPress}
            style={{
              padding: 16,
              marginRight: -16
            }}>
            <DragHandleSVG />
          </Pressable>
        </>
      )}
    </Row>
  )
}

type MiddleComponentProps = {
  dataPoints: ChartData['dataPoints']
  ranges: ChartData['ranges']
  testID?: string
  onPress?: () => void
}

const MiddleComponent = ({
  dataPoints,
  ranges,
  onPress,
  testID
}: MiddleComponentProps) => {
  return (
    <View
      style={{
        width: 90,
        alignItems: 'flex-end'
      }}>
      <SparklineChart
        width={90}
        height={80}
        animated={false}
        data={dataPoints}
        onPress={onPress}
        yRange={[ranges.minPrice, ranges.maxPrice]}
        xRange={[ranges.minDate, ranges.maxDate]}
        negative={ranges.diffValue < 0}
        testID={testID}
      />
    </View>
  )
}

export default React.memo(WatchListItem)
