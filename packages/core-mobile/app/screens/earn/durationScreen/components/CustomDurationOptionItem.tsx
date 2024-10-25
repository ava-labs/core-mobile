import React, { useMemo, useState } from 'react'
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
import { UTCDate } from '@date-fns/utc'

export const CustomDurationOptionItem = ({
  stakeAmount,
  stakeEndTime,
  onRadioSelect,
  handleDateConfirm
}: {
  stakeAmount: Avax
  stakeEndTime: UTCDate
  onRadioSelect: (item: DurationOption) => void
  handleDateConfirm: (dateInput: UTCDate) => void
}): JSX.Element => {
  const avaxFormatter = useAvaxFormatter()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const currentUnix = useNow()
  const { theme } = useApplicationContext()
  const minDelegationTime = isDeveloperMode ? ONE_DAY : TWO_WEEKS
  const stakeEndTimeLocal = useMemo(
    () => new Date(stakeEndTime.getTime()),
    [stakeEndTime]
  )

  const minimumStakeEndDate = getMinimumStakeEndTime(
    isDeveloperMode,
    new UTCDate(currentUnix)
  )
  const maximumStakeEndDate = getMaximumStakeEndDate()

  const stakeDurationMs = differenceInMilliseconds(
    stakeEndTime,
    new UTCDate(currentUnix)
  )

  const stakeDurationSec = convertToSeconds(
    BigInt(stakeDurationMs) as MilliSeconds
  )
  const { data } = useEarnCalcEstimatedRewards({
    amount: stakeAmount,
    duration: stakeDurationSec,
    delegationFee: 2
  })

  const [estimatedRewardsInAvax] = avaxFormatter(
    data?.estimatedTokenReward,
    true
  )

  function handleDateSelected(date: Date): void {
    handleDateConfirm(new UTCDate(date.getTime()))
  }

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
        date={stakeEndTimeLocal}
        onDateSelected={handleDateSelected}
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
