import React, { useRef, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated'
import { ScrollView, Text, View } from '../Primitives'
import { Button, useTheme } from '../..'
import { MiniChart } from './MiniChart'
import { minichart_data1, minichart_data2 } from './data/minichart'
import { StakeRewardChart, StakeRewardChartHandle } from './StakeRewardChart'
import { stakeRewardsData } from './data/stakeRewards'

export default {
  title: 'Chart'
}

export const All = (): JSX.Element => {
  const { theme } = useTheme()

  const MINICHART_DOWNSAMPLE_TO = [Number.POSITIVE_INFINITY, 30, 20, 10]
  const MINICHART_DATA = [minichart_data1, minichart_data2]

  const MINICHART_WIDTH = 90
  const MINICHART_HEIGHT = 30

  return (
    <GestureHandlerRootView
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary
      }}>
      <ScrollView
        style={{
          width: '100%',
          backgroundColor: theme.colors.$surfacePrimary
        }}
        contentContainerStyle={{ padding: 16, gap: 40 }}>
        <StakeRewardChartStory />
        {MINICHART_DOWNSAMPLE_TO.map((downsampleTo, index) => (
          <View key={index}>
            <Text sx={{ marginBottom: 10 }}>Downsample to: {downsampleTo}</Text>
            {MINICHART_DATA.map((data, i) => {
              const negative =
                (data[0]?.value ?? 0) - (data[data.length - 1]?.value ?? 0) > 0

              return (
                <View key={i}>
                  <MiniChart
                    downsampleTo={downsampleTo}
                    style={{ width: MINICHART_WIDTH, height: MINICHART_HEIGHT }}
                    data={data}
                    negative={negative}
                  />
                </View>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  )
}

const StakeRewardChartStory = (): JSX.Element => {
  const data = stakeRewardsData.map((d, index) => {
    return { ...d, index }
  })

  const dollarPerAvax = 22

  const initialIndex = 1
  const selectedIndex = useSharedValue<number | undefined>(initialIndex)

  const ref = useRef<StakeRewardChartHandle>(null)

  // Mirror the shared value to a state variable so that React re-renders when it changes.
  const [selectedIndexState, setSelectedIndexState] = useState<
    number | undefined
  >(undefined)
  useAnimatedReaction(
    () => selectedIndex.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setSelectedIndexState)(current)
      }
    }
  )

  const renderSelectionTitle = (): JSX.Element => {
    const text =
      selectedIndexState !== undefined
        ? `${data[selectedIndexState]?.value ?? 0} AVAX`
        : ''

    return <Text variant="heading6">{text}</Text>
  }

  const renderSelectionSubtitle = (): JSX.Element => {
    const text =
      selectedIndexState !== undefined
        ? `${(data[selectedIndexState]?.value ?? 0) * dollarPerAvax} USD`
        : ''

    return <Text variant="caption">{text}</Text>
  }

  return (
    <View sx={{ gap: 12 }}>
      <Text variant="heading3" sx={{ alignSelf: 'center' }}>
        Stake Reward Chart
      </Text>
      <StakeRewardChart
        ref={ref}
        data={data}
        style={{
          height: 270
        }}
        initialIndex={initialIndex}
        selectedIndex={selectedIndex}
        renderSelectionTitle={renderSelectionTitle}
        renderSelectionSubtitle={renderSelectionSubtitle}
      />
      <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text sx={{ flex: 1 }}>Selected index: {selectedIndexState}</Text>
        <Button
          size="medium"
          type="primary"
          onPress={() => {
            ref.current?.selectIndex(undefined)
          }}>
          reset
        </Button>
      </View>
    </View>
  )
}
