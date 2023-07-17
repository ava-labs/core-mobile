import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import { RadioButton } from 'components/RadioButton'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import InfoSVG from 'components/svg/InfoSVG'
import { Row } from 'components/Row'
import { CalendarInput } from 'components/CalendarInput'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { EarnScreenProps } from 'navigation/types'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  getMaximumStakeEndDate,
  getMinimumStakeEndTime
} from 'services/earn/utils'
import {
  CUSTOM,
  DURATION_OPTIONS_FUJI,
  DURATION_OPTIONS_MAINNET,
  DurationOption,
  getStakeDuration,
  getStakeEndDate,
  ONE_DAY,
  TWO_WEEKS
} from 'services/earn/getStakeEndDate'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import { BigIntNavax } from 'types/denominations'

type EarnScreenNavProps = EarnScreenProps<
  typeof AppNavigation.Earn.StakingDuration
>

const StakingDuration = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const minDelegationTime = isDeveloperMode ? ONE_DAY : TWO_WEEKS
  const [selectedDuration, setSelectedDuration] =
    useState<DurationOption>(minDelegationTime)
  const [stakeEndTime, setStakeEndTime] = useState<Date>(
    getStakeEndDate(
      minDelegationTime.stakeDurationFormat,
      minDelegationTime.stakeDurationValue,
      isDeveloperMode
    )
  )

  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<EarnScreenNavProps['navigation']>()
  const { stakingAmount } = useRoute<EarnScreenNavProps['route']>().params
  const minimumStakeEndDate = getMinimumStakeEndTime(
    isDeveloperMode,
    new Date()
  )
  const maximumStakeEndDate = getMaximumStakeEndDate()
  const isNextDisabled =
    stakeEndTime === undefined || (stakeEndTime && stakeEndTime < new Date())

  const onRadioSelect = (durationOption: DurationOption) => {
    if (selectedDuration?.title === durationOption.title) {
      return
    }
    setSelectedDuration(durationOption)
    const calculatedStakeEndTime = getStakeEndDate(
      durationOption.stakeDurationFormat,
      durationOption.stakeDurationValue,
      isDeveloperMode
    )
    setStakeEndTime(calculatedStakeEndTime)
  }

  const handleDateConfirm = (dateInput: Date) => {
    setSelectedDuration(CUSTOM)
    setStakeEndTime(dateInput)
  }

  const navigateToNodeSearch = () => {
    if (stakeEndTime) {
      navigate(AppNavigation.Earn.NodeSearch, {
        stakingAmount,
        stakingEndTime: stakeEndTime
      })
    }
  }

  const navigateToAdvancedStaking = () => {
    if (stakeEndTime) {
      navigate(AppNavigation.Earn.AdvancedStaking, {
        stakingAmount,
        stakingEndTime: stakeEndTime
      })
    }
  }

  const renderDurationOptions = (stakeAmount: BigIntNavax) => {
    const durationOptions = isDeveloperMode
      ? DURATION_OPTIONS_FUJI
      : DURATION_OPTIONS_MAINNET

    return durationOptions.map(item => {
      return (
        <DurationOptionItem
          key={item.title}
          stakeAmount={stakeAmount}
          item={item}
          isDeveloperMode={isDeveloperMode}
          isSelected={selectedDuration?.title === item.title}
          onRadioSelect={onRadioSelect}
        />
      )
    })
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <AvaText.LargeTitleBold>Duration</AvaText.LargeTitleBold>
        <AvaText.Subtitle1
          textStyle={{
            marginTop: 7,
            color: theme.colorText1,
            marginBottom: 32
          }}>
          How long would you like to stake?
        </AvaText.Subtitle1>
        {selectedDuration?.title !== 'Custom' ? (
          renderDurationOptions(stakingAmount)
        ) : (
          <>
            <View style={{ marginBottom: 24 }}>
              <RadioButton
                onPress={() => {
                  const firstItem = selectedDuration
                  firstItem && onRadioSelect(firstItem)
                }}
                selected={true}>
                <View style={{ marginLeft: 10 }}>
                  <AvaText.Body1 textStyle={{ color: theme.colorText1 }}>
                    {selectedDuration.title}
                  </AvaText.Body1>
                  <AvaText.Caption textStyle={{ color: theme.colorText1 }}>
                    {selectedDuration.subTitle}
                  </AvaText.Caption>
                </View>
              </RadioButton>
            </View>
            <Row style={{ alignItems: 'center' }}>
              <AvaText.Heading3
                textStyle={{ color: theme.colorText1, fontWeight: '600' }}>
                End Date
              </AvaText.Heading3>
              <Space x={8} />
              <InfoSVG />
            </Row>
            <CalendarInput
              date={stakeEndTime}
              onDateSelected={handleDateConfirm}
              placeHolder="Select a date"
              minimumDate={minimumStakeEndDate}
              maximumDate={maximumStakeEndDate}
            />
            <AvaText.Caption textStyle={{ color: theme.neutral300 }}>
              Actual end date will vary depending on options available
            </AvaText.Caption>
          </>
        )}
      </View>

      <View>
        <AvaButton.PrimaryLarge
          disabled={isNextDisabled}
          onPress={() => navigateToNodeSearch()}>
          Next
        </AvaButton.PrimaryLarge>
        <AvaButton.TextLink
          textColor={theme.colorPrimary1}
          onPress={() => navigateToAdvancedStaking()}>
          Advanced Set Up
        </AvaButton.TextLink>
      </View>
    </ScrollView>
  )
}

const DurationOptionItem = ({
  stakeAmount,
  item,
  isDeveloperMode,
  onRadioSelect,
  isSelected
}: {
  stakeAmount: BigIntNavax
  item: DurationOption
  isDeveloperMode: boolean
  onRadioSelect: (item: DurationOption) => void
  isSelected: boolean
}) => {
  const { theme } = useApplicationContext()
  const stakeDurationUnixMs = getStakeDuration(
    item.stakeDurationFormat,
    item.stakeDurationValue,
    isDeveloperMode
  )
  const stakeDurationUnixSec = stakeDurationUnixMs / 1e3
  const { data } = useEarnCalcEstimatedRewards({
    amount: stakeAmount,
    duration: stakeDurationUnixSec,
    delegationFee: 2
  })

  return (
    <View style={{ marginBottom: 24 }} key={item.title}>
      <RadioButton onPress={() => onRadioSelect(item)} selected={isSelected}>
        <View style={{ marginLeft: 10 }}>
          <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
            {item.title}
          </AvaText.Body2>
          <AvaText.Caption textStyle={{ color: theme.colorText2 }}>
            Estimated Rewards: {data?.estimatedTokenReward?.toString() || '0'}{' '}
            AVAX
          </AvaText.Caption>
        </View>
      </RadioButton>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  }
})

export default StakingDuration
