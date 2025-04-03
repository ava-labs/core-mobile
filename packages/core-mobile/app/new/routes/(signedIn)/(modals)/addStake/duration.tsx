import React, { useMemo, useCallback, useState, useRef } from 'react'
import {
  Button,
  GroupList,
  GroupListItem,
  SafeAreaView,
  ScrollView,
  StakeRewardChart,
  StakeRewardChartHandle,
  Text,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import { useDelegationContext } from 'contexts/DelegationContext'
import { useRouter } from 'expo-router'
import { useSelector } from 'react-redux'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useNativeTokenPriceForNetwork } from 'hooks/networks/useNativeTokenPriceForNetwork'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ChainId } from '@avalabs/core-chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useStakeEstimatedRewards } from 'features/stake/hooks/useStakeEstimatedRewards'
import {
  DURATION_OPTIONS_FUJI,
  DURATION_OPTIONS_MAINNET,
  DURATION_OPTIONS_WITH_DAYS_FUJI,
  DURATION_OPTIONS_WITH_DAYS_MAINNET,
  DurationOptionWithDays
} from 'services/earn/getStakeEndDate'
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated'
import { StakeTokenUnitValue } from 'features/stake/components/StakeTokenUnitValue'
import { DurationOptions } from 'features/stake/components/DurationOptionsAccordion'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'

const StakeDurationScreen = (): JSX.Element => {
  const { navigate } = useRouter()
  const { stakeAmount } = useDelegationContext()
  const { getNetwork } = useNetworks()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const chainId = isDeveloperMode
    ? ChainId.AVALANCHE_TESTNET_ID
    : ChainId.AVALANCHE_MAINNET_ID
  const avaxNetwork = getNetwork(chainId)
  const selectedCurrency = useSelector(selectSelectedCurrency)
  const { nativeTokenPrice } = useNativeTokenPriceForNetwork(
    avaxNetwork,
    selectedCurrency.toLowerCase() as VsCurrencyType
  )
  const { formatCurrency } = useFormatCurrency()
  const durations: DurationOptionWithDays[] = useMemo(() => {
    return isDeveloperMode
      ? DURATION_OPTIONS_WITH_DAYS_FUJI
      : DURATION_OPTIONS_WITH_DAYS_MAINNET
  }, [isDeveloperMode])

  const { data: estimatedRewards } = useStakeEstimatedRewards({
    amount: stakeAmount,
    delegationFee: DELEGATION_FEE_FOR_ESTIMATION,
    durations
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

  const rewardChartRef = useRef<StakeRewardChartHandle>(null)

  const initialIndex = 2
  const selectedChartIndex = useSharedValue<number | undefined>(initialIndex)
  // Mirror the shared value to a state variable so that React re-renders when it changes.
  const [selectedChartIndexState, setSelectedChartIndexState] = useState<
    number | undefined
  >(initialIndex)
  useAnimatedReaction(
    () => selectedChartIndex.value,
    (current, previous) => {
      if (current !== previous) {
        runOnJS(setSelectedChartIndexState)(current)
      }
    }
  )

  const handleSelectDuration = useCallback(
    (selectedIndex: number): void => {
      rewardChartRef.current?.selectIndex(
        durations[selectedIndex] === undefined ? undefined : selectedIndex
      )
    },
    [durations]
  )

  const inputSection: GroupListItem[] = useMemo(() => {
    return [
      {
        title: 'Stake amount',
        value: `${stakeAmount.toDisplay()} AVAX`
      },
      {
        title: 'Duration',
        value:
          selectedChartIndexState !== undefined
            ? `${estimatedRewards?.[selectedChartIndexState]?.duration.numberOfDays} days`
            : '',
        accordion: (
          <DurationOptions
            selectedIndex={selectedChartIndexState}
            durations={
              isDeveloperMode ? DURATION_OPTIONS_FUJI : DURATION_OPTIONS_MAINNET
            }
            onSelectDuration={handleSelectDuration}
          />
        )
      }
    ]
  }, [
    stakeAmount,
    selectedChartIndexState,
    estimatedRewards,
    isDeveloperMode,
    handleSelectDuration
  ])

  const rewardSection: GroupListItem[] = useMemo(() => {
    return [
      {
        title: 'Estimated rewards',
        value:
          selectedChartIndexState !== undefined ? (
            <StakeTokenUnitValue
              value={
                estimatedRewards?.[selectedChartIndexState]
                  ?.estimatedTokenReward
              }
              textSx={{ fontWeight: 600 }}
            />
          ) : undefined
      }
    ]
  }, [estimatedRewards, selectedChartIndexState])

  const handlePressNext = useCallback(async () => {
    navigate('/addStake/review')
  }, [navigate])

  const renderSelectionTitle = useCallback(() => {
    const text =
      selectedChartIndexState !== undefined
        ? `${
            estimatedRewardsChartData[selectedChartIndexState]?.value ?? 0
          } AVAX`
        : ''
    return <Text variant="heading6">{text}</Text>
  }, [selectedChartIndexState, estimatedRewardsChartData])

  const renderSelectionSubtitle = useCallback(() => {
    const text =
      selectedChartIndexState !== undefined
        ? formatCurrency({
            amount:
              (estimatedRewardsChartData[selectedChartIndexState]?.value ?? 0) *
              nativeTokenPrice
          })
        : ''

    return (
      <Text variant="caption" sx={{ color: '$textSecondary' }}>
        {text}
      </Text>
    )
  }, [
    selectedChartIndexState,
    estimatedRewardsChartData,
    nativeTokenPrice,
    formatCurrency
  ])

  return (
    <KeyboardAvoidingView>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerSx={{ padding: 16, paddingTop: 0 }}>
          <ScreenHeader title="For how long would you like to stake?" />
          <View sx={{ gap: 12 }}>
            <StakeRewardChart
              ref={rewardChartRef}
              initialIndex={initialIndex}
              style={{
                marginTop: 16,
                height: 270
              }}
              data={estimatedRewardsChartData}
              selectedIndex={selectedChartIndex}
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
        </ScrollView>
        <View
          sx={{
            padding: 16
          }}>
          <Button type="primary" size="large" onPress={handlePressNext}>
            Next
          </Button>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const DELEGATION_FEE_FOR_ESTIMATION = 2

export default StakeDurationScreen
