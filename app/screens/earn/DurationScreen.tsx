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
import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'

type EarnScreenNavProps = EarnScreenProps<
  typeof AppNavigation.Earn.StakingDuration
>

type DurationOption = {
  title: string
  subTitle: string
  getStakeEndDate: () => Date
}

const StakingDuration = () => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const durationOptions: DurationOption[] = [
    {
      title: '2 Week',
      subTitle: 'Estimated Rewards: 0.77 AVAX',
      getStakeEndDate: () => addWeeks(new Date(), 2)
    },
    {
      title: '1 Month',
      subTitle: 'Estimated Rewards: 1.54 AVAX',
      getStakeEndDate: () => addMonths(new Date(), 1)
    },
    {
      title: '3 Months',
      subTitle: 'Estimated Rewards: 3.54 AVAX',
      getStakeEndDate: () => addMonths(new Date(), 3)
    },
    {
      title: '6 Months',
      subTitle: 'Estimated Rewards: 6.54 AVAX',
      getStakeEndDate: () => addMonths(new Date(), 6)
    },
    {
      title: '1 Year',
      subTitle: 'Estimated Rewards: 12.54 AVAX',
      getStakeEndDate: () => addYears(new Date(), 1)
    },
    {
      title: 'Custom',
      subTitle: 'Enter your desired end date',
      getStakeEndDate: () =>
        isDeveloperMode ? addDays(new Date(), 1) : addWeeks(new Date(), 2)
    }
  ]

  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(
    durationOptions[0]!
  )
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<EarnScreenNavProps['navigation']>()
  const { stakingAmount } = useRoute<EarnScreenNavProps['route']>().params

  const minimumStakeEndDate = isDeveloperMode
    ? addDays(new Date(), 1)
    : addWeeks(new Date(), 2)

  const onRadioSelect = (durationOption: DurationOption) => {
    if (selectedDuration?.title === durationOption.title) {
      return
    }
    setSelectedDuration(durationOption)
  }

  const handleDateConfirm = (dateInput: Date) => {
    setSelectedDuration(prev => {
      return { ...prev, calculateDuration: () => dateInput }
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
          durationOptions.map(item => {
            return (
              <View style={{ marginBottom: 24 }} key={item.title}>
                <RadioButton
                  onPress={() => onRadioSelect(item)}
                  selected={selectedDuration?.title === item.title}>
                  <View style={{ marginLeft: 10 }}>
                    <AvaText.Body2 textStyle={{ color: theme.colorText1 }}>
                      {item.title}
                    </AvaText.Body2>
                    <AvaText.Caption textStyle={{ color: theme.colorText2 }}>
                      {item.subTitle}
                    </AvaText.Caption>
                  </View>
                </RadioButton>
              </View>
            )
          })
        ) : (
          <>
            <View style={{ marginBottom: 24 }}>
              <RadioButton
                onPress={() => {
                  const firstItem = durationOptions.at(0)
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
              date={selectedDuration.getStakeEndDate()}
              onDateSelected={handleDateConfirm}
              placeHolder="Select a date"
              minimumDate={minimumStakeEndDate}
              maximumDate={addYears(new Date(), 1)}
            />
            <AvaText.Caption textStyle={{ color: theme.neutral300 }}>
              Actual end date will vary depending on options available
            </AvaText.Caption>
          </>
        )}
      </View>

      <View>
        <AvaButton.PrimaryLarge
          disabled={selectedDuration.getStakeEndDate() < new Date()}
          onPress={() => {
            navigate(AppNavigation.Earn.NodeSearch, {
              stakingEndTime: selectedDuration.getStakeEndDate(),
              stakingAmount
            })
          }}>
          Next
        </AvaButton.PrimaryLarge>
        <AvaButton.TextLink
          textColor={theme.colorPrimary1}
          onPress={() =>
            navigate(AppNavigation.Earn.AdvancedStaking, {
              stakingAmount,
              stakingEndTime: selectedDuration.getStakeEndDate()
            })
          }>
          Advanced Set Up
        </AvaButton.TextLink>
      </View>
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

export default StakingDuration
