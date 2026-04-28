import {
  alpha,
  Button,
  GroupList,
  Icons,
  LeverageGauge,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { TradeThumbnail } from 'features/trade/components/TradeThumbnail'
import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { MarketOutcomeRow } from '../components/MarketOutcomeRow'
import {
  OUTCOME_COLORS,
  OutcomeSeries,
  ProbabilityChart
} from '../components/ProbabilityChart'
import { useGetEventDetail } from '../hooks/useGetEventDetail'
import { generateHistory, tickerToSeed } from '../utils'
import { MarketWithQuotes } from '../types'

const COLLAPSED_COUNT = 5
const TIME_RANGES = ['1H', '1D', '1W', '1M', 'ALL'] as const
type TimeRange = typeof TIME_RANGES[number]

const EventDetailsScreen = (): JSX.Element => {
  const { theme } = useTheme()

  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M')
  const [leverage, setLeverage] = useState(2)
  const [decimalLeverage, setDecimalLeverage] = useState(2)

  const { tickerId } = useLocalSearchParams<{ tickerId: string }>()
  const router = useRouter()
  const { event } = useGetEventDetail(tickerId)

  const chartSeries: OutcomeSeries[] = useMemo(() => {
    if (!event) return []
    const seed = tickerToSeed(event.eventTicker)
    return event.markets?.map((opt, i) => ({
      label: opt.tickerId,
      points: generateHistory(parseFloat(opt.lastPrice), seed, i)
    }))
  }, [event])

  // TODO: replace with the actual last-update timestamp from the
  // backend once the endpoint exposes it. Currently shows the client "now".
  const lastUpdateText = useMemo(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }, [])

  const allOptions = event?.markets ?? []

  return (
    <ScrollScreen navigationTitle={event?.title ?? ''}>
      <View style={{ paddingTop: 16, paddingHorizontal: 16, gap: 8 }}>
        <Text variant="heading3">Add leverage</Text>
        <LeverageGauge
          value={leverage}
          onChange={setLeverage}
          min={1}
          max={40}
          step={0.2}
          integersOnly
          enableManualInput
        />
      </View>
      <View style={{ paddingTop: 16, paddingHorizontal: 16, gap: 8 }}>
        <Text variant="heading3">Add leverage (decimals)</Text>
        <LeverageGauge
          value={decimalLeverage}
          onChange={setDecimalLeverage}
          min={1}
          max={40}
          step={0.2}
          enableManualInput
        />
      </View>
      <View style={{ gap: 10, paddingTop: 16 }}>
        <View style={{ gap: 10, paddingHorizontal: 16 }}>
          <TradeThumbnail url={event?.imageUrl} />
          <Text variant="heading2">{event?.title ?? ''}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 20,
            paddingVertical: 8,
            paddingHorizontal: 16
          }}>
          {allOptions.map((opt, i) => (
            <View
              key={opt.ticker}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    OUTCOME_COLORS[i % OUTCOME_COLORS.length] ?? '#00C2B4'
                }}
              />
              <Text
                variant="subtitle2"
                style={{ color: alpha(theme.colors.$textPrimary, 0.6) }}
                numberOfLines={1}>
                {opt.yesSubTitle}
              </Text>
              <Text variant="subtitle2" style={{ fontFamily: 'Inter-Medium' }}>
                {Math.round(parseFloat(opt.lastPrice) * 1000) / 10}%
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ProbabilityChart series={chartSeries} height={140} />

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ paddingTop: 8, gap: 12 }}>
          <Text
            variant="caption"
            style={{
              textAlign: 'center',
              color: alpha(theme.colors.$textPrimary, 0.5)
            }}>
            Last update: {lastUpdateText}
          </Text>
          <TimeRangeSelector
            selected={selectedRange}
            onSelect={setSelectedRange}
          />
        </View>

        <View style={{ paddingTop: 24, gap: 8 }}>
          <Text variant="heading3">Outcomes</Text>
          {allOptions.length === 1 && allOptions[0] ? (
            <SingleOutcome market={allOptions[0]} />
          ) : (
            <MultipleOutcomes markets={allOptions} />
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingTop: 20
          }}>
          <Icons.Alert.ErrorOutline
            width={24}
            height={24}
            color={theme.colors.$textPrimary}
          />
          <Text variant="subtitle1" style={{ flex: 1, lineHeight: 20 }}>
            {`Important: The following market can only have one Yes outcome. If two nominees tie then the market called 'Tie' will resolve to Yes.`}
          </Text>
        </View>

        <View style={{ paddingTop: 20 }}>
          <GroupList
            itemHeight={50}
            data={[
              {
                title: 'Rules summary',
                accordion: (
                  <View style={{ padding: 16 }}>
                    <Text variant="body1">Rules summary</Text>
                  </View>
                )
              },
              {
                title: 'Timeline and payout',
                accordion: (
                  <View style={{ padding: 16 }}>
                    <Text variant="body1">Rules summary</Text>
                  </View>
                )
              },
              {
                title: 'About this market',
                accordion: <View style={{ padding: 16 }} />
              }
            ]}
          />
        </View>
      </View>
      <View sx={{ padding: 16, paddingTop: 24 }}>
        <Button
          type="primary"
          size="large"
          onPress={() => router.push('/placeBet')}>
          Place Bet
        </Button>
      </View>
    </ScrollScreen>
  )
}

export default EventDetailsScreen

const MultipleOutcomes = ({
  markets
}: {
  markets: MarketWithQuotes[]
}): JSX.Element => {
  const { theme } = useTheme()
  const [showAllOutcomes, setShowAllOutcomes] = useState(false)

  const hasMore = markets.length > COLLAPSED_COUNT
  const visibleMarkets = showAllOutcomes
    ? markets
    : markets.slice(0, COLLAPSED_COUNT)
  const overflowOption =
    !showAllOutcomes && hasMore ? markets[COLLAPSED_COUNT] : undefined

  return (
    <View sx={{ paddingBottom: showAllOutcomes ? 8 : 16 }}>
      <View sx={{ gap: 8 }}>
        {visibleMarkets.map((market, i) => (
          <MarketOutcomeRow
            key={market.tickerId}
            label={market.yesSubTitle ?? ''}
            probability={parseFloat(market.lastPrice)}
            volume={Number(market.volume ?? 0)}
            trendUp={i % 2 === 0}
            trendPct={0.02 + parseFloat(market.lastPrice) * 0.01}
          />
        ))}
      </View>
      {overflowOption !== undefined && (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            top: -8
          }}>
          <LinearGradient
            colors={[
              alpha(theme.colors.$surfacePrimary, 0),
              theme.colors.$surfacePrimary
            ]}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 16,
              height: 120,
              pointerEvents: 'none'
            }}
          />
          <Button
            type="secondary"
            size="small"
            onPress={() => setShowAllOutcomes(true)}>
            Show more
          </Button>
        </View>
      )}
    </View>
  )
}

const SingleOutcome = ({
  market
}: {
  market: MarketWithQuotes
}): JSX.Element => {
  // Placeholder volume heuristic: the API returns a single `volume` for the
  // market, not a per-outcome breakdown. Until the backend exposes it, we
  // approximate this outcome's share as `totalVolume * probability * 0.1`.
  // Safe to replace once real per-outcome volume is wired in.
  return (
    <MarketOutcomeRow
      label={market.result ?? ''}
      probability={parseFloat(market.lastPrice)}
      volume={Number(market?.volume ?? 0) * parseFloat(market.lastPrice) * 0.1}
      trendUp={false}
      trendPct={0.02 + parseFloat(market.lastPrice) * 0.01}
    />
  )
}

function TimeRangeSelector({
  selected,
  onSelect
}: {
  selected: TimeRange
  onSelect: (r: TimeRange) => void
}): JSX.Element {
  const { theme } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 21,
        height: 36,
        overflow: 'hidden',
        backgroundColor: alpha(theme.colors.$textPrimary, 0.06)
      }}>
      {TIME_RANGES.map(range => {
        const isSelected = range === selected
        return (
          <Pressable
            key={range}
            onPress={() => onSelect(range)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 21,
              backgroundColor: isSelected
                ? theme.colors.$textPrimary
                : undefined
            }}>
            <Text
              variant="buttonSmall"
              style={{
                textTransform: 'uppercase',
                color: isSelected
                  ? theme.colors.$surfacePrimary
                  : alpha(theme.colors.$textPrimary, 0.5)
              }}>
              {range}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
