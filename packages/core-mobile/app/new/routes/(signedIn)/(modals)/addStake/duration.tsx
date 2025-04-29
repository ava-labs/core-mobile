import {
  Button,
  GroupList,
  GroupListItem,
  StakeRewardChart,
  StakeRewardChartHandle,
  Text,
  View
} from '@avalabs/k2-alpine'
import { UTCDate } from '@date-fns/utc'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import { useDelegationContext } from 'contexts/DelegationContext'
import { differenceInDays, getUnixTime, millisecondsToSeconds } from 'date-fns'
import { useRouter } from 'expo-router'
import {
  DurationOptions,
  getCustomDurationIndex,
  getDefaultDurationIndex
} from 'features/stake/components/DurationOptions'
import { StakeCustomEndDatePicker } from 'features/stake/components/StakeCustomEndDatePicker'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import { useStakeEstimatedReward } from 'features/stake/hooks/useStakeEstimatedReward'
import { useStakeEstimatedRewards } from 'features/stake/hooks/useStakeEstimatedRewards'
import { convertToDurationInSeconds } from 'features/stake/utils'
import { useNow } from 'hooks/time/useNow'
import { useAvaxTokenPriceInSelectedCurrency } from 'hooks/useAvaxTokenPriceInSelectedCurrency'
import { useDebounce } from 'hooks/useDebounce'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import {
  DURATION_OPTIONS_WITH_DAYS_FUJI,
  DURATION_OPTIONS_WITH_DAYS_MAINNET,
  DurationOptionWithDays,
  getStakeEndDate,
  THREE_MONTHS
} from 'services/earn/getStakeEndDate'
import { UnixTime } from 'services/earn/types'
import { selectIsDeveloperMode } from 'store/settings/advanced'

const StakeDurationScreen = (): JSX.Element => {
  const { navigate } = useRouter()

  const { stakeAmount } = useDelegationContext()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxPrice = useAvaxTokenPriceInSelectedCurrency()
  const { formatCurrency } = useFormatCurrency()
  const now = useNow()
  const rewardChartRef = useRef<StakeRewardChartHandle>(null)
  const durationsWithDays: DurationOptionWithDays[] = useMemo(
    () =>
      isDeveloperMode
        ? DURATION_OPTIONS_WITH_DAYS_FUJI
        : DURATION_OPTIONS_WITH_DAYS_MAINNET,
    [isDeveloperMode]
  )
  const defaultDurationIndex = useMemo(
    () => getDefaultDurationIndex(isDeveloperMode),
    [isDeveloperMode]
  )
  const customDurationIndex = useMemo(
    () => getCustomDurationIndex(isDeveloperMode),
    [isDeveloperMode]
  )
  const animatedChartIndex = useSharedValue<number | undefined>(
    defaultDurationIndex
  )
  // Mirror the shared value to a state variable so that React re-renders when it changes.
  const [selectedChartIndex, setSelectedChartIndex] = useState<
    number | undefined
  >(defaultDurationIndex)
  useAnimatedReaction(
    () => animatedChartIndex.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setSelectedChartIndex)(current)
      }
    }
  )
  // Mirror selectedChartIndex to a debounced state variable, to avoid unnecessary animation in duration options component.
  const {
    debounced: selectedDurationIndex,
    setValueImmediately: setSelectedDurationIndex
  } = useDebounce(
    selectedChartIndex === undefined ? customDurationIndex : selectedChartIndex,
    300
  )
  const [stakeEndTime, setStakeEndTime] = useState<UnixTime>(() => {
    const defaultDelegationTime =
      durationsWithDays[defaultDurationIndex] ?? THREE_MONTHS
    return getStakeEndDate({
      startDateUnix: millisecondsToSeconds(now),
      stakeDurationFormat: defaultDelegationTime.stakeDurationFormat,
      stakeDurationValue: defaultDelegationTime.stakeDurationValue,
      isDeveloperMode: isDeveloperMode
    })
  })
  const [customEndDate, setCustomEndDate] = useState<UTCDate>()
  const [isCustomEndDatePickerVisible, setIsCustomEndDatePickerVisible] =
    useState(false)

  const { data: estimatedRewards } = useStakeEstimatedRewards({
    amount: stakeAmount,
    delegationFee: DELEGATION_FEE_FOR_ESTIMATION,
    durations: durationsWithDays
  })
  const estimatedRewardsChartData = useMemo(() => {
    return (estimatedRewards ?? []).map((item, index) => {
      return {
        value: item.estimatedTokenReward.toDisplay({ asNumber: true }),
        duration: `${item.duration.numberOfDays} days`,
        index
      }
    })
  }, [estimatedRewards])
  const estimatedCustomReward = useStakeEstimatedReward({
    amount: stakeAmount,
    duration:
      customEndDate === undefined
        ? undefined
        : convertToDurationInSeconds(customEndDate),
    delegationFee: DELEGATION_FEE_FOR_ESTIMATION
  })
  const estimatedReward = useMemo(() => {
    if (selectedDurationIndex === undefined) {
      return
    }

    if (selectedDurationIndex === customDurationIndex) {
      return estimatedCustomReward?.estimatedTokenReward
    }

    return estimatedRewards?.[selectedDurationIndex]?.estimatedTokenReward
  }, [
    estimatedRewards,
    selectedDurationIndex,
    estimatedCustomReward,
    customDurationIndex
  ])

  const getDurationInDays = useCallback(() => {
    const selectedIndex = selectedDurationIndex ?? defaultDurationIndex
    if (durationsWithDays[selectedIndex] !== undefined) {
      return estimatedRewards?.[selectedIndex]?.duration.numberOfDays
    }

    if (customEndDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return differenceInDays(customEndDate, today)
    }
  }, [
    durationsWithDays,
    selectedDurationIndex,
    estimatedRewards,
    defaultDurationIndex,
    customEndDate
  ])

  const handlePressNext = useCallback(async () => {
    if (stakeEndTime) {
      navigate({
        // @ts-ignore TODO: make routes typesafe
        pathname: '/addStake/confirm',
        params: {
          stakeEndTime
        }
      })
    }
  }, [navigate, stakeEndTime])

  const handleAdvancedSetup = useCallback(() => {
    navigate({
      // @ts-ignore TODO: make routes typesafe
      pathname: '/addStake/nodeParameters',
      params: {
        stakeEndTime
      }
    })
  }, [navigate, stakeEndTime])

  const handleDateSelected = (date: Date): void => {
    setCustomEndDate(new UTCDate(date.getTime()))
  }

  const handleCancelSelectingCustomEndDate = (): void => {
    setCustomEndDate(undefined)

    rewardChartRef.current?.selectIndex(defaultDurationIndex)
    setSelectedDurationIndex(defaultDurationIndex)
  }

  const handleSelectDuration = useCallback(
    (selectedIndex: number): void => {
      if (durationsWithDays[selectedIndex] === undefined) {
        rewardChartRef.current?.selectIndex(undefined)
        setIsCustomEndDatePickerVisible(true)
      } else {
        rewardChartRef.current?.selectIndex(selectedIndex)
      }

      setSelectedDurationIndex(selectedIndex)
    },
    [durationsWithDays, setSelectedDurationIndex]
  )

  const renderSelectionTitle = useCallback(() => {
    const value =
      selectedChartIndex !== undefined
        ? estimatedRewardsChartData[selectedChartIndex]?.value
        : undefined
    const text = value !== undefined ? `${value} AVAX` : ''
    return <Text variant="heading6">{text}</Text>
  }, [selectedChartIndex, estimatedRewardsChartData])

  const renderSelectionSubtitle = useCallback(() => {
    const value =
      selectedChartIndex !== undefined
        ? estimatedRewardsChartData[selectedChartIndex]?.value
        : undefined

    const text =
      value !== undefined
        ? formatCurrency({
            amount: value * avaxPrice
          })
        : ''

    return (
      <Text variant="caption" sx={{ color: '$textSecondary' }}>
        {text}
      </Text>
    )
  }, [selectedChartIndex, estimatedRewardsChartData, avaxPrice, formatCurrency])

  const inputSection: GroupListItem[] = useMemo(() => {
    const selectedDurationInDays = getDurationInDays()

    return [
      {
        title: 'Stake amount',
        value: `${stakeAmount.toDisplay()} AVAX`
      },
      {
        title: 'Duration',
        value:
          selectedDurationInDays !== undefined
            ? `${selectedDurationInDays} days`
            : '',
        accordion: (
          <DurationOptions
            selectedIndex={selectedDurationIndex}
            onSelectDuration={handleSelectDuration}
            customEndDate={customEndDate}
          />
        )
      }
    ]
  }, [
    stakeAmount,
    selectedDurationIndex,
    handleSelectDuration,
    customEndDate,
    getDurationInDays
  ])

  const rewardSection: GroupListItem[] = useMemo(() => {
    return [
      {
        title: 'Estimated rewards',
        value: (
          <StakeTokenUnitValue
            value={estimatedReward}
            textSx={{ fontWeight: 600 }}
          />
        )
      }
    ]
  }, [estimatedReward])

  useEffect(() => {
    if (selectedChartIndex !== undefined) {
      if (durationsWithDays[selectedChartIndex]) {
        const selectedDuration = durationsWithDays[selectedChartIndex]
        const calculatedStakeEndTime = getStakeEndDate({
          startDateUnix: millisecondsToSeconds(now),
          stakeDurationFormat: selectedDuration.stakeDurationFormat,
          stakeDurationValue: selectedDuration.stakeDurationValue,
          isDeveloperMode: isDeveloperMode
        })
        setStakeEndTime(calculatedStakeEndTime)
      }
    } else if (customEndDate) {
      setStakeEndTime(getUnixTime(customEndDate))
    }
  }, [
    selectedChartIndex,
    now,
    durationsWithDays,
    isDeveloperMode,
    customEndDate
  ])

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 16
        }}>
        <Button type="primary" size="large" onPress={handlePressNext}>
          Next
        </Button>
        <Button type="tertiary" size="large" onPress={handleAdvancedSetup}>
          Advanced setup
        </Button>
      </View>
    )
  }, [handlePressNext, handleAdvancedSetup])
  return (
    <>
      <ScrollScreen
        title="For how long would you like to stake?"
        navigationTitle="How long?"
        isModal
        renderFooter={renderFooter}
        contentContainerStyle={{ padding: 16 }}>
        <View sx={{ gap: 12, marginTop: 16 }}>
          <StakeRewardChart
            ref={rewardChartRef}
            initialIndex={defaultDurationIndex}
            style={{
              height: 270
            }}
            data={estimatedRewardsChartData}
            animatedSelectedIndex={animatedChartIndex}
            renderSelectionTitle={renderSelectionTitle}
            renderSelectionSubtitle={renderSelectionSubtitle}
          />
          <GroupList data={inputSection} />
          <GroupList
            data={rewardSection}
            textContainerSx={{
              marginTop: 0
            }}
            titleSx={{
              fontWeight: 600
            }}
          />
        </View>
      </ScrollScreen>
      <StakeCustomEndDatePicker
        customEndDate={customEndDate}
        isVisible={isCustomEndDatePickerVisible}
        setIsVisible={setIsCustomEndDatePickerVisible}
        onDateSelected={handleDateSelected}
        onCancel={handleCancelSelectingCustomEndDate}
      />
    </>
  )
}

const DELEGATION_FEE_FOR_ESTIMATION = 2

export default StakeDurationScreen
