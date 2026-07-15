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
import {
  addDays,
  addHours,
  format,
  getUnixTime,
  millisecondsToSeconds
} from 'date-fns'
import { Href, useRouter } from 'expo-router'
import { useAvaxPrice } from 'features/portfolio/hooks/useAvaxPrice'
import {
  DurationOptions,
  getCustomDurationIndex,
  getDefaultDurationIndex
} from 'features/stake/components/DurationOptions'
import { StakeCustomEndDatePicker } from 'features/stake/components/StakeCustomEndDatePicker'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import { useStakeEstimatedReward } from 'features/stake/hooks/useStakeEstimatedReward'
import { useStakeEstimatedRewards } from 'features/stake/hooks/useStakeEstimatedRewards'
import {
  convertToDurationInSeconds,
  formatDurationInDays,
  getRoundedDurationInDays
} from 'features/stake/utils'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import { useNow } from 'hooks/time/useNow'
import { useDebounce } from 'hooks/useDebounce'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
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

// Fallback validator fee for reward estimates when the node isn't known yet
// (Fast Stake auto-selects at confirm time with fee ≤ 2%, so 2% is the
// worst-case approximation). The advanced flow passes the selected node's
// actual fee via `delegationFeePercent`.
const DELEGATION_FEE_FOR_ESTIMATION = 2

/**
 * V2 "How long do you want to stake?" screen.
 *
 * Reuses the legacy duration logic (reward chart, duration presets,
 * custom end date) and is designed to be shared across staking flows
 * (Fast Stake today; the advanced delegate flow once it lands). Where
 * to navigate on `Next` is injected via the `nextRoute` prop so each
 * flow's route wrapper can point at its own confirm step
 * (`/addStakeV2/fastStake/confirm`, `/addStakeV2/delegate/confirm`,
 * etc.). The `stakeEndTime` query param is appended automatically.
 */
const StakeDurationScreen = ({
  nextRoute,
  maxEndDate,
  delegationFeePercent,
  initialDurationDays
}: {
  /** Pathname pushed onto the router when the user presses `Next`. */
  nextRoute: string
  /**
   * Optional upper bound on the stake end date — the advanced delegate flow
   * passes the selected validator's end time so the custom date can't outlast
   * it. Fast Stake omits it.
   */
  maxEndDate?: Date
  /**
   * Validator delegation fee (percent) baked into the reward estimates — the
   * advanced delegate flow passes the selected node's actual fee so the chart
   * matches the confirm screen's quote (mirrors core-web). Fast Stake omits
   * it (node unknown at this step) and falls back to the 2% cap.
   */
  delegationFeePercent?: number
  /**
   * Restake prefill: the original stake's duration in whole days. When it
   * matches a preset, that preset starts selected; otherwise the screen opens
   * on a custom end date of now + N days (+1h of slack so the duration can't
   * round below the original — mirrors core-web's `DelegationForm`
   * `initialDurationMs`). The user can still change it freely.
   */
  initialDurationDays?: number
}): JSX.Element => {
  const { navigate } = useRouter()

  const [stakeAmount] = useStakeAmount()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const avaxPrice = useAvaxPrice()
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
  // Restake prefill (all captured once, at mount): when the original stake's
  // duration matches a preset we start on that preset; otherwise we start on
  // a custom end date. `undefined` initial chart index = the custom state
  // (same convention `handleSelectDuration` uses when the user picks Custom).
  const [initialPresetIndex] = useState<number | undefined>(() => {
    if (initialDurationDays === undefined) return undefined
    const index = durationsWithDays.findIndex(
      duration => duration.numberOfDays === initialDurationDays
    )
    return index >= 0 ? index : undefined
  })
  const [initialCustomEndDate] = useState<UTCDate | undefined>(() =>
    initialDurationDays !== undefined && initialPresetIndex === undefined
      ? new UTCDate(addHours(addDays(now, initialDurationDays), 1).getTime())
      : undefined
  )
  const initialChartIndex = initialCustomEndDate
    ? undefined
    : initialPresetIndex ?? defaultDurationIndex
  const animatedChartIndex = useSharedValue<number | undefined>(
    initialChartIndex
  )
  // Mirror the shared value to a state variable so that React re-renders when it changes.
  const [selectedChartIndex, setSelectedChartIndex] = useState<
    number | undefined
  >(initialChartIndex)
  useAnimatedReaction(
    () => animatedChartIndex.value,
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(setSelectedChartIndex, current)
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
    if (initialCustomEndDate) return getUnixTime(initialCustomEndDate)
    const defaultDelegationTime =
      durationsWithDays[initialChartIndex ?? defaultDurationIndex] ??
      THREE_MONTHS
    return getStakeEndDate({
      startDateUnix: millisecondsToSeconds(now),
      stakeDurationFormat: defaultDelegationTime.stakeDurationFormat,
      stakeDurationValue: defaultDelegationTime.stakeDurationValue,
      isDeveloperMode: isDeveloperMode
    })
  })
  const [customEndDate, setCustomEndDate] = useState<UTCDate | undefined>(
    initialCustomEndDate
  )
  const [isCustomEndDatePickerVisible, setIsCustomEndDatePickerVisible] =
    useState(false)

  const estimationFee = delegationFeePercent ?? DELEGATION_FEE_FOR_ESTIMATION
  const { data: estimatedRewards } = useStakeEstimatedRewards({
    amount: stakeAmount,
    delegationFee: estimationFee,
    durations: durationsWithDays
  })
  const estimatedRewardsChartData = useMemo(() => {
    return (estimatedRewards ?? []).map((item, index) => {
      return {
        value: item.estimatedTokenReward.toDisplay({ asNumber: true }),
        duration: formatDurationInDays(item.duration.numberOfDays),
        index
      }
    })
  }, [estimatedRewards])
  const { data: estimatedCustomReward } = useStakeEstimatedReward({
    amount: stakeAmount,
    duration:
      customEndDate === undefined
        ? undefined
        : convertToDurationInSeconds(customEndDate),
    delegationFee: estimationFee
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
      // Anchored at the reactive `now` (same clock the confirm screen's
      // "Time to unlock" uses) and rounded — the previous midnight anchor
      // made this row read one day higher than the review right after
      // picking a date.
      return getRoundedDurationInDays(now, customEndDate)
    }
  }, [
    durationsWithDays,
    selectedDurationIndex,
    estimatedRewards,
    defaultDurationIndex,
    customEndDate,
    now
  ])

  // Advanced delegate: the stake can't outlast the selected validator. The
  // custom date picker already caps the max date, but a preset can still
  // overshoot, so we surface the deadline + block proceeding (mirrors
  // core-web's delegation end-time schema). Matches web's date format.
  const nodeEndTimeUnix = useMemo(
    () => (maxEndDate ? getUnixTime(maxEndDate) : undefined),
    [maxEndDate]
  )
  const exceedsNodeEndTime =
    nodeEndTimeUnix !== undefined && stakeEndTime > nodeEndTimeUnix
  const nodeEndTimeLabel = useMemo(
    () => (maxEndDate ? format(maxEndDate, 'MMM dd, yyyy, hh:mm:ss a') : ''),
    [maxEndDate]
  )

  const handlePressNext = useCallback(async () => {
    if (stakeEndTime && !exceedsNodeEndTime) {
      // Compose the URL with a query string instead of `navigate({
      // pathname, params })` — Expo Router's typed `navigate({ pathname
      // })` overload requires `pathname` to be a single literal so it
      // can pick the matching params shape, and our `Route` union is
      // too broad for that narrowing. Embedding the query in a template
      // literal widens the result to `string`, so we cast it back to
      // `Href` (no compile-time route validation here — `nextRoute` is a
      // plain string provided by the caller).
      navigate(`${nextRoute}?stakeEndTime=${stakeEndTime}` as Href)
    }
  }, [navigate, stakeEndTime, nextRoute, exceedsNodeEndTime])

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
    const text = value !== undefined ? `+${value} AVAX` : ''
    return (
      <Text variant="heading6" sx={{ color: '$textSuccess' }}>
        {text}
      </Text>
    )
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

  const summarySection: GroupListItem[] = useMemo(() => {
    const selectedDurationInDays = getDurationInDays()

    return [
      {
        title: 'Staked amount',
        value: `${stakeAmount.toDisplay()} AVAX`
      },
      {
        title: 'Duration',
        value:
          selectedDurationInDays !== undefined
            ? formatDurationInDays(selectedDurationInDays)
            : '',
        accordion: (
          <DurationOptions
            selectedIndex={selectedDurationIndex}
            onSelectDuration={handleSelectDuration}
            customEndDate={customEndDate}
          />
        )
      },
      {
        title: 'Estimated reward',
        value: <StakeTokenUnitValue value={estimatedReward} isReward />
      }
    ]
  }, [
    stakeAmount,
    selectedDurationIndex,
    handleSelectDuration,
    customEndDate,
    getDurationInDays,
    estimatedReward
  ])

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
      <Button
        testID="next_btn"
        accessible={true}
        type="primary"
        size="large"
        disabled={exceedsNodeEndTime}
        onPress={handlePressNext}>
        Next
      </Button>
    )
  }, [handlePressNext, exceedsNodeEndTime])

  return (
    <>
      <ScrollScreen
        title={`How long do you\nwant to stake?`}
        navigationTitle="How long do you want to stake?"
        isModal
        renderFooter={renderFooter}
        contentContainerStyle={{ padding: 16 }}>
        <View sx={{ gap: 12, marginTop: 16 }}>
          <StakeRewardChart
            ref={rewardChartRef}
            initialIndex={initialChartIndex}
            style={{
              height: 270
            }}
            data={estimatedRewardsChartData}
            animatedSelectedIndex={animatedChartIndex}
            renderSelectionTitle={renderSelectionTitle}
            renderSelectionSubtitle={renderSelectionSubtitle}
          />
          <GroupList data={summarySection} />
          {maxEndDate !== undefined && (
            <Text
              variant="caption"
              sx={{
                color: exceedsNodeEndTime ? '$textDanger' : '$textSecondary',
                textAlign: 'center',
                paddingHorizontal: 8
              }}>
              {exceedsNodeEndTime
                ? `This duration runs past the node's end date (${nodeEndTimeLabel}). Choose a shorter duration or a different node.`
                : `Your delegation must end before ${nodeEndTimeLabel}. If that's too soon, choose another node.`}
            </Text>
          )}
        </View>
      </ScrollScreen>
      <StakeCustomEndDatePicker
        customEndDate={customEndDate}
        isVisible={isCustomEndDatePickerVisible}
        setIsVisible={setIsCustomEndDatePickerVisible}
        onDateSelected={handleDateSelected}
        onCancel={handleCancelSelectingCustomEndDate}
        maxDate={maxEndDate}
      />
    </>
  )
}

export default StakeDurationScreen
