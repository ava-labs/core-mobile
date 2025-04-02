import React, { useCallback, useLayoutEffect, useState } from 'react'
import { Linking, ScrollView, StyleSheet, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { Space } from 'components/Space'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
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
  StakeDurationTitle,
  TWO_WEEKS
} from 'services/earn/getStakeEndDate'
import Logger from 'utils/Logger'
import { DOCS_STAKING_URL } from 'resources/Constants'
import { useNow } from 'hooks/time/useNow'
import { BackButton } from 'components/BackButton'
import { Tooltip } from 'components/Tooltip'
import InfoSVG from 'components/svg/InfoSVG'
import AnalyticsService from 'services/analytics/AnalyticsService'
import {
  fromUnixTime,
  getUnixTime,
  millisecondsToSeconds,
  secondsToMilliseconds
} from 'date-fns'
import { UTCDate } from '@date-fns/utc'
import { UnixTime } from 'services/earn/types'
import { useDelegationContext } from 'contexts/DelegationContext'
import { CustomDurationOptionItem } from './components/CustomDurationOptionItem'
import { DurationOptionItem } from './components/DurationOptionItem'

type ScreenProps = StakeSetupScreenProps<
  typeof AppNavigation.StakeSetup.StakingDuration
>

export const StakingDuration = (): JSX.Element => {
  const { stakeAmount } = useDelegationContext()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const currentUnix = millisecondsToSeconds(useNow())
  const minDelegationTime = isDeveloperMode ? ONE_DAY : TWO_WEEKS
  const [selectedDuration, setSelectedDuration] =
    useState<DurationOption>(minDelegationTime)
  const [stakeEndTime, setStakeEndTime] = useState<UnixTime>(
    getStakeEndDate({
      startDateUnix: currentUnix,
      stakeDurationFormat: minDelegationTime.stakeDurationFormat,
      stakeDurationValue: minDelegationTime.stakeDurationValue,
      isDeveloperMode: isDeveloperMode
    })
  )
  const { theme } = useApplicationContext()
  const { navigate, setOptions, goBack } =
    useNavigation<ScreenProps['navigation']>()
  const isNextDisabled =
    stakeEndTime === undefined ||
    (!!stakeEndTime && stakeEndTime < millisecondsToSeconds(UTCDate.now()))

  const selectMinDuration = useCallback(() => {
    setSelectedDuration(minDelegationTime)
    const calculatedStakeEndTime = getStakeEndDate({
      startDateUnix: currentUnix,
      stakeDurationFormat: minDelegationTime.stakeDurationFormat,
      stakeDurationValue: minDelegationTime.stakeDurationValue,
      isDeveloperMode: isDeveloperMode
    })
    setStakeEndTime(calculatedStakeEndTime)
  }, [currentUnix, isDeveloperMode, minDelegationTime])

  useLayoutEffect(() => {
    const isCustomSelected =
      selectedDuration.title === StakeDurationTitle.CUSTOM

    const customGoBack = (): void => {
      isCustomSelected ? selectMinDuration() : goBack()
    }

    setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components
      headerLeft: () => <BackButton onPress={customGoBack} />
    })
  }, [goBack, selectMinDuration, selectedDuration.title, setOptions])

  const onRadioSelect = (durationOption: DurationOption): void => {
    if (selectedDuration?.title === durationOption.title) {
      if (durationOption.title === StakeDurationTitle.CUSTOM) {
        selectMinDuration()
      }
      return
    }

    setSelectedDuration(durationOption)
    const calculatedStakeEndTime = getStakeEndDate({
      startDateUnix: currentUnix,
      stakeDurationFormat: durationOption.stakeDurationFormat,
      stakeDurationValue: durationOption.stakeDurationValue,
      isDeveloperMode: isDeveloperMode
    })
    setStakeEndTime(calculatedStakeEndTime)
  }

  const handleDateConfirm = (dateInput: Date): void => {
    setSelectedDuration(CUSTOM)
    setStakeEndTime(getUnixTime(dateInput))
  }

  const navigateToNodeSearch = (): void => {
    if (stakeEndTime) {
      AnalyticsService.capture('StakeStartNodeSearch', {
        duration: selectedDuration.title,
        from: 'DurationScreen'
      })
      navigate(AppNavigation.StakeSetup.NodeSearch, {
        stakingEndTime: new UTCDate(secondsToMilliseconds(stakeEndTime))
      })
    }
  }

  const navigateToAdvancedStaking = (): void => {
    if (stakeEndTime) {
      AnalyticsService.capture('StakeSelectAdvancedStaking')
      navigate(AppNavigation.StakeSetup.AdvancedStaking, {
        stakingEndTime: new UTCDate(secondsToMilliseconds(stakeEndTime)),
        selectedDuration: selectedDuration.title
      })
    }
  }

  const handleReadMore = (): void => {
    AnalyticsService.capture('StakeOpenStakingDocs', { from: 'DurationScreen' })
    Linking.openURL(DOCS_STAKING_URL).catch(e => {
      Logger.error(DOCS_STAKING_URL, e)
    })
  }

  const renderDurationOptions = (): JSX.Element[] => {
    const durationOptions = isDeveloperMode
      ? DURATION_OPTIONS_FUJI
      : DURATION_OPTIONS_MAINNET

    return durationOptions.map(item => {
      return (
        <DurationOptionItem
          key={item.title}
          stakingAmountNanoAvax={stakeAmount.toSubUnit()}
          item={item}
          isSelected={selectedDuration?.title === item.title}
          onRadioSelect={onRadioSelect}
        />
      )
    })
  }

  const renderCustomOption = (): JSX.Element => (
    <CustomDurationOptionItem
      stakingAmountNanoAvax={stakeAmount.toSubUnit()}
      stakeEndTime={fromUnixTime(stakeEndTime)}
      onRadioSelect={onRadioSelect}
      handleDateConfirm={handleDateConfirm}
    />
  )

  const renderFooter = (): JSX.Element => (
    <View>
      <View style={{ alignItems: 'center' }}>
        <Tooltip
          content={renderPopoverInfoText()}
          style={{ width: 246 }}
          isLabelPopable>
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
        </Tooltip>
      </View>
      <Space y={12} />
      <AvaButton.PrimaryLarge
        testID="next_btn"
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

  const renderPopoverInfoText = (): JSX.Element => (
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
        {selectedDuration?.title !== StakeDurationTitle.CUSTOM
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
