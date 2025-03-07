import React, { FC } from 'react'
import { Dimensions, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Button, Text } from '@avalabs/k2-mobile'
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
import AppNavigation from 'navigation/AppNavigation'
import { TabsScreenProps } from 'navigation/types'
import { useFocusedSelector } from 'utils/performance/useFocusedSelector'
import { selectBalanceTotalInCurrencyForAccount } from 'store/balance/slice'
import { selectTokenVisibility } from 'store/portfolio/slice'
import { selectActiveAccount } from 'store/account/slice'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency/slice'
import { AVAX_TOKEN_ID } from 'consts/swap'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { WatchListType } from '../types'

const DEVICE_WIDTH = Dimensions.get('window').width
const RIGHT_COMPONENT_MAX_WIDTH = DEVICE_WIDTH * 0.6
const RIGHT_COMPONENT_MAX_WIDTH_FOR_TRENDING = DEVICE_WIDTH * 0.53
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

type NavigationProp = TabsScreenProps<
  typeof AppNavigation.Tabs.Watchlist
>['navigation']

const WatchListItem: FC<Props> = ({
  index,
  type,
  token,
  chartData,
  value = '0',
  onPress,
  testID
}) => {
  const { navigate } = useNavigation<NavigationProp>()
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const activeAccount = useFocusedSelector(selectActiveAccount)
  const tokenVisibility = useFocusedSelector(selectTokenVisibility)
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const balanceTotalInCurrency = useFocusedSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.index ?? 0,
      tokenVisibility
    )
  )

  const { symbol, name, id } = token

  if (type === WatchListType.TRENDING) {
    const isZeroBalance = balanceTotalInCurrency === 0

    const handleBuyPressed = (): void => {
      if (isZeroBalance || swapDisabled) {
        navigate(AppNavigation.Wallet.Buy, {
          screen: AppNavigation.Buy.Buy,
          params: { showAvaxWarning: true }
        })
      } else {
        navigate(AppNavigation.Wallet.Swap, {
          screen: AppNavigation.Swap.Swap,
          params: {
            initialTokenIdFrom: AVAX_TOKEN_ID,
            initialTokenIdTo: id // the contract address of the token
          }
        })
      }
    }
    return (
      <AvaListItem.Base
        title={
          <Text
            variant="heading6"
            ellipsizeMode={'tail'}
            numberOfLines={1}
            testID={`trending_token_symbol__${index + 1}`}
            style={{ width: '100%' }}>
            {`${index + 1}. ${symbol.toUpperCase()}`}
          </Text>
        }
        testID={testID}
        titleAlignment={'flex-start'}
        subtitle={
          <Text
            testID={`trending_token_name__${index + 1}`}
            variant="body2"
            ellipsizeMode={'tail'}
            numberOfLines={1}
            sx={{
              width: '92%',
              color: '$neutral400',
              lineHeight: 17
            }}>
            {name}
          </Text>
        }
        embedInCard={false}
        rightComponentMaxWidth={RIGHT_COMPONENT_MAX_WIDTH_FOR_TRENDING}
        leftComponent={
          <TokenLogo
            token={token}
            testID={`trending_token_logo__${index + 1}`}
          />
        }
        rightComponent={
          <PriceAndBuyButton
            token={token}
            value={value}
            onPress={handleBuyPressed}
            testID={`trending_token_value__${index + 1}`}
          />
        }
        onPress={onPress}
      />
    )
  }

  return (
    <AvaListItem.Base
      title={
        <Text
          variant="heading6"
          ellipsizeMode={'tail'}
          numberOfLines={1}
          style={{ width: '100%' }}>
          {symbol.toUpperCase()}
        </Text>
      }
      testID={testID}
      titleAlignment={'flex-start'}
      subtitle={name}
      embedInCard={false}
      rightComponentMaxWidth={RIGHT_COMPONENT_MAX_WIDTH}
      leftComponent={<TokenLogo token={token} testID={testID} />}
      rightComponent={
        <ChartAndPrice
          currency={selectedCurrency}
          token={token}
          chartData={chartData}
          value={value}
        />
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
  currency: string
}

const ChartAndPrice = ({
  token,
  chartData,
  value,
  currency
}: ChartAndPriceProps): JSX.Element | null => {
  const { theme } = useApplicationContext()
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
            {value}
          </AvaText.Heading3>
          <Space x={4} />
          <AvaText.Body3
            textStyle={{ color: theme.colorText2, lineHeight: 22 }}>
            {currency}
          </AvaText.Body3>
        </Row>
        <Space y={2} />
        <MarketMovement
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
  testID?: string
  onPress: () => void
}

const PriceAndBuyButton = ({
  token,
  value,
  testID = 'watchlist_price',
  onPress
}: PriceAndBuyButtonProps): JSX.Element | null => {
  const { theme } = useApplicationContext()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  if (!value) return null

  return (
    <Row
      style={{
        alignItems: 'center'
      }}>
      <View
        style={{
          alignItems: 'flex-end',
          flex: 1
        }}>
        <Row
          style={{
            alignItems: 'flex-end'
          }}>
          <AvaText.Heading3
            testID={testID}
            ellipsizeMode={'tail'}
            textStyle={{
              textAlign: 'right',
              width: RIGHT_COMPONENT_MAX_WIDTH_FOR_TRENDING / 1.8
            }}
            numberOfLines={1}>
            {value}
          </AvaText.Heading3>
          <Space x={4} />
          <AvaText.Body3
            textStyle={{ color: theme.colorText2, lineHeight: 22 }}>
            {selectedCurrency}
          </AvaText.Body3>
        </Row>
        <Space y={2} />
        <MarketMovement
          priceChange={token.priceChange24h ?? 0}
          percentChange={token.priceChangePercentage24h ?? 0}
          testID={`price_movement_change__${token.symbol}`}
        />
      </View>
      <View style={{ marginLeft: 8 }}>
        <Button
          testID={`${testID}_buy_btn`}
          type={'secondary'}
          size={'small'}
          style={{ paddingVertical: 6 }}
          onPress={onPress}>
          Buy
        </Button>
      </View>
    </Row>
  )
}

export default React.memo(WatchListItem)
