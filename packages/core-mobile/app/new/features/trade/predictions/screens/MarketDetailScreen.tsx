import {
  alpha,
  GroupList,
  Icons,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams } from 'expo-router'
import { TradeThumbnail } from 'features/trade/components/TradeThumbnail'
import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView } from 'react-native'
import { OutcomeRow } from '../components/OutcomeRow'
import {
  OUTCOME_COLORS,
  OutcomeSeries,
  ProbabilityChart
} from '../components/ProbabilityChart'
import { MARKETS_MOCK, MockMarket } from '../mocks'
import { generateHistory, tickerToSeed } from '../utils'

const COLLAPSED_COUNT = 3
const TIME_RANGES = ['1H', '1D', '1W', '1M', 'ALL'] as const
type TimeRange = typeof TIME_RANGES[number]

const MarketDetailScreen = (): JSX.Element => {
  const { theme } = useTheme()
  const { tickerId } = useLocalSearchParams<{ tickerId: string }>()
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M')
  const [showAllOutcomes, setShowAllOutcomes] = useState(false)

  const market: MockMarket | undefined = useMemo(
    () => MARKETS_MOCK.find(m => m.tickerId === tickerId),
    [tickerId]
  )

  const chartSeries: OutcomeSeries[] = useMemo(() => {
    if (!market) return []
    const seed = tickerToSeed(market.tickerId)
    return market.options.map((opt, i) => ({
      label: opt.label,
      points: generateHistory(opt.probability, seed, i)
    }))
  }, [market])

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

  const allOptions = market?.options ?? []
  const hasMore = allOptions.length > COLLAPSED_COUNT
  const visibleOptions = showAllOutcomes
    ? allOptions
    : allOptions.slice(0, COLLAPSED_COUNT)
  const overflowOption =
    !showAllOutcomes && hasMore ? allOptions[COLLAPSED_COUNT] : undefined

  return (
    <ScrollScreen navigationTitle={market?.title ?? ''}>
      <View style={{ gap: 10, paddingTop: 16 }}>
        <View style={{ gap: 10, paddingHorizontal: 16 }}>
          <TradeThumbnail url={market?.imageUrl} />
          <Text variant="heading2">{market?.title ?? ''}</Text>
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
              key={opt.label}
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
                {opt.label}
              </Text>
              <Text variant="subtitle2" style={{ fontFamily: 'Inter-Medium' }}>
                {Math.round(opt.probability * 1000) / 10}%
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
          <View style={{ gap: 8 }}>
            {visibleOptions.map((opt, i) => (
              <OutcomeRow
                key={opt.label}
                label={opt.label}
                probability={opt.probability}
                volume={Number(market?.volume ?? 0) * opt.probability * 0.1}
                trendUp={i % 2 === 0}
                trendPct={0.02 + opt.probability * 0.01}
              />
            ))}
          </View>

          {overflowOption !== undefined && (
            <View style={{ height: 110 }}>
              <OutcomeRow
                label={overflowOption.label}
                probability={overflowOption.probability}
                volume={
                  Number(market?.volume ?? 0) * overflowOption.probability * 0.1
                }
                trendUp={false}
                trendPct={0.02 + overflowOption.probability * 0.01}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0)', theme.colors.$surfacePrimary]}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 31,
                  height: 120,
                  pointerEvents: 'none'
                }}
              />
              <Pressable
                onPress={() => setShowAllOutcomes(true)}
                style={{
                  position: 'absolute',
                  bottom: 31,
                  alignSelf: 'center',
                  backgroundColor: alpha(theme.colors.$textPrimary, 0.1),
                  borderRadius: 20,
                  height: 28,
                  width: 100,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                <Text variant="buttonSmall">Show more</Text>
              </Pressable>
            </View>
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
                accordion: <View style={{ padding: 16 }} />
              },
              {
                title: 'Timeline and payout',
                accordion: <View style={{ padding: 16 }} />
              },
              {
                title: 'About this market',
                accordion: <View style={{ padding: 16 }} />
              }
            ]}
          />
        </View>
      </View>
    </ScrollScreen>
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

export default MarketDetailScreen
