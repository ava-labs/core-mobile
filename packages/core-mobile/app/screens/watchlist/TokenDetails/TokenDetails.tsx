import React, { FC, useCallback, useMemo } from 'react'
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Avatar from 'components/Avatar'
import AvaText from 'components/AvaText'
import TabViewAva from 'components/TabViewAva'
import { useRoute } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import OvalTagBg from 'components/OvalTagBg'
import { useTokenDetails } from 'screens/watchlist/useTokenDetails'
import SparklineChart from 'components/SparklineChart/SparklineChart'
import { Row } from 'components/Row'
import MarketMovement from 'screens/watchlist/components/MarketMovement'
import {
  ViewOnceKey,
  selectHasBeenViewedOnce,
  setViewOnce
} from 'store/viewOnce'
import TokenAddress from 'components/TokenAddress'
import { formatLargeCurrency } from 'utils/Utils'
import { formatNumber } from 'utils/formatNumber/formatNumber'
import { UI, useIsUIDisabled } from 'hooks/useIsUIDisabled'
import { useSharedValue } from 'react-native-reanimated'
import { styles as AvaTextStyles } from 'components/AvaText'
import { format } from 'date-fns'
import { StarButton } from 'components/StarButton'
import { AnimatedText } from 'components/AnimatedText'
import { useDispatch, useSelector } from 'react-redux'
import { GraphPoint } from 'react-native-graph'
import { NotFoundError } from 'components/NotFoundError'
import { isPositiveNumber } from 'utils/isPositiveNumber/isPositiveNumber'
import { getDomainFromUrl } from 'utils/getDomainFromUrl/getDomainFromUrl'
import { Button } from '@avalabs/k2-mobile'
import LinearGradientSVG from 'components/svg/LinearGradientSVG'
import { selectBalanceTotalInCurrencyForAccount } from 'store/balance/slice'
import { selectTokenVisibility } from 'store/portfolio/slice'
import { selectActiveAccount } from 'store/account/slice'
import { selectIsEarnBlocked } from 'store/posthog/slice'
import { useHasEnoughAvaxToStake } from 'hooks/earn/useHasEnoughAvaxToStake'
import { AVAX_TOKEN_ID, USDC_TOKEN_ID } from 'consts/swap'
import { AVAX_COINGECKO_ID } from 'consts/coingecko'
import { MarketType } from 'store/watchlist'
import { DataItem } from './DataItem'
import { Overlay, OverlayType } from './Overlay'

const WINDOW_WIDTH = Dimensions.get('window').width
const WINDOW_HEIGHT = Dimensions.get('window').height
const PADDING_BOTTOM = WINDOW_HEIGHT * 0.12
export const CHART_HEIGHT = WINDOW_HEIGHT * 0.45
const CHART_WIDTH = WINDOW_WIDTH - 32
const CHART_THICKNESS = 4

type ScreenProps = WalletScreenProps<typeof AppNavigation.Wallet.TokenDetail>

const EMPTY_ARR: {
  date: Date
  value: number
}[] = []

const TokenDetails: FC = () => {
  const {
    theme,
    appHook: { tokenInCurrencyFormatter, currencyFormatter }
  } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const hasBeenViewedChart = useSelector(
    selectHasBeenViewedOnce(ViewOnceKey.CHART_INTERACTION)
  )
  const dispatch = useDispatch()
  const tokenId = useRoute<ScreenProps['route']>().params.tokenId
  const buyDisabled = useIsUIDisabled(UI.Buy)
  const swapDisabled = useIsUIDisabled(UI.Swap)
  const earnBlocked = useSelector(selectIsEarnBlocked)
  const animatedDate = useSharedValue('Price')
  const animatedPrice = useSharedValue('')
  const activeAccount = useSelector(selectActiveAccount)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.index ?? 0,
      tokenVisibility
    )
  )
  const isZeroBalance = balanceTotalInCurrency === 0
  const { hasEnoughAvax } = useHasEnoughAvaxToStake()

  const hyperLinkStyle = { color: theme.colorPrimary1 }

  const {
    noData,
    tokenInfo,
    isFavorite,
    openUrl,
    handleFavorite,
    chartData,
    ranges,
    priceInCurrency,
    changeChartDays
  } = useTokenDetails(tokenId)

  const yRange: [number, number] = [ranges.minPrice, ranges.maxPrice]

  const updatePriceAndDate = useCallback(
    (p: GraphPoint) => {
      const amountInCurrency = tokenInCurrencyFormatter(p.value)
      animatedPrice.value = amountInCurrency
      animatedDate.value = format(p.date, 'E, MMM dd, yyyy, H:mm aa')
    },
    [animatedPrice, animatedDate, tokenInCurrencyFormatter]
  )

  const resetPriceAndDate = useCallback(() => {
    const amountInCurrency = tokenInCurrencyFormatter(priceInCurrency ?? 0)
    animatedPrice.value = amountInCurrency
    animatedDate.value = 'Price'
  }, [animatedPrice, animatedDate, priceInCurrency, tokenInCurrencyFormatter])

  const openTwitter = (): void => {
    tokenInfo?.twitterHandle &&
      openUrl(`https://x.com/${tokenInfo.twitterHandle}`)
  }

  const openWebsite = (url: string): void => {
    openUrl(url)
  }

  const formatMarketNumbers = useCallback(
    (value: number) => {
      return value === 0 ? ' -' : formatLargeCurrency(currencyFormatter(value))
    },
    [currencyFormatter]
  )

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

  const onInstructionRead = (): void => {
    dispatch(setViewOnce(ViewOnceKey.CHART_INTERACTION))
  }

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

  const renderActionButtons = useCallback(() => {
    const buyButton = (
      <Button
        testID="token_detail_footer_buy_btn"
        type={'primary'}
        size={'xlarge'}
        onPress={() => {
          navigate(AppNavigation.Wallet.Buy, {
            screen: AppNavigation.Buy.Buy,
            params: { showAvaxWarning: true }
          })
        }}
        style={{ flex: 1 }}>
        Buy
      </Button>
    )

    const stakeButton = (
      <Button
        testID="token_detail_footer_stake_btn"
        type={'primary'}
        size={'xlarge'}
        onPress={() => {
          // @ts-ignore
          navigate(AppNavigation.Wallet.Earn, {
            screen: AppNavigation.Earn.StakeSetup
          })
        }}
        style={{ flex: 1 }}>
        Stake
      </Button>
    )

    const generateSwapButton = (initialTokenIdTo?: string): JSX.Element => (
      <Button
        testID="token_detail_footer_swap_btn"
        type={'primary'}
        size={'xlarge'}
        onPress={() => {
          navigate(AppNavigation.Wallet.Swap, {
            screen: AppNavigation.Swap.Swap,
            params: {
              initialTokenIdFrom: AVAX_TOKEN_ID,
              initialTokenIdTo
            }
          })
        }}
        style={{ flex: 1, marginLeft: 24 }}>
        Swap
      </Button>
    )

    const actions = []

    if (isZeroBalance) {
      // only show buy button if the user has zero balance
      !buyDisabled && actions.push(buyButton)
    } else if (tokenId === AVAX_COINGECKO_ID) {
      // for AVAX, show stake instead of buy button if user has enough AVAX
      hasEnoughAvax
        ? !earnBlocked && actions.push(stakeButton)
        : !buyDisabled && actions.push(buyButton)

      // always show swap button for AVAX
      !swapDisabled && actions.push(generateSwapButton(USDC_TOKEN_ID))
    } else {
      // user has some balance, show both buy and swap button for all other tokens
      !buyDisabled && actions.push(buyButton)

      // however, only show swap button if the token is a trending one
      // as we currently only support swapping on Avanlanche network
      // (all trending tokens are on Avalanche network)
      tokenInfo?.marketType === MarketType.TRENDING &&
        !swapDisabled &&
        actions.push(generateSwapButton(tokenInfo?.contractAddress))
    }

    if (actions.length === 0) {
      return null
    }

    return (
      <>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: 118
          }}>
          <LinearGradientSVG
            colorFrom={'#000000'}
            colorTo={'#000000'}
            opacityFrom={0}
            opacityTo={1}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            position: 'absolute',
            bottom: 0,
            width: '100%',
            backgroundColor: 'transparent',
            marginBottom: 11,
            paddingHorizontal: 24
          }}>
          {actions}
        </View>
      </>
    )
  }, [
    navigate,
    hasEnoughAvax,
    isZeroBalance,
    buyDisabled,
    earnBlocked,
    swapDisabled,
    tokenInfo?.marketType,
    tokenInfo?.contractAddress,
    tokenId
  ])

  const verifiedChartData: {
    date: Date
    value: number
  }[] = useMemo(() => {
    if (!chartData || chartData.length < 2) return EMPTY_ARR

    // some tokens returned from birdeye actually have the same value for all data points
    // this is a mistake on their end, but we should handle it gracefully
    // by not showing it to users
    const chartHasSameData = chartData.every(
      d => d.value === chartData[0]?.value
    )

    if (chartHasSameData) return EMPTY_ARR

    return chartData
  }, [chartData])

  const overlayType =
    chartData === undefined
      ? OverlayType.LOADING
      : verifiedChartData.length === 0
      ? OverlayType.NO_DATA
      : !hasBeenViewedChart
      ? OverlayType.INSTRUCTION
      : undefined

  if (noData) {
    return (
      <NotFoundError
        title="Token not found"
        description="Tap the button below to go back."
      />
    )
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: PADDING_BOTTOM }}>
        <View>
          <AvaListItem.Base
            title={<AvaText.Heading5>{tokenInfo?.name}</AvaText.Heading5>}
            titleAlignment={'flex-start'}
            subtitle={tokenInfo?.symbol}
            leftComponent={
              tokenInfo?.name &&
              tokenInfo?.symbol &&
              tokenInfo?.logoUri && (
                <Avatar.Token
                  name={tokenInfo.name}
                  symbol={tokenInfo.symbol}
                  logoUri={tokenInfo.logoUri}
                  size={48}
                  backgroundColor="white"
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
              style={{ justifyContent: 'flex-start' }}
              priceChange={ranges.diffValue}
              percentChange={ranges.percentChange}
              testID="token_detail__price_movement"
            />
          </View>
          <View style={styles.chartContainer}>
            <View>
              <SparklineChart
                interactive
                data={verifiedChartData}
                yRange={yRange}
                negative={ranges.diffValue < 0}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                lineThickness={CHART_THICKNESS}
                onPointSelected={updatePriceAndDate}
                onInteractionEnded={resetPriceAndDate}
              />
            </View>
            <Overlay type={overlayType} onInstructionRead={onInstructionRead} />
          </View>
          {/* this will change once data component purpose and interaction is defined */}

          {tokenInfo?.has24hChartDataOnly === false && (
            <TabViewAva
              renderLabel={(title, selected, color) => (
                <AvaText.Heading3 textStyle={{ color }}>
                  {title}
                </AvaText.Heading3>
              )}
              onTabIndexChange={onTabChanged}>
              <TabViewAva.Item title={'24H'} testID="token_detail__24H" />
              <TabViewAva.Item title={'1W'} testID="token_detail__1W" />
              <TabViewAva.Item title={'1M'} testID="token_detail__1M" />
              <TabViewAva.Item title={'3M'} testID="token_detail__3M" />
              <TabViewAva.Item title={'1Y'} testID="token_detail__1Y" />
            </TabViewAva>
          )}

          {/* Market Data & Rank */}
          <AvaListItem.Base
            title={
              <AvaText.Heading2 testID="token_detail__market_data_title">
                Market Data
              </AvaText.Heading2>
            }
            titleAlignment={'flex-start'}
            rightComponent={
              isPositiveNumber(tokenInfo?.marketCapRank) ? (
                <OvalTagBg
                  testID="token_detail__rank_icon"
                  color={theme.neutral850}
                  style={styles.rank}>
                  <AvaText.Body2
                    testID="token_detail__rank"
                    textStyle={{
                      color: theme.colorText3
                    }}>{`Rank: ${tokenInfo.marketCapRank}`}</AvaText.Body2>
                </OvalTagBg>
              ) : null
            }
          />
          <Row style={styles.marketCap}>
            {isPositiveNumber(tokenInfo?.marketCap) && (
              <DataItem
                title={'MarketCap'}
                value={formatMarketNumbers(tokenInfo.marketCap)}
                testID={'token_detail__market_cap'}
              />
            )}
            {tokenInfo?.contractAddress && (
              <DataItem
                title={'Contract Address'}
                value={
                  <TokenAddress
                    address={tokenInfo.contractAddress}
                    textType={'Heading'}
                  />
                }
              />
            )}
          </Row>
          <Row style={styles.row}>
            {isPositiveNumber(tokenInfo?.marketVolume) && (
              <DataItem
                testID="token_detail__24h_volume"
                title={'24h Volume'}
                value={formatMarketNumbers(tokenInfo.marketVolume)}
              />
            )}
            {tokenInfo?.urlHostname && tokenInfo.urlHostname && (
              <DataItem
                testID={'token_detail__website'}
                title={'Website'}
                value={
                  <AvaText.Heading3
                    testID={'token_detail__website_url'}
                    textStyle={hyperLinkStyle}
                    onPress={() => {
                      tokenInfo.urlHostname &&
                        openWebsite(tokenInfo.urlHostname)
                    }}>
                    {getDomainFromUrl(tokenInfo.urlHostname)}
                  </AvaText.Heading3>
                }
              />
            )}
          </Row>
          <Row style={styles.row}>
            {isPositiveNumber(tokenInfo?.marketCirculatingSupply) && (
              <DataItem
                testID={'token_detail__available_supply'}
                title={'Available Supply'}
                value={formatNumber(tokenInfo.marketCirculatingSupply)}
              />
            )}
            {tokenInfo?.twitterHandle && (
              <DataItem
                testID="token_detail__twitter"
                title={'Twitter'}
                value={
                  <AvaText.Heading3
                    testID={'token_detail__twitter_handle'}
                    textStyle={hyperLinkStyle}
                    onPress={openTwitter}>
                    {`@${tokenInfo.twitterHandle}`}
                  </AvaText.Heading3>
                }
              />
            )}
          </Row>
          {isPositiveNumber(tokenInfo?.marketTotalSupply) && (
            <Row style={styles.totalSupply}>
              <DataItem
                testID={'token_detail__total_supply'}
                title={'Total Supply'}
                value={formatNumber(tokenInfo.marketTotalSupply)}
              />
            </Row>
          )}
        </View>
      </ScrollView>
      {renderActionButtons()}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
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

export default TokenDetails
