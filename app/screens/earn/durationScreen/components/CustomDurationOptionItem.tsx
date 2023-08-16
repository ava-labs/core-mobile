import React, { useState } from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import {
  CUSTOM,
  DurationOption,
  ONE_DAY,
  TWO_WEEKS
} from 'services/earn/getStakeEndDate'
import { convertToSeconds, MilliSeconds } from 'types/siUnits'
import { View } from 'react-native'
import { RadioButton } from 'components/RadioButton'
import AvaText from 'components/AvaText'
import { Row } from 'components/Row'
import { Space } from 'components/Space'
import { CalendarInput } from 'components/CalendarInput'
import {
  getMaximumStakeEndDate,
  getMinimumStakeEndTime
} from 'services/earn/utils'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { differenceInMilliseconds } from 'date-fns'
import { Avax } from 'types/Avax'
import { useNow } from 'hooks/time/useNow'
import { useAvaxFormatter } from 'hooks/formatter/useAvaxFormatter'

export const CustomDurationOptionItem = ({
  stakeAmount,
  stakeEndTime,
  onRadioSelect,
  handleDateConfirm
}: {
  stakeAmount: Avax
  stakeEndTime: Date
  onRadioSelect: (item: DurationOption) => void
  handleDateConfirm: (dateInput: Date) => void
}) => {
  const avaxFormatter = useAvaxFormatter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const currentDate = useNow()
  const { theme } = useApplicationContext()
  const minDelegationTime = isDeveloperMode ? ONE_DAY : TWO_WEEKS

  const minimumStakeEndDate = getMinimumStakeEndTime(
    isDeveloperMode,
    currentDate
  )
  const maximumStakeEndDate = getMaximumStakeEndDate()

  const stakeDurationUnixMs = differenceInMilliseconds(
    stakeEndTime,
    currentDate
  )

  const stakeDurationUnixSec = convertToSeconds(
    BigInt(stakeDurationUnixMs) as MilliSeconds
  )
  const { data } = useEarnCalcEstimatedRewards({
    amount: stakeAmount,
    duration: stakeDurationUnixSec,
    delegationFee: 2
  })

  const [estimatedRewardsInAvax] = avaxFormatter(
    data?.estimatedTokenReward,
    true
  )

  return (
    <View
      style={{
        opacity: isDatePickerVisible ? 0.3 : 1
      }}>
      <View style={{ marginBottom: 24 }}>
        <RadioButton
          onPress={() => {
            onRadioSelect(minDelegationTime)
          }}
          selected={true}>
          <View style={{ marginLeft: 10 }}>
            <AvaText.Body1 textStyle={{ color: theme.colorText1 }}>
              {CUSTOM.title}
            </AvaText.Body1>
            <AvaText.Caption textStyle={{ color: theme.colorText1 }}>
              {`Estimated Rewards: ${estimatedRewardsInAvax} AVAX`}
            </AvaText.Caption>
          </View>
        </RadioButton>
      </View>
      <Row style={{ alignItems: 'center' }}>
        <AvaText.Heading3
          textStyle={{ color: theme.colorText1, fontWeight: '600' }}>
          Approximate End Date
        </AvaText.Heading3>
        <Space x={8} />
      </Row>
      <CalendarInput
        date={stakeEndTime}
        onDateSelected={handleDateConfirm}
        isDatePickerVisible={isDatePickerVisible}
        setIsDatePickerVisible={setIsDatePickerVisible}
        placeHolder="Select a date"
        minimumDate={minimumStakeEndDate}
        maximumDate={maximumStakeEndDate}
      />
      <AvaText.Caption textStyle={{ color: theme.neutral300 }}>
        Actual end date will vary depending on options available
      </AvaText.Caption>
    </View>
  )
}
