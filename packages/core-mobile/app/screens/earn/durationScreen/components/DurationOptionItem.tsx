import React from 'react'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { useEarnCalcEstimatedRewards } from 'hooks/earn/useEarnCalcEstimatedRewards'
import {
  DurationOption,
  StakeDurationTitle,
  getStakeDuration
} from 'services/earn/getStakeEndDate'
import { MilliSeconds, convertToSeconds } from 'types/siUnits'
import { View } from 'react-native'
import { RadioButton } from 'components/RadioButton'
import AvaText from 'components/AvaText'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { useSelector } from 'react-redux'
import { UNKNOWN_AMOUNT } from 'consts/amount'

export const DurationOptionItem = ({
  stakingAmountNanoAvax,
  item,
  onRadioSelect,
  isSelected
}: {
  stakingAmountNanoAvax: bigint
  item: DurationOption
  onRadioSelect: (item: DurationOption) => void
  isSelected: boolean
}): JSX.Element => {
  const { theme } = useApplicationContext()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const stakeDurationUnixMs = getStakeDuration(
    item.stakeDurationFormat,
    item.stakeDurationValue,
    isDeveloperMode
  )
  const stakeDurationUnixSec = convertToSeconds(
    BigInt(stakeDurationUnixMs) as MilliSeconds
  )
  const { data } = useEarnCalcEstimatedRewards({
    amountNanoAvax: stakingAmountNanoAvax,
    duration: stakeDurationUnixSec,
    delegationFee: 2
  })

  const estimatedRewardsInAvax = data?.estimatedTokenReward

  return (
    <View style={{ marginBottom: 24 }} key={item.title}>
      <RadioButton onPress={() => onRadioSelect(item)} selected={isSelected}>
        <View style={{ marginLeft: 10 }}>
          <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
            {item.title}
          </AvaText.Body2>
          <AvaText.Caption textStyle={{ color: theme.colorText2 }}>
            {item.title !== StakeDurationTitle.CUSTOM
              ? `Estimated Rewards: ${
                  estimatedRewardsInAvax?.toDisplay() ?? UNKNOWN_AMOUNT
                } AVAX`
              : 'Enter your desired end date'}
          </AvaText.Caption>
        </View>
      </RadioButton>
    </View>
  )
}
