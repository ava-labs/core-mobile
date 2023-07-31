import React, { useState } from 'react'
import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation, useRoute } from '@react-navigation/native'
import { StakeSetupScreenProps } from 'navigation/types'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  CUSTOM,
  DURATION_OPTIONS_FUJI,
  DURATION_OPTIONS_MAINNET,
  DurationOption,
  getStakeEndDate,
  ONE_DAY,
  TWO_WEEKS
} from 'services/earn/getStakeEndDate'
import InfoSVG from 'components/svg/InfoSVG'
import { Popable } from 'react-native-popable'
import Logger from 'utils/Logger'
import { DOCS_STAKING } from 'resources/Constants'
import { useNow } from 'hooks/useNow'
import { CustomDurationOptionItem } from './components/CustomDurationOptionItem'
import { DurationOptionItem } from './components/DurationOptionItem'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.StakingDuration
>

export const StakingDuration = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const currentDate = useNow()
  const minDelegationTime = isDeveloperMode ? ONE_DAY : TWO_WEEKS
  const [selectedDuration, setSelectedDuration] =
    useState<DurationOption>(minDelegationTime)
  const [stakeEndTime, setStakeEndTime] = useState<Date>(
    getStakeEndDate(
      currentDate,
      minDelegationTime.stakeDurationFormat,
      minDelegationTime.stakeDurationValue,
      isDeveloperMode
    )
  )
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<ScreenProps['navigation']>()
  const { stakingAmount } = useRoute<ScreenProps['route']>().params
  const isNextDisabled =
    stakeEndTime === undefined || (stakeEndTime && stakeEndTime < new Date())

  const onRadioSelect = (durationOption: DurationOption) => {
    if (selectedDuration?.title === durationOption.title) {
      if (durationOption.title === 'Custom') {
        setSelectedDuration(minDelegationTime)
        const calculatedStakeEndTime = getStakeEndDate(
          currentDate,
          minDelegationTime.stakeDurationFormat,
          minDelegationTime.stakeDurationValue,
          isDeveloperMode
        )
        setStakeEndTime(calculatedStakeEndTime)
      }
      return
    }

    setSelectedDuration(durationOption)
    const calculatedStakeEndTime = getStakeEndDate(
      currentDate,
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
      navigate(AppNavigation.StakeSetup.NodeSearch, {
        stakingAmount,
        stakingEndTime: stakeEndTime
      })
    }
  }

  const navigateToAdvancedStaking = () => {
    if (stakeEndTime) {
      navigate(AppNavigation.StakeSetup.AdvancedStaking, {
        stakingAmount,
        stakingEndTime: stakeEndTime
      })
    }
  }

  const handleReadMore = () => {
    Linking.openURL(DOCS_STAKING).catch(e => {
      Logger.error(DOCS_STAKING, e)
    })
  }

  const renderDurationOptions = () => {
    const durationOptions = isDeveloperMode
      ? DURATION_OPTIONS_FUJI
      : DURATION_OPTIONS_MAINNET

    return durationOptions.map(item => {
      return (
        <DurationOptionItem
          key={item.title}
          stakeAmount={stakingAmount}
          item={item}
          isSelected={selectedDuration?.title === item.title}
          onRadioSelect={onRadioSelect}
        />
      )
    })
  }

  const renderCustomOption = () => (
    <CustomDurationOptionItem
      stakeAmount={stakingAmount}
      stakeEndTime={stakeEndTime}
      onRadioSelect={onRadioSelect}
      handleDateConfirm={handleDateConfirm}
    />
  )

  const renderFooter = () => (
    <View>
      <Popable
        content={renderPopoverInfoText()}
        position={'top'}
        style={{ minWidth: 246 }}
        backgroundColor={theme.neutral100}>
        <AvaText.Caption
          textStyle={{
            color: theme.neutral400,
            textAlign: 'center',
            lineHeight: 20,
            marginHorizontal: 40
          }}>
          Estimates are provided for informational purposes only...
          <Space x={8} />
          <InfoSVG size={13.33} />
        </AvaText.Caption>
      </Popable>
      <Space y={12} />
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
  )

  const renderPopoverInfoText = () => (
    <View
      style={{
        marginHorizontal: 8,
        marginVertical: 4,
        backgroundColor: theme.neutral100
      }}>
      <AvaText.Caption textStyle={{ color: theme.neutral900 }}>
        Estimates are provided for informational purposes only, without any
        representation, warranty or guarantee, and do not represent any
        assurance that you will achieve the same results.
      </AvaText.Caption>
      <Space y={16} />
      <AvaText.Caption
        textStyle={{ color: theme.blueDark, fontWeight: '600' }}
        onPress={handleReadMore}>
        Read More
      </AvaText.Caption>
    </View>
  )

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
        {selectedDuration?.title !== 'Custom'
          ? renderDurationOptions()
          : renderCustomOption()}
      </View>
      {renderFooter()}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  }
})
